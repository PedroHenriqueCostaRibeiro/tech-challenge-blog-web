import { act, renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '../api/http'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('começa em loading e passa para success com os dados', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve(['a', 'b']), []),
    )

    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current).toMatchObject({ status: 'success', data: ['a', 'b'] })
  })

  it('passa para error usando a mensagem do ApiError', async () => {
    const { result } = renderHook(() =>
      useAsync(
        () => Promise.reject(new ApiError('Post nao encontrado.', 404)),
        [],
      ),
    )

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({
      status: 'error',
      message: 'Post nao encontrado.',
    })
  })

  it('usa mensagem generica quando o erro nao e Error', async () => {
    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      useAsync(() => Promise.reject('string solta'), []),
    )

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({ message: 'Erro inesperado. Tente novamente.' })
  })

  it('re-executa a tarefa quando as deps mudam', async () => {
    const task = vi.fn().mockResolvedValue('ok')

    const { rerender } = renderHook(({ dep }) => useAsync(task, [dep]), {
      initialProps: { dep: 1 },
    })

    await waitFor(() => expect(task).toHaveBeenCalledTimes(1))

    rerender({ dep: 2 })
    await waitFor(() => expect(task).toHaveBeenCalledTimes(2))
  })

  it('nao re-executa quando as deps permanecem iguais', async () => {
    const task = vi.fn().mockResolvedValue('ok')

    const { rerender } = renderHook(({ dep }) => useAsync(task, [dep]), {
      initialProps: { dep: 1 },
    })

    await waitFor(() => expect(task).toHaveBeenCalledTimes(1))

    rerender({ dep: 1 })
    rerender({ dep: 1 })

    expect(task).toHaveBeenCalledTimes(1)
  })

  it('descarta resposta antiga que chega depois da nova (corrida)', async () => {
    // Simula busca: o usuario digita "a" (lenta) e depois "ab" (rapida).
    // A resposta de "a" chega por ultimo e NAO pode sobrescrever a de "ab".
    let resolveLenta: (v: string) => void = () => {}
    const lenta = new Promise<string>((r) => {
      resolveLenta = r
    })

    const task = vi
      .fn()
      .mockReturnValueOnce(lenta)
      .mockResolvedValueOnce('resultado novo')

    const { result, rerender } = renderHook(
      ({ dep }) => useAsync(task, [dep]),
      { initialProps: { dep: 'a' } },
    )

    rerender({ dep: 'ab' })
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current).toMatchObject({ data: 'resultado novo' })

    // Agora a resposta atrasada chega — deve ser ignorada.
    await act(async () => {
      resolveLenta('resultado antigo')
      await lenta
    })

    expect(result.current).toMatchObject({ data: 'resultado novo' })
  })

  it('reload re-executa a tarefa sob demanda', async () => {
    const task = vi.fn().mockResolvedValue('ok')

    const { result } = renderHook(() => useAsync(task, []))

    await waitFor(() => expect(result.current.status).toBe('success'))

    act(() => result.current.reload())

    await waitFor(() => expect(task).toHaveBeenCalledTimes(2))
  })
})
