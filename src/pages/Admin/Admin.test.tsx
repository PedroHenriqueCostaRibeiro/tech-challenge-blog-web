import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  darSessao,
  makePost,
  makeUser,
  mockApiPorUrl,
  renderWithAuth,
} from '../../test-utils'
import Admin from './index'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
  darSessao()
})

const POSTS = [
  makePost({ id: 'p1', title: 'Revolução Francesa', author: 'Prof. Maria' }),
  makePost({ id: 'p2', title: 'Fotossíntese', author: 'Prof. João' }),
]

function renderAdmin(posts = POSTS) {
  mockApiPorUrl(fetchMock, {
    '/auth/me': { corpo: makeUser() },
    '/posts': { corpo: posts },
  })

  return renderWithAuth(<Admin />, { route: '/admin' })
}

describe('Admin: listagem (RF5)', () => {
  it('lista todas as postagens', async () => {
    renderAdmin()

    expect(
      await screen.findByRole('heading', { name: 'Revolução Francesa' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Fotossíntese' }),
    ).toBeInTheDocument()
  })

  it('oferece editar e excluir para cada postagem', async () => {
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    expect(screen.getAllByRole('link', { name: /^editar/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /^excluir/i })).toHaveLength(2)
  })

  it('o link de editar aponta para a postagem certa', async () => {
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    expect(
      screen.getByRole('link', { name: /editar "revolução francesa"/i }),
    ).toHaveAttribute('href', '/admin/posts/p1/edit')
  })

  it('oferece criar uma nova postagem', async () => {
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    expect(
      screen.getByRole('link', { name: /nova postagem/i }),
    ).toHaveAttribute('href', '/admin/posts/new')
  })

  it('mostra estado vazio quando nao ha postagens', async () => {
    renderAdmin([])

    expect(await screen.findByText(/nenhuma postagem ainda/i)).toBeInTheDocument()
  })
})

describe('Admin: exclusao', () => {
  it('nao exclui direto: pede confirmacao antes', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    await user.click(
      screen.getByRole('button', { name: /excluir "revolução francesa"/i }),
    )

    expect(
      await screen.findByRole('heading', { name: /excluir postagem/i }),
    ).toBeInTheDocument()
    // Nenhuma chamada de exclusao antes da confirmacao.
    expect(
      fetchMock.mock.calls.filter(
        (c) => (c[1] as RequestInit | undefined)?.method === 'DELETE',
      ),
    ).toHaveLength(0)
  })

  it('a confirmacao nomeia a postagem que sera removida', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    await user.click(
      screen.getByRole('button', { name: /excluir "fotossíntese"/i }),
    )

    // Confirmar sem saber qual post e como apagar a coisa errada.
    expect(await screen.findByText(/"Fotossíntese" será removida/i)).toBeInTheDocument()
  })

  it('cancelar fecha o dialogo sem excluir', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    await user.click(
      screen.getByRole('button', { name: /excluir "revolução francesa"/i }),
    )
    await screen.findByRole('heading', { name: /excluir postagem/i })
    await user.click(screen.getByRole('button', { name: /^cancelar$/i }))

    expect(
      fetchMock.mock.calls.filter(
        (c) => (c[1] as RequestInit | undefined)?.method === 'DELETE',
      ),
    ).toHaveLength(0)
  })

  it('confirmar envia DELETE para a postagem correta', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    await user.click(
      screen.getByRole('button', { name: /excluir "fotossíntese"/i }),
    )
    await screen.findByRole('heading', { name: /excluir postagem/i })
    await user.click(screen.getByRole('button', { name: /^excluir$/i }))

    await waitFor(() => {
      const exclusoes = fetchMock.mock.calls.filter(
        (c) => (c[1] as RequestInit | undefined)?.method === 'DELETE',
      )
      expect(exclusoes).toHaveLength(1)
      expect(exclusoes[0][0]).toBe('/api/posts/p2')
    })
  })

  it('recarrega a lista depois de excluir', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    const listagensAntes = fetchMock.mock.calls.filter(
      (c) => c[0] === '/api/posts',
    ).length

    await user.click(
      screen.getByRole('button', { name: /excluir "fotossíntese"/i }),
    )
    await screen.findByRole('heading', { name: /excluir postagem/i })
    await user.click(screen.getByRole('button', { name: /^excluir$/i }))

    await waitFor(() => {
      const depois = fetchMock.mock.calls.filter(
        (c) => c[0] === '/api/posts',
      ).length
      expect(depois).toBeGreaterThan(listagensAntes)
    })
  })

  it('mostra erro quando a exclusao falha', async () => {
    const user = userEvent.setup()

    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    // A partir daqui, qualquer chamada falha.
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Erro interno do servidor.' }),
    } as unknown as Response)

    await user.click(
      screen.getByRole('button', { name: /excluir "revolução francesa"/i }),
    )
    await screen.findByRole('heading', { name: /excluir postagem/i })
    await user.click(screen.getByRole('button', { name: /^excluir$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro interno do servidor.',
    )
  })
})

describe('Admin: acessibilidade', () => {
  it('cada acao diz a qual postagem se refere', async () => {
    renderAdmin()
    await screen.findByRole('heading', { name: 'Revolução Francesa' })

    // Sem isto o leitor de tela anunciaria varios "Excluir" identicos.
    expect(
      screen.getByRole('button', { name: 'Excluir "Revolução Francesa"' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Excluir "Fotossíntese"' }),
    ).toBeInTheDocument()
  })
})
