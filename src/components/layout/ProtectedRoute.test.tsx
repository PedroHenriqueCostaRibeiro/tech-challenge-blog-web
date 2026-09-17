import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { tokenStorage } from '../../api/token'
import userEvent from '@testing-library/user-event'
import { fakeResponse, makeUser, nuncaResolve, renderWithAuth } from '../../test-utils'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'

/** Botao minimo de logout, para nao arrastar o Header inteiro para o teste. */
function BotaoSair() {
  const { logout } = useAuth()
  return <button type="button" onClick={logout}>Sair</button>
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
})

/** Monta uma rota protegida e uma tela de login para onde redirecionar. */
function renderGuarda(route = '/admin') {
  return renderWithAuth(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<h1>Área restrita</h1>} />
      </Route>
      <Route path="/login" element={<h1>Entrar</h1>} />
    </Routes>,
    { route },
  )
}

describe('ProtectedRoute: sem sessao', () => {
  it('redireciona para o login quando nao ha token', async () => {
    renderGuarda()

    expect(
      await screen.findByRole('heading', { name: 'Entrar' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Área restrita')).not.toBeInTheDocument()
  })

  it('redireciona quando o token e invalido (API responde 401)', async () => {
    tokenStorage.set('token-adulterado')
    fetchMock.mockResolvedValue(
      fakeResponse({ error: 'Token invalido ou expirado.' }, 401),
    )

    renderGuarda()

    expect(
      await screen.findByRole('heading', { name: 'Entrar' }),
    ).toBeInTheDocument()
  })

  it('descarta o token invalido do armazenamento', async () => {
    tokenStorage.set('token-adulterado')
    fetchMock.mockResolvedValue(fakeResponse({ error: 'Token invalido.' }, 401))

    renderGuarda()
    await screen.findByRole('heading', { name: 'Entrar' })

    // Manter um token comprovadamente invalido faria a aplicacao tentar
    // reidratar a sessao a cada carregamento, sempre falhando.
    expect(tokenStorage.get()).toBeNull()
  })
})

describe('ProtectedRoute: com sessao', () => {
  it('libera o acesso quando o token e valido', async () => {
    tokenStorage.set('token-valido')
    fetchMock.mockResolvedValue(fakeResponse(makeUser()))

    renderGuarda()

    expect(
      await screen.findByRole('heading', { name: 'Área restrita' }),
    ).toBeInTheDocument()
  })
})

describe('ProtectedRoute: o estado de verificacao (bug do F5)', () => {
  /**
   * Este e o caso que mais importa.
   *
   * Logo apos um F5, o token esta no localStorage mas a aplicacao ainda nao
   * sabe se ele e valido -- a chamada a /auth/me esta em andamento. Tratar
   * esse instante como "anonimo" expulsaria o usuario logado a cada
   * recarregamento.
   */
  it('NAO redireciona enquanto a sessao esta sendo verificada', async () => {
    tokenStorage.set('token-valido')
    fetchMock.mockReturnValue(nuncaResolve()) // /auth/me pendente para sempre

    renderGuarda()

    // Deixa o React processar efeitos; ainda assim nao pode ter redirecionado.
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/verificando/i),
    )
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('mostra indicador de carregamento durante a verificacao', async () => {
    tokenStorage.set('token-valido')
    fetchMock.mockReturnValue(nuncaResolve())

    renderGuarda()

    expect(await screen.findByRole('status')).toHaveTextContent(
      /verificando sua sessão/i,
    )
  })

  it('libera o acesso assim que a verificacao confirma o token', async () => {
    tokenStorage.set('token-valido')
    fetchMock.mockResolvedValue(fakeResponse(makeUser()))

    renderGuarda()

    // Estado de verificacao primeiro, area restrita depois: nunca o login.
    expect(
      await screen.findByRole('heading', { name: 'Área restrita' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()
  })
})

describe('ProtectedRoute: destino depende de como a pessoa chegou ao estado anonimo', () => {
  /**
   * Do ponto de vista do status, os dois casos sao identicos: anonimo numa
   * rota protegida. Mas merecem destinos diferentes, e e a guarda que faz essa
   * distincao -- nao o botao de sair.
   *
   * Tentar resolver isso navegando a partir do Header nao funciona: o React
   * agrupa a troca de rota com a mudanca de status e a guarda decide primeiro.
   * Adiar com setTimeout chegou a passar no jsdom, mas o navegador real
   * continuava indo para /login. Por isso a decisao mora aqui.
   */
  it('quem nunca teve sessao vai para o login', async () => {
    renderGuarda()

    expect(
      await screen.findByRole('heading', { name: 'Entrar' }),
    ).toBeInTheDocument()
  })

  it('quem estava logado e saiu volta para o blog publico', async () => {
    tokenStorage.set('token-valido')
    fetchMock.mockResolvedValue(fakeResponse(makeUser()))

    renderWithAuth(
      <>
        <BotaoSair />
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<h1>Área restrita</h1>} />
          </Route>
          <Route path="/" element={<h1>Postagens</h1>} />
          <Route path="/login" element={<h1>Entrar</h1>} />
        </Routes>
      </>,
      { route: '/admin' },
    )
    await screen.findByRole('heading', { name: 'Área restrita' })

    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }))

    expect(
      await screen.findByRole('heading', { name: 'Postagens' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()
  })
})
