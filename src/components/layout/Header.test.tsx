import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { tokenStorage } from '../../api/token'
import { fakeResponse, makeUser, renderWithAuth } from '../../test-utils'
import { Header } from './Header'
import { ProtectedRoute } from './ProtectedRoute'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
})

/** Renderiza o cabecalho com uma sessao valida ja reidratada. */
async function renderAutenticado() {
  tokenStorage.set('token-valido')
  fetchMock.mockResolvedValue(fakeResponse(makeUser({ name: 'Maria Silva' })))

  renderWithAuth(<Header />)
  await screen.findByRole('button', { name: /sair/i })
}

describe('Header: visitante', () => {
  it('oferece o acesso de docentes', async () => {
    renderWithAuth(<Header />)

    const entrar = await screen.findByRole('link', { name: /entrar/i })
    expect(entrar).toHaveAttribute('href', '/login')
  })

  it('nao mostra atalhos de area restrita', async () => {
    renderWithAuth(<Header />)
    await screen.findByRole('link', { name: /entrar/i })

    expect(
      screen.queryByRole('link', { name: /administração/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sair/i })).not.toBeInTheDocument()
  })
})

describe('Header: docente autenticado', () => {
  it('mostra o nome de quem esta logado', async () => {
    await renderAutenticado()

    expect(screen.getByText(/olá, maria silva/i)).toBeInTheDocument()
  })

  it('oferece atalho para a area administrativa', async () => {
    await renderAutenticado()

    expect(
      screen.getByRole('link', { name: /administração/i }),
    ).toHaveAttribute('href', '/admin')
  })

  it('nao oferece mais o "Entrar"', async () => {
    await renderAutenticado()

    expect(screen.queryByRole('link', { name: /^entrar$/i })).not.toBeInTheDocument()
  })
})

describe('Header: sair', () => {
  it('descarta o token guardado', async () => {
    const user = userEvent.setup()
    await renderAutenticado()

    await user.click(screen.getByRole('button', { name: /sair/i }))

    await waitFor(() => expect(tokenStorage.get()).toBeNull())
  })

  it('volta a oferecer o acesso de docentes', async () => {
    const user = userEvent.setup()
    await renderAutenticado()

    await user.click(screen.getByRole('button', { name: /sair/i }))

    expect(
      await screen.findByRole('link', { name: /entrar/i }),
    ).toBeInTheDocument()
  })
})

describe('Header: acessibilidade', () => {
  it('a navegacao de docentes tem nome acessivel', async () => {
    renderWithAuth(<Header />)

    // Sem o rotulo, um leitor de tela anunciaria apenas "navegação" e a
    // pessoa nao saberia o que ha ali.
    expect(
      await screen.findByRole('navigation', { name: /acesso de docentes/i }),
    ).toBeInTheDocument()
  })

  it('o titulo do site leva a home', async () => {
    renderWithAuth(<Header />)

    expect(
      await screen.findByRole('link', { name: /blog acadêmico/i }),
    ).toHaveAttribute('href', '/')
  })
})

describe('Header: sair a partir de uma rota protegida', () => {
  it('leva para a home, e nao para a tela de login', async () => {
    const user = userEvent.setup()
    tokenStorage.set('token-valido')
    fetchMock.mockResolvedValue(fakeResponse(makeUser()))

    // Reproduz o cenario real: cabecalho junto de uma rota protegida.
    renderWithAuth(
      <>
        <Header />
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<h1>Administração</h1>} />
          </Route>
          <Route path="/" element={<h1>Postagens</h1>} />
          <Route path="/login" element={<h1>Entrar na conta</h1>} />
        </Routes>
      </>,
      { route: '/admin' },
    )
    await screen.findByRole('heading', { name: 'Administração' })

    await user.click(screen.getByRole('button', { name: /sair/i }))

    // Quem acabou de sair nao pode encarar um formulario de login: pareceria
    // que precisa entrar de novo.
    expect(
      await screen.findByRole('heading', { name: 'Postagens' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Entrar na conta' }),
    ).not.toBeInTheDocument()
  })
})
