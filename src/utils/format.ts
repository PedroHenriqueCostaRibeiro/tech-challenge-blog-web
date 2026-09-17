const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

/**
 * Converte a data ISO da API em texto legivel em portugues.
 *
 * A API devolve "2026-07-14T21:33:04.854Z"; mostrar isso cru na tela seria
 * ruido para um publico nao-tecnico.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)

  // Data invalida nao pode quebrar a renderizacao do post inteiro.
  if (Number.isNaN(date.getTime())) return ''

  return dateFormatter.format(date)
}

/**
 * Resumo curto do conteudo para o card da listagem.
 *
 * A API nao expoe um campo de resumo, entao derivamos do proprio conteudo.
 * O corte respeita a ultima palavra inteira para nao terminar no meio dela.
 */
export function excerpt(content: string, maxLength = 160): string {
  const clean = content.trim().replace(/\s+/g, ' ')

  if (clean.length <= maxLength) return clean

  const cut = clean.slice(0, maxLength)

  // Se o caractere seguinte ao corte e um espaco, o limite ja caiu no fim de
  // uma palavra — recuar ate o espaco anterior descartaria uma palavra inteira
  // sem necessidade.
  if (clean[maxLength] === ' ') {
    return `${cut.trimEnd()}…`
  }

  const lastSpace = cut.lastIndexOf(' ')

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}
