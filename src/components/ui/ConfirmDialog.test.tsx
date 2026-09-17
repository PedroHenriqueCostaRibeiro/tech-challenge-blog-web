import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { theme } from '../../styles/theme'
import { ConfirmDialog } from './ConfirmDialog'

function renderDialogo(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <ConfirmDialog
        aberto
        titulo="Excluir postagem"
        mensagem='"Revolução Francesa" será removida permanentemente.'
        rotuloConfirmar="Excluir"
        onConfirmar={() => {}}
        onCancelar={() => {}}
        {...props}
      />
    </ThemeProvider>,
  )
}

describe('ConfirmDialog: acessibilidade', () => {
  it('o dialogo e nomeado pelo titulo', () => {
    renderDialogo()

    const dialogo = document.querySelector('dialog')!
    const tituloId = dialogo.getAttribute('aria-labelledby')

    expect(document.getElementById(tituloId!)).toHaveTextContent(
      'Excluir postagem',
    )
  })

  it('o dialogo e descrito pela mensagem, que diz QUAL item sera removido', () => {
    // So o titulo ("Excluir postagem") nao informa de qual postagem se trata.
    renderDialogo()

    const dialogo = document.querySelector('dialog')!
    const mensagemId = dialogo.getAttribute('aria-describedby')

    expect(document.getElementById(mensagemId!)).toHaveTextContent(
      'Revolução Francesa',
    )
  })

  it('usa ids gerados, nao fixos: dois dialogos nao colidem', () => {
    renderDialogo()
    renderDialogo({ titulo: 'Outro dialogo' })

    const ids = [...document.querySelectorAll('dialog')].map((d) =>
      d.getAttribute('aria-labelledby'),
    )

    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })
})

describe('ConfirmDialog: acoes', () => {
  it('confirmar dispara a acao', async () => {
    const onConfirmar = vi.fn()
    renderDialogo({ onConfirmar })

    await userEvent.setup().click(screen.getByRole('button', { name: 'Excluir' }))

    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it('cancelar nao dispara a acao destrutiva', async () => {
    const onConfirmar = vi.fn()
    const onCancelar = vi.fn()
    renderDialogo({ onConfirmar, onCancelar })

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancelar).toHaveBeenCalledTimes(1)
    expect(onConfirmar).not.toHaveBeenCalled()
  })

  it('desabilita a confirmacao durante a exclusao, evitando duplo clique', () => {
    renderDialogo({ confirmando: true })

    expect(screen.getByRole('button', { name: /excluindo/i })).toBeDisabled()
  })
})
