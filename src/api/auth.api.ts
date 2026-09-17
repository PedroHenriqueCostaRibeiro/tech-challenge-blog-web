import type { LoginResponse, User } from '../types'
import { request } from './http'

export const authApi = {
  /**
   * `anonymous: true` porque aqui um 401 significa "senha errada", nao "sessao
   * expirada". Sem isso, errar a senha dispararia o fluxo de sessao expirada e
   * redirecionaria para a propria tela de login, em laco.
   */
  login: (email: string, password: string) =>
    request<LoginResponse>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      { anonymous: true },
    ),

  /**
   * Reidrata a sessao a partir do token guardado no navegador.
   *
   * Decodificar o JWT no cliente apenas leria o que ele afirma: nao verifica a
   * assinatura, nao percebe revogacao e nao sabe se o usuario ainda existe. So
   * o servidor responde isso.
   */
  me: () => request<User>('/auth/me'),
}
