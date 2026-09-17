import styled from 'styled-components'

/**
 * Limita a largura da leitura e garante a margem lateral no mobile.
 *
 * O padding de 16px e o que evita o texto encostar na borda da tela em
 * aparelhos estreitos (320px).
 */
export const Container = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.maxWidth};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing(4)};
`
