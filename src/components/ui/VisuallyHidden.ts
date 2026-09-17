import styled from 'styled-components'

/**
 * Esconde visualmente mantendo o conteudo disponivel para leitores de tela.
 *
 * `display: none` removeria do fluxo de acessibilidade tambem — por isso o
 * recorte de 1px em vez de simplesmente ocultar.
 */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`
