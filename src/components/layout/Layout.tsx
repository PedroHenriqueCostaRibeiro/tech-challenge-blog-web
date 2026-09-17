import { Outlet } from 'react-router-dom'
import styled from 'styled-components'
import { Container } from './Container'
import { Header } from './Header'

const Main = styled.main`
  padding: ${({ theme }) => theme.spacing(8)} 0 ${({ theme }) => theme.spacing(16)};
`

/**
 * Moldura comum a todas as paginas: cabecalho fixo e o conteudo da rota atual
 * dentro de <main>, que e o marco de referencia que leitores de tela usam para
 * pular direto ao conteudo.
 */
export function Layout() {
  return (
    <>
      <Header />
      <Main>
        <Container>
          <Outlet />
        </Container>
      </Main>
    </>
  )
}
