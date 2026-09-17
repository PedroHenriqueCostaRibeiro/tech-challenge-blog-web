import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { fakeResponse, makePost, renderWithProviders } from '../../test-utils'
import PostDetail from './index'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

/** Monta a rota real para que useParams receba o :id. */
function renderDetail(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/posts/:id" element={<PostDetail />} />
    </Routes>,
    { route: `/posts/${id}` },
  )
}

describe('PostDetail — leitura (RF2)', () => {
  it('mostra o conteudo completo, o autor e a data', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse(
        makePost({
          title: 'Literatura de Cordel',
          author: 'Prof. Ana Costa',
          content: 'O cordel é uma forma de literatura popular.',
          createdAt: '2026-07-14T21:33:04.854Z',
        }),
      ),
    )

    renderDetail('post-1')

    expect(
      await screen.findByRole('heading', { name: 'Literatura de Cordel' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Prof\. Ana Costa/)).toBeInTheDocument()
    expect(
      screen.getByText('O cordel é uma forma de literatura popular.'),
    ).toBeInTheDocument()
    // Data formatada em pt-BR, nao o ISO cru.
    expect(screen.getByText(/14 de julho de 2026/)).toBeInTheDocument()
  })

  it('busca o post pelo id da rota', async () => {
    fetchMock.mockResolvedValue(fakeResponse(makePost()))

    renderDetail('abc-123')

    expect(await screen.findByRole('heading')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/posts/abc-123')
  })

  it('oferece caminho de volta para a listagem', async () => {
    fetchMock.mockResolvedValue(fakeResponse(makePost()))

    renderDetail('post-1')

    expect(await screen.findByRole('link', { name: /voltar/i })).toHaveAttribute(
      'href',
      '/',
    )
  })
})

describe('PostDetail — post inexistente', () => {
  it('mostra mensagem propria no 404, sem expor o id tecnico', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse(
        { error: 'Post com id "abc-123" nao encontrado.' },
        404,
      ),
    )

    renderDetail('abc-123')

    expect(
      await screen.findByText(/postagem não encontrada/i),
    ).toBeInTheDocument()
    // O UUID cru da API nao diz nada a quem nao e tecnico.
    expect(screen.queryByText(/abc-123/)).not.toBeInTheDocument()
  })

  it('no 404 nao oferece "tentar novamente" — repetir nao resolveria', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ error: 'Post nao encontrado.' }, 404),
    )

    renderDetail('sumiu')

    await screen.findByText(/postagem não encontrada/i)
    expect(
      screen.queryByRole('button', { name: /tentar novamente/i }),
    ).not.toBeInTheDocument()
  })
})

describe('PostDetail — outros erros', () => {
  it('mostra a mensagem da API e permite tentar de novo no 500', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ error: 'Erro interno do servidor.' }, 500),
    )

    renderDetail('post-1')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro interno do servidor.',
    )
    expect(
      screen.getByRole('button', { name: /tentar novamente/i }),
    ).toBeInTheDocument()
  })
})
