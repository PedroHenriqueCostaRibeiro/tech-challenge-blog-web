import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { AuthProvider } from './contexts/AuthContext'
import { theme } from './styles/theme'
import type { Post, User } from './types'

/**
 * Renderiza um componente com os provedores que a aplicacao real fornece.
 *
 * Usa MemoryRouter em vez de BrowserRouter: o teste controla a rota inicial
 * sem depender do location do jsdom.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ThemeProvider>,
  )
}

/** Post de exemplo; sobrescreva so o que o teste precisa. */
export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    title: 'Revolução Francesa',
    content: 'Aula sobre 1789 e seus impactos na Europa.',
    author: 'Prof. Maria',
    createdAt: '2026-07-14T21:33:04.854Z',
    updatedAt: '2026-07-14T21:33:04.854Z',
    ...overrides,
  }
}

/** Response falsa para o fetch mockado. */
export function fakeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

/** Docente de exemplo; sobrescreva so o que o teste precisa. */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Maria Silva',
    email: 'maria@escola.edu.br',
    ...overrides,
  }
}

/**
 * Como `renderWithProviders`, mas tambem com o AuthProvider.
 *
 * Use quando o componente sob teste depende da sessao (guarda de rota,
 * cabecalho, tela de login).
 */
export function renderWithAuth(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

/** Promessa que nunca resolve: congela uma requisicao em "carregando". */
export function nuncaResolve(): Promise<never> {
  return new Promise(() => {})
}
