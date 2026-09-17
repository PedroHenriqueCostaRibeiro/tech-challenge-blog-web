import { useAuth } from '../../hooks/useAuth'

/**
 * Esqueleto da pagina administrativa (RF5).
 * A listagem com editar/excluir chega na proxima etapa.
 */
export default function Admin() {
  const { user } = useAuth()

  return (
    <>
      <h1>Administração</h1>
      <p>Olá, {user?.name}. Aqui você gerencia suas postagens.</p>
    </>
  )
}
