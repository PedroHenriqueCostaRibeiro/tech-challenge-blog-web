import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Container } from './Container'

const Bar = styled.header`
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Inner = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 64px;
  padding-top: ${({ theme }) => theme.spacing(2)};
  padding-bottom: ${({ theme }) => theme.spacing(2)};
`

const Brand = styled(Link)`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
`

const Saudacao = styled.span`
  display: none;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};

  /* Some no mobile: o nome do docente e o que menos importa numa tela
     estreita, e mante-lo empurraria os botoes para fora. */
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: inline;
  }
`

export function Header() {
  const { status, user, logout } = useAuth()

  function sair() {
    /**
     * Apenas encerra a sessao. Para onde ir e decisao da ProtectedRoute, que
     * distingue quem saiu da conta (vai para a home) de quem tentou entrar
     * direto sem conta (vai para o login).
     *
     * Navegar daqui nao funciona: o React agrupa a troca de rota com a
     * mudanca de status, e a guarda decide primeiro. Adiar com setTimeout
     * passa no jsdom mas NAO no navegador real -- verificado.
     */
    logout()
  }

  return (
    <Bar>
      <Inner as="div">
        <Brand to="/">Blog Acadêmico</Brand>

        <Nav aria-label="Acesso de docentes">
          {status === 'authenticated' ? (
            <>
              <Saudacao>Olá, {user?.name}</Saudacao>
              <Button as={Link} to="/admin" $variant="ghost">
                Administração
              </Button>
              <Button type="button" $variant="ghost" onClick={sair}>
                Sair
              </Button>
            </>
          ) : (
            // Durante "loading" tambem mostramos "Entrar": e o estado mais
            // provavel e evita o cabecalho piscar entre duas versoes.
            <Button as={Link} to="/login" $variant="ghost">
              Entrar
            </Button>
          )}
        </Nav>
      </Inner>
    </Bar>
  )
}
