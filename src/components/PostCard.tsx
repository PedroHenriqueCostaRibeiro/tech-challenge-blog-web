import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { Post } from '../types'
import { excerpt, formatDate } from '../utils/format'

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  height: 100%;
  padding: ${({ theme }) => theme.spacing(5)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const Title = styled.h2`
  font-size: 1.125rem;

  a {
    color: ${({ theme }) => theme.colors.primaryDark};
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`

const Meta = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Excerpt = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`

/**
 * Item da listagem. O RF1 exige titulo, autor e uma breve descricao — a
 * descricao e derivada do conteudo, porque a API nao expoe campo de resumo.
 */
export function PostCard({ post }: { post: Post }) {
  const date = formatDate(post.createdAt)

  return (
    <Card>
      <Title>
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </Title>
      <Meta>
        Por {post.author}
        {date && ` · ${date}`}
      </Meta>
      <Excerpt>{excerpt(post.content)}</Excerpt>
    </Card>
  )
}
