import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { postsApi } from '../../api/posts.api'
import { PostForm } from '../../components/PostForm'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import type { CreatePostInput } from '../../types'

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  font-size: 1.5rem;
`

const Intro = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.colors.textMuted};
`

export default function PostEdit() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const task = useCallback(() => postsApi.getById(id), [id])
  const state = useAsync(task, [id])

  async function salvar(dados: CreatePostInput) {
    await postsApi.update(id, dados)
    navigate('/admin')
  }

  return (
    <>
      <Title>Editar postagem</Title>

      {state.status === 'loading' && <Spinner label="Carregando postagem…" />}

      {state.status === 'error' &&
        (state.httpStatus === 404 ? (
          <Alert variant="info">
            Postagem não encontrada. Ela pode ter sido removida.
          </Alert>
        ) : (
          <Alert onRetry={state.reload}>{state.message}</Alert>
        ))}

      {/*
        O formulario so e montado DEPOIS que os dados chegam. Renderiza-lo
        antes e preencher depois criaria um campo controlado que muda de valor
        sozinho, e o requisito e explicito: carregar os dados atuais para
        edicao.
      */}
      {state.status === 'success' && (
        <>
          <Intro>Altere o que precisar e salve.</Intro>
          <PostForm
            valorInicial={{
              title: state.data.title,
              content: state.data.content,
              author: state.data.author,
            }}
            rotuloEnvio="Salvar alterações"
            onSubmit={salvar}
          />
        </>
      )}
    </>
  )
}
