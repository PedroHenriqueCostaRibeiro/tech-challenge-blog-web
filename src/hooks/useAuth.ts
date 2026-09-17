import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../contexts/auth-context'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  // Sem esta checagem o erro apareceria como "cannot read property of null"
  // em algum componente distante, escondendo a causa real.
  if (!context) {
    throw new Error('useAuth precisa estar dentro de um <AuthProvider>.')
  }

  return context
}
