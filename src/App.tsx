import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import AppRoutes from './routes/AppRoutes'
import { GlobalStyle } from './styles/global'
import { theme } from './styles/theme'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}
