import styled from 'styled-components'

const Box = styled.div`
  padding: ${({ theme }) => theme.spacing(12)} ${({ theme }) => theme.spacing(4)};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
`

/**
 * Lista vazia e um resultado valido, nao um erro — por isso `status` e nao
 * `alert`. Mostrar uma area em branco deixaria o usuario sem saber se a busca
 * terminou ou travou.
 */
export function EmptyState({ children }: { children: string }) {
  return <Box role="status">{children}</Box>
}
