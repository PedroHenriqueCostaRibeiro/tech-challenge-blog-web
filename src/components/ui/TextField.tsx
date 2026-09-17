import { useId, type InputHTMLAttributes } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`

const Label = styled.label`
  font-weight: 600;
  font-size: 0.9375rem;
`

const Input = styled.input<{ $invalid: boolean }>`
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  border: 1px solid
    ${({ theme, $invalid }) =>
      $invalid ? theme.colors.danger : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
`

const Error = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.danger};
`

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

/**
 * Campo de formulario com rotulo sempre associado.
 *
 * O `useId` gera um id unico por instancia: um id fixo quebraria se o mesmo
 * campo aparecesse duas vezes na pagina, e sem a associacao o leitor de tela
 * anuncia apenas "caixa de texto".
 *
 * `aria-invalid` e `aria-describedby` fazem o leitor de tela anunciar o erro
 * junto com o campo, em vez de deixa-lo como um texto solto ao lado.
 */
export function TextField({ label, error, ...props }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`

  return (
    <Wrapper>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        $invalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && <Error id={errorId}>{error}</Error>}
    </Wrapper>
  )
}
