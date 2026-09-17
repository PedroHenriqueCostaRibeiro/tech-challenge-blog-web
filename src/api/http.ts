/**
 * Cliente HTTP unico da aplicacao.
 *
 * Todo acesso a API passa por aqui. Paginas e componentes nunca chamam fetch
 * direto — assim a URL base, o formato de erro e os casos de borda ficam em um
 * lugar so.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Erro normalizado da API.
 *
 * `status` 0 significa que a requisicao nem chegou ao servidor (rede fora,
 * API no ar mas inalcancavel, CORS). Distinguir isso de um 500 importa: a
 * mensagem para o usuario e diferente.
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
 * O errorHandler do back-end responde sempre `{ "error": "mensagem" }`.
 * Preferimos essa mensagem a um texto generico, porque ela ja vem em portugues
 * e descreve o problema real (campo faltando, post inexistente, etc.).
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

export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    // fetch so rejeita em falha de rede; erro HTTP vem como resposta normal.
    throw new ApiError(
      'Nao foi possivel conectar ao servidor. Verifique sua conexao.',
      0,
    )
  }

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status)
  }

  // DELETE responde 204 sem corpo: chamar response.json() aqui lancaria
  // "Unexpected end of JSON input" e a exclusao pareceria ter falhado.
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
