import styled, { css } from 'styled-components'

/** `min-height: 44px` atende o alvo de toque minimo recomendado no mobile. */
export const Button = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(5)};
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 600;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${({ theme, $variant = 'primary' }) =>
    $variant === 'primary'
      ? css`
          border: 1px solid ${theme.colors.primary};
          background: ${theme.colors.primary};
          color: #fff;

          &:hover:not(:disabled) {
            background: ${theme.colors.primaryDark};
            border-color: ${theme.colors.primaryDark};
          }
        `
      : css`
          border: 1px solid ${theme.colors.border};
          background: ${theme.colors.surface};
          color: ${theme.colors.text};

          &:hover:not(:disabled) {
            border-color: ${theme.colors.primary};
            color: ${theme.colors.primary};
          }
        `}
`
