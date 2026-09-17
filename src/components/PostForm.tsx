import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { CreatePostInput } from '../types'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { TextArea } from './ui/TextArea'
import { TextField } from './ui/TextField'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(5)};
  max-width: 720px;
`

const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(3)};
`

type Erros = Partial<Record<keyof CreatePostInput, string>>

interface PostFormProps {
  /** Valores iniciais. Na edicao, sao os dados atuais do post. */
  valorInicial: CreatePostInput
  rotuloEnvio: string
  onSubmit: (dados: CreatePostInput) => Promise<void>
}

/**
 * Formulario compartilhado entre criar (RF3) e editar (RF4).
 *
 * As duas telas sao quase identicas -- mesmos campos, mesma validacao, mesmo
 * layout. Duplica-las significaria corrigir cada bug duas vezes.
 */
export function PostForm({
  valorInicial,
  rotuloEnvio,
  onSubmit,
}: PostFormProps) {
  const [dados, setDados] = useState<CreatePostInput>(valorInicial)
  const [erros, setErros] = useState<Erros>({})
  const [erroServidor, setErroServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  function alterar(campo: keyof CreatePostInput, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  /**
   * Espelha a validacao do servidor, sem substitui-la.
   *
   * A do cliente existe para dar retorno imediato; a do servidor e a que vale,
   * porque o navegador esta sob controle de quem o usa.
   */
  function validar(): boolean {
    const encontrados: Erros = {}

    if (!dados.title.trim()) encontrados.title = 'Informe o título.'
    if (!dados.content.trim()) encontrados.content = 'Informe o conteúdo.'
    if (!dados.author.trim()) encontrados.author = 'Informe o autor.'

    setErros(encontrados)
    return Object.keys(encontrados).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErroServidor('')

    if (!validar()) return

    setEnviando(true)

    try {
      await onSubmit({
        title: dados.title.trim(),
        content: dados.content.trim(),
        author: dados.author.trim(),
      })
    } catch (erro) {
      // O texto digitado permanece no formulario: perde-lo obrigaria a pessoa
      // a reescrever um post inteiro por causa de um erro de rede.
      setErroServidor(
        erro instanceof Error ? erro.message : 'Não foi possível salvar.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <TextField
        label="Título"
        value={dados.title}
        error={erros.title}
        onChange={(e) => alterar('title', e.target.value)}
      />

      <TextArea
        label="Conteúdo"
        value={dados.content}
        error={erros.content}
        onChange={(e) => alterar('content', e.target.value)}
      />

      <TextField
        label="Autor"
        value={dados.author}
        error={erros.author}
        onChange={(e) => alterar('author', e.target.value)}
      />

      {erroServidor && <Alert>{erroServidor}</Alert>}

      <Acoes>
        {/* Desabilitar durante o envio evita o duplo clique criar dois posts. */}
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : rotuloEnvio}
        </Button>
        <Button as={Link} to="/admin" $variant="ghost">
          Cancelar
        </Button>
      </Acoes>
    </Form>
  )
}
