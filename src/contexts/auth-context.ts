import { createContext } from 'react'
import type { User } from '../types'

/**
 * TRES estados, nao dois.
 *
 * "loading" existe porque, logo apos um F5, o token esta no localStorage mas a
 * aplicacao ainda nao sabe se ele e valido. Tratar esse instante como
 * "anonymous" faria a guarda de rota expulsar o usuario logado a cada
 * recarregamento -- o bug mais comum deste padrao.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

/**
 * O contexto mora em arquivo proprio, separado do AuthProvider.
 *
 * Um arquivo que exporta componentes e nao-componentes juntos quebra o Fast
 * Refresh do Vite: qualquer alteracao no provider recarrega a pagina inteira
 * em vez de atualizar so o componente, e o estado da sessao se perde a cada
 * salvamento durante o desenvolvimento.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
