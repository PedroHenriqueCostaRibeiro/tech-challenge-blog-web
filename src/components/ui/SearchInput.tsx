import { useId } from 'react'
import styled from 'styled-components'

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(6)};
`

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Input = styled.input`
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

/**
 * O `useId` liga o <label> ao <input> de forma unica por instancia. Um id fixo
 * quebraria se a busca aparecesse duas vezes na mesma pagina — e sem o label
 * associado, o leitor de tela anuncia apenas "caixa de texto".
 */
export function SearchInput({ value, onChange }: SearchInputProps) {
  const id = useId()

  return (
    <Field>
      <Label htmlFor={id}>Buscar postagens</Label>
      <Input
        id={id}
        type="search"
        value={value}
        placeholder="Digite um título, autor ou palavra-chave"
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}
