import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { tokenStorage } from '../../api/token'
import {
  fakeResponse,
  makeUser,
  nuncaResolve,
  renderWithAuth,
} from '../../test-utils'
import Login from './index'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
})

/** Login mais um destino, para observar o redirecionamento apos entrar. */
function renderLogin(route = '/login') {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<h1>Administração</h1>} />
    </Routes>,
    { route },
  )
}

async function preencherEEnviar(email: string, senha: string) {
  const user = userEvent.setup()

  if (email) await user.type(screen.getByLabelText(/e-mail/i), email)
  if (senha) await user.type(screen.getByLabelText(/senha/i), senha)
  await user.click(screen.getByRole('button', { name: /entrar/i }))

  return user
}

describe('Login: caminho feliz', () => {
  it('autentica e redireciona para a area administrativa', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ token: 'token-novo', user: makeUser() }),
    )

    renderLogin()
    await preencherEEnviar('maria@escola.edu.br', 'senha123')

    expect(
      await screen.findByRole('heading', { name: 'Administração' }),
    ).toBeInTheDocument()
  })

  it('guarda o token para a sessao sobreviver a um recarregamento', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ token: 'token-novo', user: makeUser() }),
    )

    renderLogin()
    await preencherEEnviar('maria@escola.edu.br', 'senha123')

    await waitFor(() => expect(tokenStorage.get()).toBe('token-novo'))
  })

  it('envia as credenciais para /auth/login', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ token: 't', user: makeUser() }),
    )

    renderLogin()
    await preencherEEnviar('maria@escola.edu.br', 'senha123')

    await waitFor(() => {
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('/api/auth/login')
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({
        email: 'maria@escola.edu.br',
        password: 'senha123',
      })
    })
  })

  it('permanece na tela de login apos falhar', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ error: 'Email ou senha invalidos.' }, 401))

    renderLogin()
    await preencherEEnviar('maria@escola.edu.br', 'errada')

    await screen.findByRole('alert')
    expect(
      screen.queryByRole('heading', { name: 'Administração' }),
    ).not.toBeInTheDocument()
  })

  it('mostra mensagem amigavel quando a API esta fora do ar', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    renderLogin()
    await preencherEEnviar('maria@escola.edu.br', 'senha123')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /conectar ao servidor/i,
    )
  })
})

describe('Login: validacao e estado do formulario', () => {
  it('nao chama a API com os campos vazios', async () => {
    renderLogin()
    await preencherEEnviar('', '')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /informe e-mail e senha/i,
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('desabilita o botao durante o envio, evitando duplo clique', async () => {
    fetchMock.mockReturnValue(nuncaResolve())

    renderLogin()
    await preencherEEnviar('maria@escola.edu.br', 'senha123')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled(),
    )
  })
})

describe('Login: acessibilidade', () => {
  it('os campos tem rotulo associado', () => {
    renderLogin()

    expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/senha/i)).toHaveAttribute('type', 'password')
  })

  it('o campo de senha permite o gerenciador preencher a credencial', () => {
    renderLogin()

    expect(screen.getByLabelText(/senha/i)).toHaveAttribute(
      'autocomplete',
      'current-password',
    )
  })
})

describe('Login: quem ja esta autenticado', () => {
  it('e levado direto a area administrativa', async () => {
    tokenStorage.set('token-valido')
    fetchMock.mockResolvedValue(fakeResponse(makeUser()))

    renderLogin()

    expect(
      await screen.findByRole('heading', { name: 'Administração' }),
    ).toBeInTheDocument()
  })
})
