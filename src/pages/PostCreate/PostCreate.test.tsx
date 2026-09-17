import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import {
  darSessao,
  fakeResponse,
  makePost,
  makeUser,
  mockApiPorUrl,
  nuncaResolve,
  renderWithAuth,
} from '../../test-utils'
import { ProtectedRoute } from '../../components/layout/ProtectedRoute'
import PostCreate from './index'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
  darSessao()
})

function renderCriacao() {
  mockApiPorUrl(fetchMock, {
    '/auth/me': { corpo: makeUser({ name: 'Maria Silva' }) },
    '/posts': { corpo: makePost() },
  })

  // Dentro da ProtectedRoute, como a aplicacao monta de verdade: a pagina so
  // aparece depois de a sessao estar confirmada.
  return renderWithAuth(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/admin/posts/new" element={<PostCreate />} />
        <Route path="/admin" element={<h1>Administração</h1>} />
      </Route>
    </Routes>,
    { route: '/admin/posts/new' },
  )
}

/** Espera a sessao reidratar, para o campo de autor ja vir preenchido. */
async function aguardarFormulario() {
  await screen.findByRole('button', { name: /publicar/i })
}

describe('PostCreate: campos exigidos pelo RF3', () => {
  it('tem título, conteúdo e autor', async () => {
    renderCriacao()
    await aguardarFormulario()

    expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/conteúdo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/autor/i)).toBeInTheDocument()
  })

  it('pre-preenche o autor com o nome de quem esta logado', async () => {
    renderCriacao()
    await aguardarFormulario()

    await waitFor(() =>
      expect(screen.getByLabelText(/autor/i)).toHaveValue('Maria Silva'),
    )
  })

  it('o autor continua editavel: o requisito pede um campo, nao um rotulo fixo', async () => {
    const user = userEvent.setup()
    renderCriacao()
    await aguardarFormulario()
    await waitFor(() =>
      expect(screen.getByLabelText(/autor/i)).toHaveValue('Maria Silva'),
    )

    const autor = screen.getByLabelText(/autor/i)
    await user.clear(autor)
    await user.type(autor, 'Prof. Convidado')

    expect(autor).toHaveValue('Prof. Convidado')
  })
})

describe('PostCreate: publicacao', () => {
  it('envia os dados e volta para a administracao', async () => {
    const user = userEvent.setup()
    renderCriacao()
    await aguardarFormulario()

    await user.type(screen.getByLabelText(/título/i), 'Aula de História')
    await user.type(screen.getByLabelText(/conteúdo/i), 'Sobre 1789.')
    await user.click(screen.getByRole('button', { name: /publicar/i }))

    expect(
      await screen.findByRole('heading', { name: 'Administração' }),
    ).toBeInTheDocument()
  })

  it('envia POST com os campos sem espacos nas pontas', async () => {
    const user = userEvent.setup()
    renderCriacao()
    await aguardarFormulario()

    await user.type(screen.getByLabelText(/título/i), '  Aula  ')
    await user.type(screen.getByLabelText(/conteúdo/i), '  Conteúdo  ')
    await user.click(screen.getByRole('button', { name: /publicar/i }))

    await waitFor(() => {
      const criacao = fetchMock.mock.calls.find(
        (c) => (c[1] as RequestInit | undefined)?.method === 'POST',
      )
      expect(JSON.parse((criacao![1] as RequestInit).body as string)).toEqual({
        title: 'Aula',
        content: 'Conteúdo',
        author: 'Maria Silva',
      })
    })
  })
})

describe('PostCreate: validacao', () => {
  it('nao chama a API com campos vazios', async () => {
    const user = userEvent.setup()
    renderCriacao()
    await aguardarFormulario()

    await user.clear(screen.getByLabelText(/autor/i))
    await user.click(screen.getByRole('button', { name: /publicar/i }))

    expect(await screen.findByText(/informe o título/i)).toBeInTheDocument()
    expect(screen.getByText(/informe o conteúdo/i)).toBeInTheDocument()
    expect(screen.getByText(/informe o autor/i)).toBeInTheDocument()

    expect(
      fetchMock.mock.calls.filter(
        (c) => (c[1] as RequestInit | undefined)?.method === 'POST',
      ),
    ).toHaveLength(0)
  })

  it('marca o campo invalido para leitores de tela', async () => {
    const user = userEvent.setup()
    renderCriacao()
    await aguardarFormulario()

    await user.click(screen.getByRole('button', { name: /publicar/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/título/i)).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    )
  })

  it('o erro some quando o campo e corrigido', async () => {
    const user = userEvent.setup()
    renderCriacao()
    await aguardarFormulario()

    await user.click(screen.getByRole('button', { name: /publicar/i }))
    await screen.findByText(/informe o título/i)

    await user.type(screen.getByLabelText(/título/i), 'A')

    expect(screen.queryByText(/informe o título/i)).not.toBeInTheDocument()
  })
})

describe('PostCreate: erro do servidor', () => {
  it('mostra a mensagem SEM perder o que foi digitado', async () => {
    const user = userEvent.setup()
    renderCriacao()
    await aguardarFormulario()

    await user.type(screen.getByLabelText(/título/i), 'Aula longa')
    await user.type(screen.getByLabelText(/conteúdo/i), 'Texto que custou a escrever.')

    fetchMock.mockResolvedValue(
      fakeResponse({ error: 'Erro interno do servidor.' }, 500),
    )
    await user.click(screen.getByRole('button', { name: /publicar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro interno do servidor.',
    )
    // Perder o texto obrigaria a reescrever um post inteiro por um erro de rede.
    expect(screen.getByLabelText(/título/i)).toHaveValue('Aula longa')
    expect(screen.getByLabelText(/conteúdo/i)).toHaveValue(
      'Texto que custou a escrever.',
    )
  })

  it('desabilita o botao durante o envio, evitando post duplicado', async () => {
    const user = userEvent.setup()
    renderCriacao()
    await aguardarFormulario()

    await user.type(screen.getByLabelText(/título/i), 'Aula')
    await user.type(screen.getByLabelText(/conteúdo/i), 'Conteúdo')

    fetchMock.mockReturnValue(nuncaResolve())
    await user.click(screen.getByRole('button', { name: /publicar/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled(),
    )
  })
})
