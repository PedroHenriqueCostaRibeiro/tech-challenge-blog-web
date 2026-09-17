import { Link } from 'react-router-dom'
import styled from 'styled-components'

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing(12)} 0;
  text-align: center;
`

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  font-size: 1.75rem;
`

const Text = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.colors.textMuted};
`

export default function NotFound() {
  return (
    <Wrapper>
      <Title>Página não encontrada</Title>
      <Text>O endereço acessado não existe ou foi movido.</Text>
      <Link to="/">Voltar para as postagens</Link>
    </Wrapper>
  )
}
