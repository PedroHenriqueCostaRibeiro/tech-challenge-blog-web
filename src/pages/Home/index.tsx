import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { postsApi } from '../../api/posts.api'
import { PostCard } from '../../components/PostCard'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { SearchInput } from '../../components/ui/SearchInput'
import { Spinner } from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce } from '../../hooks/useDebounce'

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  font-size: 1.75rem;
`

const Intro = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** Mobile-first: uma coluna, ampliando conforme a largura permite. */
const Grid = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  grid-template-columns: 1fr;
  list-style: none;
  padding: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export default function Home() {
  const [term, setTerm] = useState('')
  const debouncedTerm = useDebounce(term)
  const query = debouncedTerm.trim()

  // Termo vazio volta a listagem completa; com termo, consulta a busca.
  const task = useCallback(
    () => (query ? postsApi.search(query) : postsApi.list()),
    [query],
  )

  const state = useAsync(task, [query])

  return (
    <>
      <Title>Postagens</Title>
      <Intro>
        Conteúdos publicados pelos(as) docentes. Use a busca para filtrar por
        título, autor ou palavra-chave.
      </Intro>

      <SearchInput value={term} onChange={setTerm} />

      {state.status === 'loading' && <Spinner label="Carregando postagens…" />}

      {state.status === 'error' && (
        <Alert onRetry={state.reload}>{state.message}</Alert>
      )}

      {state.status === 'success' &&
        (state.data.length === 0 ? (
          <EmptyState>
            {query
              ? `Nenhuma postagem encontrada para "${query}".`
              : 'Nenhuma postagem publicada ainda.'}
          </EmptyState>
        ) : (
          <Grid>
            {state.data.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </Grid>
        ))}
    </>
  )
}
