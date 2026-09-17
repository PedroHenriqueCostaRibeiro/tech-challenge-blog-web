import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { postsApi } from '../../api/posts.api'
import { PostForm } from '../../components/PostForm'
import { useAuth } from '../../hooks/useAuth'
import type { CreatePostInput } from '../../types'

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  font-size: 1.5rem;
`

const Intro = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.colors.textMuted};
`

export default function PostCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function criar(dados: CreatePostInput) {
    await postsApi.create(dados)
    navigate('/admin')
  }

  return (
    <>
      <Title>Nova postagem</Title>
      <Intro>Preencha os campos e publique para os(as) estudantes.</Intro>

      <PostForm
        /**
         * O `key` remonta o formulario se o docente chegar depois da primeira
         * renderizacao.
         *
         * PostForm guarda `valorInicial` em useState, que so olha o valor da
         * montagem. Sem o key, um usuario que chegue tarde deixaria o campo de
         * autor vazio -- hoje a ProtectedRoute impede esse cenario, mas
         * depender disso em silencio e um acoplamento escondido.
         */
        key={user?.id ?? 'sem-usuario'}
        // O autor vem preenchido com o nome de quem esta logado, mas segue
        // editavel: o requisito pede um campo de autor, e o valor e um rotulo
        // de exibicao, nao uma comprovacao de identidade. Quem autoriza a
        // publicacao e o token, nao este campo.
        valorInicial={{ title: '', content: '', author: user?.name ?? '' }}
        rotuloEnvio="Publicar"
        onSubmit={criar}
      />
    </>
  )
}
