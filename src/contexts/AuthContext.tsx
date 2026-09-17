import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api/auth.api'
import { ApiError, setUnauthorizedHandler } from '../api/http'
import { tokenStorage } from '../api/token'
import type { User } from '../types'
import { AuthContext, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * O estado inicial ja e derivado do armazenamento: sem token guardado, nao
   * ha o que verificar e a pessoa e anonima desde o primeiro render.
   *
   * Comecar sempre em "loading" e corrigir num efeito provocaria um render
   * extra e um piscar do cabecalho a cada carregamento de quem nao esta
   * logado -- que e a maioria das visitas, ja que a leitura e publica.
   */
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? 'loading' : 'anonymous',
  )
  const [user, setUser] = useState<User | null>(null)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  // Reidrata a sessao no boot: havendo token, pergunta ao servidor se ele vale.
  useEffect(() => {
    // Sem token o estado inicial ja e "anonymous" — nada a verificar.
    if (!tokenStorage.get()) return

    let cancelado = false

    authApi
      .me()
      .then((dados) => {
        if (cancelado) return
        setUser(dados)
        setStatus('authenticated')
      })
      .catch((erro: unknown) => {
        if (cancelado) return

        /**
         * So um 401 prova que o token e ruim.
         *
         * Qualquer outra falha -- rede fora, API hibernando, 500 -- diz apenas
         * que NAO FOI POSSIVEL VERIFICAR, o que e diferente de "invalido".
         * Descartar a sessao nesse caso deslogaria um docente com token
         * perfeitamente valido, e o plano gratuito onde a API hiberna torna
         * isso rotineiro, nao raro.
         *
         * Nesses casos o token e preservado: a pessoa entra de novo se quiser,
         * e um recarregamento com a API de volta reidrata a sessao sozinho.
         */
        if (erro instanceof ApiError && erro.status === 401) {
          clearSession()
          return
        }

        setStatus('anonymous')
      })

    return () => {
      cancelado = true
    }
  }, [clearSession])

  // Qualquer 401 em rota autenticada derruba a sessao, venha de onde vier.
  useEffect(() => {
    setUnauthorizedHandler(clearSession)

    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: autenticado } = await authApi.login(email, password)

    tokenStorage.set(token)
    setUser(autenticado)
    setStatus('authenticated')
  }, [])

  const value = useMemo(
    () => ({ status, user, login, logout: clearSession }),
    [status, user, login, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
