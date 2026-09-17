import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api/auth.api'
import { setUnauthorizedHandler } from '../api/http'
import { tokenStorage } from '../api/token'
import type { User } from '../types'

/**
 * TRES estados, nao dois.
 *
 * "loading" existe porque, logo apos um F5, o token esta no localStorage mas o
 * React ainda nao sabe se ele e valido. Tratar esse instante como "anonimo"
 * faria a guarda de rota expulsar o usuario logado a cada recarregamento -- o
 * bug mais comum deste padrao.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  // Reidrata a sessao no boot: le o token e pergunta ao servidor se ele vale.
  useEffect(() => {
    if (!tokenStorage.get()) {
      setStatus('anonymous')
      return
    }

    let cancelado = false

    authApi
      .me()
      .then((dados) => {
        if (cancelado) return
        setUser(dados)
        setStatus('authenticated')
      })
      .catch(() => {
        // Token expirado, adulterado, ou usuario removido do banco.
        if (!cancelado) clearSession()
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
