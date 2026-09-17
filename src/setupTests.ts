import '@testing-library/jest-dom/vitest'

/**
 * Shim de <dialog> para o ambiente de teste.
 *
 * O jsdom 29 ainda nao implementa showModal()/close(). Optamos por manter o
 * <dialog> nativo no codigo — ele entrega captura de foco, fechamento por Esc
 * e inercia do fundo, coisas que uma implementacao manual com <div> teria de
 * reconstruir e costuma errar.
 *
 * Este shim replica apenas o suficiente para os testes exercitarem a LOGICA do
 * dialogo (abrir, fechar, confirmar, cancelar). O comportamento nativo de foco
 * e teclado nao existe no jsdom de qualquer forma, entao e verificado no
 * navegador real.
 */
if (typeof HTMLDialogElement !== 'undefined') {
  const proto = HTMLDialogElement.prototype

  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
  }

  if (typeof proto.close !== 'function') {
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
}
