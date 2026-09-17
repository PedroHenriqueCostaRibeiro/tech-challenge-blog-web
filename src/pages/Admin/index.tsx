import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { postsApi } from '../../api/posts.api'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../hooks/useAuth'
import type { Post } from '../../types'
import { formatDate } from '../../utils/format'

const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  margin-bottom: ${({ theme }) => theme.spacing(6)};
`

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  font-size: 1.5rem;
`

const Intro = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`

const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  list-style: none;
  padding: 0;
`

/**
 * Cada item vira um cartao empilhado no mobile e uma linha no desktop.
 * Uma <table> real quebraria em telas estreitas, e o conteudo aqui e uma
 * lista de acoes, nao dados tabulares.
 */
const Item = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`

const Dados = styled.div`
  min-width: 0;
`

const Titulo = styled.h2`
  font-size: 1rem;
`

const Meta = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Acoes = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.spacing(2)};
`

export default function Admin() {
  const { user } = useAuth()

  const listar = useCallback(() => postsApi.list(), [])
  const state = useAsync(listar, [])

  const [paraExcluir, setParaExcluir] = useState<Post | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')

  async function confirmarExclusao() {
    if (!paraExcluir) return

    setExcluindo(true)
    setErroExclusao('')

    try {
      await postsApi.remove(paraExcluir.id)
      setParaExcluir(null)
      state.reload()
    } catch (erro) {
      setParaExcluir(null)
      setErroExclusao(
        erro instanceof Error ? erro.message : 'Não foi possível excluir.',
      )
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <>
      <Cabecalho>
        <div>
          <Title>Administração</Title>
          <Intro>
            Olá, {user?.name}. Aqui você gerencia as postagens do blog.
          </Intro>
        </div>
        <Button as={Link} to="/admin/posts/new">
          Nova postagem
        </Button>
      </Cabecalho>

      {erroExclusao && <Alert>{erroExclusao}</Alert>}

      {state.status === 'loading' && <Spinner label="Carregando postagens…" />}

      {state.status === 'error' && (
        <Alert onRetry={state.reload}>{state.message}</Alert>
      )}

      {state.status === 'success' &&
        (state.data.length === 0 ? (
          <EmptyState>
            Nenhuma postagem ainda. Crie a primeira em "Nova postagem".
          </EmptyState>
        ) : (
          <Lista>
            {state.data.map((post) => (
              <Item key={post.id}>
                <Dados>
                  <Titulo>{post.title}</Titulo>
                  <Meta>
                    Por {post.author} · {formatDate(post.createdAt)}
                  </Meta>
                </Dados>

                <Acoes>
                  <Button
                    as={Link}
                    to={`/admin/posts/${post.id}/edit`}
                    $variant="ghost"
                    // Sem isto, um leitor de tela anunciaria varios botoes
                    // "Editar" identicos, sem dizer de qual post.
                    aria-label={`Editar "${post.title}"`}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    $variant="ghost"
                    aria-label={`Excluir "${post.title}"`}
                    onClick={() => setParaExcluir(post)}
                  >
                    Excluir
                  </Button>
                </Acoes>
              </Item>
            ))}
          </Lista>
        ))}

      <ConfirmDialog
        aberto={paraExcluir !== null}
        titulo="Excluir postagem"
        // A mensagem nomeia o post: confirmar uma exclusao sem saber qual e
        // exatamente como se apaga a coisa errada.
        mensagem={`"${paraExcluir?.title}" será removida permanentemente. Esta ação não pode ser desfeita.`}
        rotuloConfirmar="Excluir"
        confirmando={excluindo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setParaExcluir(null)}
      />
    </>
  )
}
