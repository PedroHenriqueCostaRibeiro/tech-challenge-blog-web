import { tokenStorage } from './token'

/**
 * Cliente HTTP unico da aplicacao.
 *
 * Todo acesso a API passa por aqui. Paginas e componentes nunca chamam fetch
 * direto — assim a URL base, o token, o formato de erro e os casos de borda
 * ficam em um lugar so.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Erro normalizado da API.
 *
 * `status` 0 significa que a requisicao nem chegou ao servidor (rede fora,
 * API inalcancavel). Distinguir isso de um 500 importa: a mensagem para o
 * usuario e diferente.
 */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Avisado quando a API responde 401 numa rota autenticada, ou seja, quando a
 * sessao expirou ou o token foi adulterado.
 *
 * O cliente HTTP nao redireciona sozinho: navegacao e responsabilidade do
 * React Router. Ele apenas notifica, e o AuthProvider decide o que fazer.
 */
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export interface RequestOptions {
  /**
   * Nao anexa token e nao trata 401 como sessao expirada.
   *
   * Necessario no login: ali um 401 significa "senha errada", e disparar o
   * fluxo de sessao expirada criaria um laco de redirecionamento para a
   * propria tela de login.
   */
  anonymous?: boolean
}

/**
 * O errorHandler do back-end responde sempre `{ "error": "mensagem" }`.
 * Preferimos essa mensagem a um texto generico, porque ela ja vem em portugues
 * e descreve o problema real.
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
    ) {
      return (body as { error: string }).error
    }
  } catch {
    // Corpo vazio ou nao-JSON: cai na mensagem padrao abaixo.
  }

  return 'Erro inesperado ao comunicar com o servidor. Tente novamente.'
}

function buildHeaders(init?: RequestInit, anonymous?: boolean): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }

  if (!anonymous) {
    const token = tokenStorage.get()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: buildHeaders(init, options.anonymous),
    })
  } catch {
    // fetch so rejeita em falha de rede; erro HTTP vem como resposta normal.
    throw new ApiError(
      'Nao foi possivel conectar ao servidor. Verifique sua conexao.',
      0,
    )
  }

  if (!response.ok) {
    if (response.status === 401 && !options.anonymous) {
      tokenStorage.clear()
      unauthorizedHandler?.()
    }

    throw new ApiError(await extractErrorMessage(response), response.status)
  }

  // DELETE responde 204 sem corpo: chamar response.json() aqui lancaria
  // "Unexpected end of JSON input" e a exclusao pareceria ter falhado.
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
