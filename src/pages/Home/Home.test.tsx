import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeResponse, makePost, renderWithProviders } from '../../test-utils'
import Home from './index'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

/** URLs chamadas ate agora, so as da API. */
function apiCalls(): string[] {
  return fetchMock.mock.calls.map((c) => String(c[0]))
}

describe('Home — listagem (RF1)', () => {
  it('mostra titulo, autor e resumo de cada post', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse([
        makePost({ id: '1', title: 'Fotossíntese', author: 'Prof. João' }),
      ]),
    )

    renderWithProviders(<Home />)

    expect(
      await screen.findByRole('link', { name: 'Fotossíntese' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Prof\. João/)).toBeInTheDocument()
    expect(screen.getByText(/Aula sobre 1789/)).toBeInTheDocument()
  })

  it('exibe indicador de carregamento antes dos dados', () => {
    fetchMock.mockReturnValue(new Promise(() => {})) // nunca resolve

    renderWithProviders(<Home />)

    expect(screen.getByRole('status')).toHaveTextContent(/carregando/i)
  })

  it('exibe estado vazio quando nao ha nenhuma postagem', async () => {
    fetchMock.mockResolvedValue(fakeResponse([]))

    renderWithProviders(<Home />)

    expect(
      await screen.findByText(/nenhuma postagem publicada ainda/i),
    ).toBeInTheDocument()
  })
})

describe('Home — erros', () => {
  it('mostra a mensagem da API e permite tentar de novo', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ error: 'Erro interno do servidor.' }, 500),
    )

    renderWithProviders(<Home />)

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Erro interno do servidor.')
    expect(
      screen.getByRole('button', { name: /tentar novamente/i }),
    ).toBeInTheDocument()
  })

  it('mostra mensagem amigavel quando a API esta fora do ar', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    renderWithProviders(<Home />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /nao foi possivel conectar ao servidor/i,
    )
  })

  it('o botao de tentar novamente refaz a requisicao', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(
      fakeResponse({ error: 'Erro interno do servidor.' }, 500),
    )

    renderWithProviders(<Home />)
    await screen.findByRole('alert')

    const chamadasAntes = fetchMock.mock.calls.length
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThan(chamadasAntes),
    )
  })
})

describe('Home — busca (RF1)', () => {
  it('consulta o endpoint de busca com o termo digitado', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(fakeResponse([]))

    renderWithProviders(<Home />)
    await screen.findByText(/nenhuma postagem/i)

    await user.type(screen.getByLabelText(/buscar postagens/i), 'cordel')

    await waitFor(() =>
      expect(apiCalls()).toContain('/api/posts/search?q=cordel'),
    )
  })

  it('nao dispara uma requisicao por tecla digitada (debounce)', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(fakeResponse([]))

    renderWithProviders(<Home />)
    await screen.findByText(/nenhuma postagem/i)

    await user.type(screen.getByLabelText(/buscar postagens/i), 'cordel')
    await waitFor(() =>
      expect(apiCalls()).toContain('/api/posts/search?q=cordel'),
    )

    // 6 teclas digitadas: sem debounce haveria uma busca por prefixo
    // (c, co, cor, cord, corde, cordel). Deve haver apenas a final.
    const buscas = apiCalls().filter((url) => url.includes('/search?'))
    expect(buscas).toEqual(['/api/posts/search?q=cordel'])
  })

  it('avisa quando a busca nao encontra nada, em vez de mostrar area em branco', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(fakeResponse([makePost()]))

    renderWithProviders(<Home />)
    await screen.findByRole('link', { name: 'Revolução Francesa' })

    fetchMock.mockResolvedValue(fakeResponse([]))
    await user.type(screen.getByLabelText(/buscar postagens/i), 'inexistente')

    expect(
      await screen.findByText(/nenhuma postagem encontrada para "inexistente"/i),
    ).toBeInTheDocument()
  })

  it('limpar a busca restaura a listagem completa', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(fakeResponse([makePost()]))

    renderWithProviders(<Home />)
    const campo = screen.getByLabelText(/buscar postagens/i)
    await screen.findByRole('link', { name: 'Revolução Francesa' })

    fetchMock.mockResolvedValue(fakeResponse([]))
    await user.type(campo, 'zzz')
    await screen.findByText(/nenhuma postagem encontrada/i)

    fetchMock.mockResolvedValue(fakeResponse([makePost()]))
    await user.clear(campo)

    expect(
      await screen.findByRole('link', { name: 'Revolução Francesa' }),
    ).toBeInTheDocument()
    await waitFor(() => expect(apiCalls().at(-1)).toBe('/api/posts'))
  })
})

describe('Home — acessibilidade', () => {
  it('o campo de busca tem rotulo associado', async () => {
    fetchMock.mockResolvedValue(fakeResponse([]))

    renderWithProviders(<Home />)
    await screen.findByText(/nenhuma postagem/i)

    // getByLabelText so encontra se o <label for> apontar para o input.
    expect(screen.getByLabelText(/buscar postagens/i)).toHaveAttribute(
      'type',
      'search',
    )
  })

  it('o indicador de carregamento desaparece quando os dados chegam', async () => {
    fetchMock.mockResolvedValue(fakeResponse([makePost()]))

    renderWithProviders(<Home />)

    await waitForElementToBeRemoved(() =>
      screen.queryByText(/carregando postagens/i),
    )
  })
})
