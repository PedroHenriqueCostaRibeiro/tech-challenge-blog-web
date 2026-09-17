/**
 * Tipos espelhados do contrato da API.
 *
 * Atencao: `createdAt` e `updatedAt` chegam como string ISO (o JSON nao tem
 * Date). A conversao acontece na renderizacao, nao aqui.
 */
export interface Post {
  id: string
  title: string
  content: string
  author: string
  createdAt: string
  updatedAt: string
}

/** Payload de criacao: a API exige os tres campos preenchidos. */
export interface CreatePostInput {
  title: string
  content: string
  author: string
}

export type UpdatePostInput = Partial<CreatePostInput>
