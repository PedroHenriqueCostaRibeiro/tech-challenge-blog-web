import { postsApi } from './posts.api'

const fetchMock = vi.fn()

function ok(body: unknown, status = 200): Response {
  return {
    ok: true,
    status,
    json: async () => body,
  } as unknown as Response
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(ok([]))
})

/** URL da chamada mais recente. */
function calledUrl(): string {
  return fetchMock.mock.calls[0][0] as string
}

/** RequestInit da chamada mais recente. */
function calledInit(): RequestInit {
  return fetchMock.mock.calls[0][1] as RequestInit
}

describe('leitura', () => {
  it('list chama GET /posts', async () => {
    await postsApi.list()

    expect(calledUrl()).toBe('/api/posts')
    expect(calledInit().method).toBeUndefined() // GET e o padrao do fetch
  })

  it('getById chama GET /posts/:id', async () => {
    fetchMock.mockResolvedValueOnce(ok({ id: 'abc' }))

    await postsApi.getById('abc')

    expect(calledUrl()).toBe('/api/posts/abc')
  })
})

describe('busca', () => {
  it('codifica o termo na query string', async () => {
    await postsApi.search('revolucao francesa')

    expect(calledUrl()).toBe('/api/posts/search?q=revolucao%20francesa')
  })

  it('codifica caracteres que quebrariam a query', async () => {
    // Sem encode, o "&" seria lido como separador de parametro e o termo
    // chegaria truncado na API.
    await postsApi.search('a&b=c')

    expect(calledUrl()).toBe('/api/posts/search?q=a%26b%3Dc')
  })
})

describe('escrita', () => {
  it('create envia POST com o corpo em JSON', async () => {
    fetchMock.mockResolvedValueOnce(ok({ id: '1' }))

    await postsApi.create({
      title: 'Aula',
      content: 'Conteudo',
      author: 'Prof. Maria',
    })

    expect(calledUrl()).toBe('/api/posts')
    expect(calledInit().method).toBe('POST')
    expect(JSON.parse(calledInit().body as string)).toEqual({
      title: 'Aula',
      content: 'Conteudo',
      author: 'Prof. Maria',
    })
  })

  it('update envia PUT apenas com os campos informados', async () => {
    fetchMock.mockResolvedValueOnce(ok({ id: '1' }))

    await postsApi.update('1', { content: 'Novo conteudo' })

    expect(calledUrl()).toBe('/api/posts/1')
    expect(calledInit().method).toBe('PUT')
    expect(JSON.parse(calledInit().body as string)).toEqual({
      content: 'Novo conteudo',
    })
  })

  it('remove envia DELETE e lida com o 204 sem corpo', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input')
      },
    } as unknown as Response)

    await expect(postsApi.remove('1')).resolves.toBeUndefined()

    expect(calledUrl()).toBe('/api/posts/1')
    expect(calledInit().method).toBe('DELETE')
  })
})
