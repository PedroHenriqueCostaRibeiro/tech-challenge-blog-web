import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/http'

/**
 * Estado de uma chamada assincrona.
 *
 * Modelado como uniao discriminada em vez de tres booleanos soltos
 * (isLoading / data / error): assim e impossivel representar estados
 * contraditorios, como "carregando e com erro ao mesmo tempo".
 */
export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; httpStatus?: number }

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Erro inesperado. Tente novamente.'
}

/**
 * Status HTTP quando houver. Permite que a tela distinga "nao existe" (404)
 * de "deu erro" (500) e escolha a mensagem certa para o usuario.
 */
function toHttpStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined
}

/**
 * Executa uma tarefa assincrona e devolve seu estado, re-executando quando
 * `deps` mudar.
 *
 * Protege contra corrida: se o usuario digita rapido na busca, uma resposta
 * antiga pode chegar depois da nova. O contador `runId` descarta resultados de
 * execucoes que ja foram superadas, evitando que a tela mostre o resultado
 * errado.
 */
export function useAsync<T>(
  task: () => Promise<T>,
  deps: unknown[],
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const runId = useRef(0)
  const taskRef = useRef(task)

  // Mantem a tarefa atual sem coloca-la nas deps: a funcao e recriada a cada
  // render e isso dispararia um loop infinito de requisicoes.
  useEffect(() => {
    taskRef.current = task
  })

  const run = useCallback(() => {
    const id = ++runId.current
    setState({ status: 'loading' })

    taskRef
      .current()
      .then((data) => {
        if (id === runId.current) setState({ status: 'success', data })
      })
      .catch((error: unknown) => {
        if (id === runId.current) {
          setState({
            status: 'error',
            message: toMessage(error),
            httpStatus: toHttpStatus(error),
          })
        }
      })
  }, [])

  useEffect(() => {
    run()
    // As deps sao definidas por quem chama o hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, reload: run }
}
