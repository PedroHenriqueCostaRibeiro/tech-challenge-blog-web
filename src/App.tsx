import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { GlobalStyle } from './styles/global'
import { theme } from './styles/theme'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        {/* Dentro do Router: o Header usa useNavigate para o logout. */}
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
