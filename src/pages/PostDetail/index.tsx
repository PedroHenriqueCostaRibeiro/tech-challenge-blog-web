import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { postsApi } from '../../api/posts.api'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { formatDate } from '../../utils/format'

const Back = styled(Link)`
  /* Alvo de toque de 44px: como texto simples o link ficava com 26px. */
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  font-weight: 600;
`

const Article = styled.article`
  padding: ${({ theme }) => theme.spacing(6)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  font-size: 1.75rem;
`

const Meta = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  padding-bottom: ${({ theme }) => theme.spacing(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

/**
 * `white-space: pre-wrap` preserva as quebras de linha que o(a) docente
 * digitou. O conteudo e renderizado como TEXTO: nada de
 * dangerouslySetInnerHTML, que abriria a porta para XSS em conteudo que vem
 * do banco.
 */
const Content = styled.div`
  white-space: pre-wrap;
  font-size: 1.0625rem;
`

export default function PostDetail() {
  const { id = '' } = useParams()

  const task = useCallback(() => postsApi.getById(id), [id])
  const state = useAsync(task, [id])

  return (
    <>
      <Back to="/">← Voltar para as postagens</Back>

      {state.status === 'loading' && <Spinner label="Carregando postagem…" />}

      {state.status === 'error' &&
        (state.httpStatus === 404 ? (
          // Mensagem propria: a da API traz o UUID cru, que nao diz nada a
          // quem nao e tecnico.
          <Alert variant="info">
            Postagem não encontrada. Ela pode ter sido removida.
          </Alert>
        ) : (
          <Alert onRetry={state.reload}>{state.message}</Alert>
        ))}

      {state.status === 'success' && (
        <Article>
          <Title>{state.data.title}</Title>
          <Meta>
            Por {state.data.author} · {formatDate(state.data.createdAt)}
          </Meta>
          <Content>{state.data.content}</Content>
        </Article>
      )}
    </>
  )
}
