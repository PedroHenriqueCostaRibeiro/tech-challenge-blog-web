import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Container } from './Container'

const Bar = styled.header`
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Inner = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  min-height: 64px;
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

const Tagline = styled.span`
  display: none;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: inline;
  }
`

export function Header() {
  return (
    <Bar>
      <Inner as="div">
        <Brand to="/">Blog Acadêmico</Brand>
        <Tagline>Conteúdo para professores(as) e alunos(as)</Tagline>
      </Inner>
    </Bar>
  )
}
