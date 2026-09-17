import type { CreatePostInput, Post, UpdatePostInput } from '../types'
import { request } from './http'

/**
 * Operacoes de post expostas pela API.
 *
 * Mapeiam 1:1 os endpoints do back-end. A ordem das rotas no servidor importa
 * (/posts/search e declarada antes de /posts/:id), mas isso e detalhe de la —
 * aqui sao apenas caminhos distintos.
 */
export const postsApi = {
  list: () => request<Post[]>('/posts'),

  /** O termo vai codificado: sem isso, "a&b" quebraria a query string. */
  search: (term: string) =>
    request<Post[]>(`/posts/search?q=${encodeURIComponent(term)}`),

  getById: (id: string) => request<Post>(`/posts/${encodeURIComponent(id)}`),

  create: (data: CreatePostInput) =>
    request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdatePostInput) =>
    request<Post>(`/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Responde 204 sem corpo — tratado no request(). */
  remove: (id: string) =>
    request<void>(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
