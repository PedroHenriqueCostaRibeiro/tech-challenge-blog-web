import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../ui/Spinner'

/**
 * Guarda das rotas de docente.
 *
 * ATENCAO: isto e experiencia de uso, NAO seguranca. O navegador esta sob
 * controle de quem o usa, e o DevTools contorna qualquer verificacao no
 * cliente. A protecao real esta no middleware ensureAuth da API, que responde
 * 401 mesmo que alguem chame o endpoint direto. Esta guarda existe para nao
 * mostrar ao usuario portas que ele nao pode abrir.
 */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  /**
   * Marca se a sessao chegou a existir enquanto esta rota esteve montada.
   *
   * E o que distingue "a pessoa clicou em Sair" de "a pessoa tentou entrar
   * direto sem conta" -- dois casos que merecem destinos diferentes, mas que
   * do ponto de vista do status sao identicos: anonimo numa rota protegida.
   *
   * Guardado em estado, e nao em ref: refs nao devem ser lidos nem escritos
   * durante a renderizacao, porque com renderizacao concorrente o valor pode
   * ficar inconsistente com o que foi desenhado.
   */
  const [esteveAutenticado, setEsteveAutenticado] = useState(false)

  /**
   * O linter sinaliza setState dentro de efeito, e aqui isso e aceito de
   * proposito: "esteve autenticado" e um fato HISTORICO, que por definicao
   * nao pode ser derivado do status atual -- no momento em que precisamos
   * dele, o status ja e "anonymous" nos dois casos que queremos distinguir.
   *
   * As alternativas foram avaliadas: guardar em ref e ler durante a
   * renderizacao tambem e sinalizado, e por um motivo mais serio (refs podem
   * ficar inconsistentes com o que foi desenhado). Entre as duas, o estado e
   * o padrao correto.
   */
  useEffect(() => {
    if (status === 'authenticated') setEsteveAutenticado(true)
  }, [status])

  if (status === 'loading') {
    /**
     * O estado de verificacao e tratado explicitamente: redirecionar durante
     * ele expulsaria o usuario logado a cada F5, porque a validacao do token
     * com o servidor ainda nao terminou.
     */
    return <Spinner label="Verificando sua sessão…" />
  }

  if (status === 'authenticated') {
    return <Outlet />
  }

  // Saiu da conta: volta ao blog publico, onde ainda pode ler.
  if (esteveAutenticado) {
    return <Navigate to="/" replace />
  }

  // Nunca teve sessao: vai ao login, guardando o destino para voltar depois.
  // `replace` evita que o botao "voltar" caia de novo na rota bloqueada.
  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}
