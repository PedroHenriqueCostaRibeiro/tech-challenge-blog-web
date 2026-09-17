import { useEffect, useState } from 'react'

/**
 * Atrasa a propagacao de um valor ate ele parar de mudar por `delay` ms.
 *
 * Usado na busca: sem isto, cada tecla digitada dispararia uma requisicao.
 * "revolucao" sao 9 chamadas a API para uma unica intencao do usuario.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)

    // Cada nova tecla cancela o timer anterior; so o ultimo sobrevive.
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
