import type { ReactNode } from 'react'
import styled from 'styled-components'

const Box = styled.div<{ $variant: 'error' | 'info' }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ theme, $variant }) =>
      $variant === 'error' ? theme.colors.danger : theme.colors.border};
  background: ${({ theme, $variant }) =>
    $variant === 'error' ? theme.colors.dangerSoft : theme.colors.primarySoft};
  color: ${({ theme, $variant }) =>
    $variant === 'error' ? theme.colors.danger : theme.colors.text};
`

const Action = styled.button`
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(4)};
  border: 1px solid currentColor;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: inherit;
  font-weight: 600;
  min-height: 44px;
`

interface AlertProps {
  children: ReactNode
  variant?: 'error' | 'info'
  onRetry?: () => void
}

/**
 * `role="alert"` faz o leitor de tela anunciar a mensagem assim que ela
 * aparece — sem isso, quem nao enxerga nao saberia que algo deu errado.
 */
export function Alert({ children, variant = 'error', onRetry }: AlertProps) {
  return (
    <Box $variant={variant} role={variant === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onRetry && (
        <Action type="button" onClick={onRetry}>
          Tentar novamente
        </Action>
      )}
    </Box>
  )
}
