import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Button } from './Button'

const Dialog = styled.dialog`
  width: min(420px, calc(100vw - 32px));
  padding: ${({ theme }) => theme.spacing(6)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};

  &::backdrop {
    background: rgb(15 23 42 / 0.5);
  }
`

const Titulo = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  font-size: 1.125rem;
`

const Texto = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.colors.textMuted};
`

const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(3)};
`

const Perigo = styled(Button)`
  border-color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.danger};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.danger};
    background: ${({ theme }) => theme.colors.danger};
    filter: brightness(0.92);
  }
`

interface ConfirmDialogProps {
  aberto: boolean
  titulo: string
  mensagem: string
  rotuloConfirmar: string
  confirmando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

/**
 * Confirmacao para acoes destrutivas.
 *
 * Usa o <dialog> nativo com showModal(), que ja entrega captura de foco,
 * fechamento por Esc e inercia do resto da pagina -- tudo o que uma
 * implementacao manual com <div> precisaria reconstruir e costuma errar.
 */
export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  rotuloConfirmar,
  confirmando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (aberto && !dialog.open) {
      dialog.showModal()
    } else if (!aberto && dialog.open) {
      dialog.close()
    }
  }, [aberto])

  return (
    <Dialog
      ref={ref}
      aria-labelledby="confirm-titulo"
      // Disparado pelo Esc: sem isto o dialogo fecharia sem o React saber,
      // e o estado ficaria dessincronizado do DOM.
      onCancel={(event) => {
        event.preventDefault()
        onCancelar()
      }}
    >
      <Titulo id="confirm-titulo">{titulo}</Titulo>
      <Texto>{mensagem}</Texto>

      <Acoes>
        <Button type="button" $variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Perigo type="button" disabled={confirmando} onClick={onConfirmar}>
          {confirmando ? 'Excluindo…' : rotuloConfirmar}
        </Perigo>
      </Acoes>
    </Dialog>
  )
}
