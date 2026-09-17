import { Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import Admin from '../pages/Admin'
import Home from '../pages/Home'
import Login from '../pages/Login'
import NotFound from '../pages/NotFound'
import PostDetail from '../pages/PostDetail'

/**
 * Rotas da aplicacao.
 *
 * As rotas de docente ficam todas sob /admin, o que permite aplicar a guarda
 * UMA vez em vez de repeti-la por pagina -- menos superficie para esquecer de
 * proteger uma rota nova.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Publicas: estudantes leem o blog sem conta. */}
        <Route path="/" element={<Home />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/login" element={<Login />} />

        {/* Exclusivas de docentes autenticados. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
