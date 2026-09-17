import { render, screen } from '@testing-library/react'
import styled, { ThemeProvider } from 'styled-components'
import App from './App'
import { theme } from './styles/theme'

/**
 * Teste de fumaça da fundação.
 *
 * Nao testa regra de negocio — prova que a montagem funciona ponta a ponta:
 * React renderiza, o BrowserRouter resolve a rota, o ThemeProvider entrega o
 * tema aos componentes e os matchers do jest-dom estao registrados.
 *
 * LIMITACAO CONHECIDA DO JSDOM: `createGlobalStyle` nao injeta folha de estilo
 * no jsdom — `document.styleSheets` fica vazio e o `body` nao recebe as cores
 * do tema. Verificamos no navegador real que funciona (body com background
 * #f8fafc e cor #1f2937). Portanto estilos GLOBAIS sao validados visualmente,
 * nao por teste automatizado; estilos de COMPONENTE sao testaveis aqui, como o
 * segundo caso abaixo demonstra.
 */
describe('Fundacao da aplicacao', () => {
  it('renderiza a home na rota raiz', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /posts/i })).toBeInTheDocument()
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
