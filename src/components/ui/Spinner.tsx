import styled, { keyframes } from 'styled-components'
import { VisuallyHidden } from './VisuallyHidden'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(12)} 0;
`

const Circle = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`

/**
 * O texto invisivel existe para leitores de tela: um circulo girando nao
 * comunica nada a quem nao enxerga.
 *
 * Nota: a API hospedada no plano gratuito do Render hiberna, e a primeira
 * requisicao pode levar dezenas de segundos. Sem este indicador a aplicacao
 * pareceria travada.
 */
export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <Wrapper role="status">
      <Circle />
      <VisuallyHidden>{label}</VisuallyHidden>
    </Wrapper>
  )
}
