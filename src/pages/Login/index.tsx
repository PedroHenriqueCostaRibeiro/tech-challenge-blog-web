import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from '../../hooks/useAuth'

const Card = styled.div`
  max-width: 420px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(6)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  font-size: 1.5rem;
`

const Intro = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.colors.textMuted};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`

export default function Login() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Enquanto a sessao esta sendo verificada nao da para decidir nada: mostrar
  // o formulario aqui faria a tela piscar para quem ja esta logado.
  if (status === 'loading') {
    return <Spinner label="Verificando sua sessão…" />
  }

  if (status === 'authenticated') {
    return <Navigate to="/admin" replace />
  }

  const destino = (location.state as { from?: string } | null)?.from ?? '/admin'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.')
      return
    }

    setErro('')
    setEnviando(true)

    try {
      await login(email, senha)
      navigate(destino, { replace: true })
    } catch (e) {
      // A mensagem vem da API e e deliberadamente generica: revelar se o
      // e-mail existe entregaria quais contas estao cadastradas.
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card>
      <Title>Entrar</Title>
      <Intro>
        Área restrita aos(às) docentes. Estudantes podem ler o blog sem conta.
      </Intro>

      <Form onSubmit={handleSubmit} noValidate>
        <TextField
          label="E-mail"
          type="email"
          value={email}
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          value={senha}
          autoComplete="current-password"
          onChange={(e) => setSenha(e.target.value)}
        />

        {erro && <Alert>{erro}</Alert>}

        {/* Desabilitar durante o envio evita duplo clique e duas tentativas. */}
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </Form>
    </Card>
  )
}
