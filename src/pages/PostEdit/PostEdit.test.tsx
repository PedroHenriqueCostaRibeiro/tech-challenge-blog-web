import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../../components/layout/ProtectedRoute'
import {
  darSessao,
  fakeResponse,
  makePost,
  makeUser,
  nuncaResolve,
  renderWithAuth,
} from '../../test-utils'
import PostEdit from './index'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
  darSessao()
})

const POST = makePost({
  id: 'p1',
  title: 'Revolução Francesa',
  content: 'Aula sobre 1789.',
  author: 'Prof. Maria',
})

/**
 * Roteia por URL e permite que /posts/:id se comporte de forma diferente de
 * /auth/me — necessario para testar carregamento pendente e erros.
 */
function mockar(postResposta: () => Promise<Response>) {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve(fakeResponse(makeUser()))
    }
    return postResposta()
  })
}

function renderEdicao() {
  return renderWithAuth(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/admin/posts/:id/edit" element={<PostEdit />} />
        <Route path="/admin" element={<h1>Administração</h1>} />
      </Route>
    </Routes>,
    { route: '/admin/posts/p1/edit' },
  )
}

describe('PostEdit: carregar os dados atuais (RF4)', () => {
  it('busca a postagem pelo id da rota', async () => {
    mockar(() => Promise.resolve(fakeResponse(POST)))

    renderEdicao()
    await screen.findByLabelText(/título/i)

    expect(
      fetchMock.mock.calls.some((c) => c[0] === '/api/posts/p1'),
    ).toBe(true)
  })

  it('preenche o formulario com os valores atuais', async () => {
    mockar(() => Promise.resolve(fakeResponse(POST)))

    renderEdicao()

    expect(await screen.findByLabelText(/título/i)).toHaveValue(
      'Revolução Francesa',
    )
    expect(screen.getByLabelText(/conteúdo/i)).toHaveValue('Aula sobre 1789.')
    expect(screen.getByLabelText(/autor/i)).toHaveValue('Prof. Maria')
  })

  it('NAO monta o formulario antes de os dados chegarem', async () => {
    // Renderizar vazio e preencher depois criaria campos controlados que mudam
    // de valor sozinhos, e o requisito e explicito: carregar os dados atuais
    // para edicao.
    mockar(() => nuncaResolve())

    renderEdicao()

    // Busca pelo texto, e nao por role: ha dois indicadores possiveis em
    // cena (verificacao de sessao e carregamento da postagem).
    expect(await screen.findByText(/carregando postagem/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/título/i)).not.toBeInTheDocument()
  })
})

describe('PostEdit: salvar', () => {
  it('envia PUT com os valores alterados e volta para a administracao', async () => {
    const user = userEvent.setup()
    mockar(() => Promise.resolve(fakeResponse(POST)))

    renderEdicao()
    const titulo = await screen.findByLabelText(/título/i)

    await user.clear(titulo)
    await user.type(titulo, 'Revolução Francesa (revisado)')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(
      await screen.findByRole('heading', { name: 'Administração' }),
    ).toBeInTheDocument()

    const edicao = fetchMock.mock.calls.find(
      (c) => (c[1] as RequestInit | undefined)?.method === 'PUT',
    )
    expect(edicao![0]).toBe('/api/posts/p1')
    expect(JSON.parse((edicao![1] as RequestInit).body as string)).toMatchObject({
      title: 'Revolução Francesa (revisado)',
      content: 'Aula sobre 1789.',
      author: 'Prof. Maria',
    })
  })

  it('nao salva com um campo obrigatorio vazio', async () => {
    const user = userEvent.setup()
    mockar(() => Promise.resolve(fakeResponse(POST)))

    renderEdicao()
    const titulo = await screen.findByLabelText(/título/i)

    await user.clear(titulo)
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(await screen.findByText(/informe o título/i)).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.filter(
        (c) => (c[1] as RequestInit | undefined)?.method === 'PUT',
      ),
    ).toHaveLength(0)
  })
})

describe('PostEdit: postagem inexistente', () => {
  it('mostra mensagem propria no 404, sem expor o id tecnico', async () => {
    mockar(() =>
      Promise.resolve(
        fakeResponse({ error: 'Post com id "p1" nao encontrado.' }, 404),
      ),
    )

    renderEdicao()

    expect(
      await screen.findByText(/postagem não encontrada/i),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/título/i)).not.toBeInTheDocument()
  })

  it('no 404 nao oferece "tentar novamente": repetir nao resolveria', async () => {
    mockar(() =>
      Promise.resolve(fakeResponse({ error: 'nao encontrado' }, 404)),
    )

    renderEdicao()
    await screen.findByText(/postagem não encontrada/i)

    expect(
      screen.queryByRole('button', { name: /tentar novamente/i }),
    ).not.toBeInTheDocument()
  })

  it('em outros erros oferece tentar de novo', async () => {
    mockar(() =>
      Promise.resolve(
        fakeResponse({ error: 'Erro interno do servidor.' }, 500),
      ),
    )

    renderEdicao()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro interno do servidor.',
    )
    expect(
      screen.getByRole('button', { name: /tentar novamente/i }),
    ).toBeInTheDocument()
  })
})
