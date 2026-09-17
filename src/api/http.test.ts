import { ApiError, request } from './http'

/** Monta uma Response falsa com o corpo e o status desejados. */
function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

function emptyResponse(status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new SyntaxError('Unexpected end of JSON input')
    },
  } as unknown as Response
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

describe('request — caminho feliz', () => {
  it('devolve o corpo em JSON e prefixa a URL base', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: '1' }]))

    const result = await request<Array<{ id: string }>>('/posts')

    expect(result).toEqual([{ id: '1' }])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/posts')
  })

  it('envia Content-Type application/json por padrao', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await request('/posts', { method: 'POST', body: '{}' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(init.method).toBe('POST')
  })
})

describe('request — 204 sem corpo (exclusao)', () => {
  it('nao tenta interpretar JSON e resolve sem erro', async () => {
    // Se o codigo chamasse response.json() aqui, o mock lancaria SyntaxError
    // e a exclusao pareceria ter falhado mesmo tendo funcionado.
    fetchMock.mockResolvedValueOnce(emptyResponse(204))

    await expect(request<void>('/posts/1', { method: 'DELETE' })).resolves
      .toBeUndefined()
  })
})

describe('request — erros HTTP', () => {
  it('usa a mensagem do campo "error" devolvido pela API', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'Campos obrigatorios ausentes ou vazios: title.' }, 400),
    )

    await expect(request('/posts', { method: 'POST' })).rejects.toThrow(
      'Campos obrigatorios ausentes ou vazios: title.',
    )
  })

  it('preserva o status no ApiError (404)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'Post com id "x" nao encontrado.' }, 404),
    )

    await expect(request('/posts/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    })
  })

  it('preserva o status no ApiError (500)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'Erro interno do servidor.' }, 500),
    )

    await expect(request('/posts')).rejects.toMatchObject({ status: 500 })
  })

  it('usa mensagem generica quando o corpo do erro nao e JSON', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(502))

    await expect(request('/posts')).rejects.toThrow(/erro inesperado/i)
  })
})

describe('request — falha de rede', () => {
  it('converte a rejeicao do fetch em ApiError com status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const error = await request('/posts').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(0)
    expect((error as ApiError).message).toMatch(/conectar ao servidor/i)
  })
})
