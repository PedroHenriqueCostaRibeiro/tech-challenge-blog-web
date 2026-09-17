const KEY = 'blog.token'

/**
 * Guarda o JWT no localStorage.
 *
 * TRADE-OFF ASSUMIDO: localStorage e legivel por JavaScript, portanto
 * vulneravel a XSS. A alternativa (cookie httpOnly) exigiria reescrever a
 * autenticacao do back-end, adicionar protecao CSRF e ajustar SameSite para o
 * dominio de producao.
 *
 * As mitigacoes reais neste projeto:
 * - o React escapa todo conteudo interpolado em JSX por padrao;
 * - dangerouslySetInnerHTML nao e usado em lugar nenhum, e isso e item de
 *   revisao de codigo, nao promessa;
 * - o conteudo dos posts e renderizado como texto puro, nunca como HTML.
 *
 * Todo acesso vai dentro de try/catch: em aba anonima, com cookies de site
 * bloqueados ou com armazenamento cheio, o localStorage lanca em vez de
 * simplesmente devolver vazio.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },

  set(token: string): void {
    try {
      localStorage.setItem(KEY, token)
    } catch {
      // Sessao segue valida em memoria; so nao sobrevive a um recarregamento.
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // Nada a fazer: ja nao ha o que limpar.
    }
  },
}
