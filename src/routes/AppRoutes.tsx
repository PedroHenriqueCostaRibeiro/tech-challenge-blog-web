import { Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import PostDetail from '../pages/PostDetail'

/**
 * Rotas publicas da aplicacao.
 *
 * As rotas de docente (criacao, edicao e administracao) entram sob o prefixo
 * /admin quando a autenticacao existir, protegidas por uma unica guarda.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/posts/:id" element={<PostDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
