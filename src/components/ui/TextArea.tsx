import { useId, type TextareaHTMLAttributes } from 'react'
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

const Field = styled.textarea<{ $invalid: boolean }>`
  width: 100%;
  min-height: 220px;
  padding: ${({ theme }) => theme.spacing(3)};
  border: 1px solid
    ${({ theme, $invalid }) =>
      $invalid ? theme.colors.danger : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
`

const Error = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.danger};
`

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

/** Mesma anatomia do TextField, para conteudo longo. */
export function TextArea({ label, error, ...props }: TextAreaProps) {
  const id = useId()
  const errorId = `${id}-erro`

  return (
    <Wrapper>
      <Label htmlFor={id}>{label}</Label>
      <Field
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
