import { render, screen } from '@testing-library/react'
import styled, { ThemeProvider } from 'styled-components'
import App from './App'
import { theme } from './styles/theme'
import { fakeResponse } from './test-utils'

/**
 * Teste de fumaça da montagem completa.
 *
 * Nao testa regra de negocio — prova que App, Router, Layout e ThemeProvider
 * se montam juntos sem quebrar.
 *
 * LIMITACAO CONHECIDA DO JSDOM: `createGlobalStyle` nao injeta folha de estilo
 * aqui — `document.styleSheets` fica vazio e o `body` nao recebe as cores do
 * tema. Verificamos no navegador real que funciona (body com #f8fafc e texto
 * #1f2937). Estilos GLOBAIS sao validados visualmente; estilos de COMPONENTE
 * sao testaveis normalmente, como o segundo caso demonstra.
 */
describe('Fundacao da aplicacao', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse([])))
  })

  it('monta a aplicacao com o cabecalho e a home', async () => {
    render(<App />)

    expect(
      screen.getByRole('link', { name: /blog acadêmico/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /postagens/i, level: 1 }),
    ).toBeInTheDocument()
  })

  it('usa marcos semanticos para navegacao assistiva', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument() // <header>
    expect(screen.getByRole('main')).toBeInTheDocument() // <main>
  })

  it('entrega o tema aos componentes estilizados', () => {
    const Probe = styled.span`
      color: ${({ theme }) => theme.colors.primary};
    `

    render(
      <ThemeProvider theme={theme}>
        <Probe>sonda</Probe>
      </ThemeProvider>,
    )

    expect(screen.getByText('sonda')).toHaveStyle({
      color: theme.colors.primary,
    })
  })
})
