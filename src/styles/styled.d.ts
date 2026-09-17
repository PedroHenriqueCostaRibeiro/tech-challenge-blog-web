import 'styled-components'
import type { AppTheme } from './theme'

/**
 * Declaration merging: faz `props.theme` ser tipado com o nosso tema,
 * em vez de um objeto vazio. Sem isto, `props.theme.colors` nao existe
 * para o TypeScript.
 *
 * styled-components v6 ja traz os proprios tipos — nao instale
 * @types/styled-components, que e da v5 e conflita.
 */
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
