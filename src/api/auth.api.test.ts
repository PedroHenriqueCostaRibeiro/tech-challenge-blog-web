import { authApi } from './auth.api'
import { setUnauthorizedHandler } from './http'
import { tokenStorage } from './token'

const fetchMock = vi.fn()

function fakeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
  setUnauthorizedHandler(null)
})

function cabecalhos(): Record<string, string> {
  return (fetchMock.mock.calls.at(-1)?.[1] as RequestInit)
    .headers as Record<string, string>
}

describe('authApi.login', () => {
  it('chama POST /auth/login com as credenciais', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ token: 't', user: {} }))

    await authApi.login('maria@escola.edu.br', 'senha123')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email: 'maria@escola.edu.br',
      password: 'senha123',
    })
  })

  it('nao envia token, mesmo havendo um guardado', async () => {
    // Autenticar-se nao deve depender de estar autenticado.
    tokenStorage.set('token-antigo')
    fetchMock.mockResolvedValue(fakeResponse({ token: 't', user: {} }))

    await authApi.login('maria@escola.edu.br', 'senha123')

    expect(cabecalhos()).not.toHaveProperty('Authorization')
  })

  it('um 401 aqui NAO dispara o fluxo de sessao expirada', async () => {
    /**
     * No login, 401 significa "senha errada" -- nao "sua sessao acabou".
     * Tratar os dois igual limparia o token de quem ja estava logado e
     * redirecionaria para a propria tela de login, em laco.
     */
    tokenStorage.set('token-da-sessao-vigente')
    const aoExpirar = vi.fn()
    setUnauthorizedHandler(aoExpirar)

    fetchMock.mockResolvedValue(
      fakeResponse({ error: 'Email ou senha invalidos.' }, 401),
    )

    await expect(authApi.login('maria@escola.edu.br', 'errada')).rejects.toThrow(
      'Email ou senha invalidos.',
    )

    expect(aoExpirar).not.toHaveBeenCalled()
    expect(tokenStorage.get()).toBe('token-da-sessao-vigente')
  })
})

describe('authApi.me', () => {
  it('envia o token guardado no cabecalho Authorization', async () => {
    tokenStorage.set('token-valido')
    fetchMock.mockResolvedValue(fakeResponse({ id: '1' }))

    await authApi.me()

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/me')
    expect(cabecalhos().Authorization).toBe('Bearer token-valido')
  })

  it('nao envia cabecalho Authorization quando nao ha token', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ id: '1' }))

    await authApi.me()

    expect(cabecalhos()).not.toHaveProperty('Authorization')
  })

  it('um 401 aqui derruba a sessao e limpa o token', async () => {
    tokenStorage.set('token-expirado')
    const aoExpirar = vi.fn()
    setUnauthorizedHandler(aoExpirar)

    fetchMock.mockResolvedValue(
      fakeResponse({ error: 'Token invalido ou expirado.' }, 401),
    )

    await expect(authApi.me()).rejects.toThrow()

    expect(aoExpirar).toHaveBeenCalledTimes(1)
    expect(tokenStorage.get()).toBeNull()
  })
})

describe('tokenStorage: armazenamento indisponivel', () => {
  it('devolve null em vez de quebrar quando o localStorage lanca', () => {
    // Acontece em aba anonima ou com dados de site bloqueados.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('acesso negado')
    })

    expect(() => tokenStorage.get()).not.toThrow()
    expect(tokenStorage.get()).toBeNull()
  })

  it('nao quebra ao tentar gravar com o armazenamento indisponivel', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cota excedida')
    })

    expect(() => tokenStorage.set('t')).not.toThrow()
  })
})
