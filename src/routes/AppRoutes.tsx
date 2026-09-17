import { Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import PostDetail from '../pages/PostDetail'

/**
 * Rotas publicas da aplicacao — leitura nao exige conta, por decisao de
 * produto: estudantes consomem o blog sem login.
 *
 * As rotas de docente (criacao, edicao e administracao) entrarao sob o
 * prefixo /admin, o que permite aplicar a guarda de autenticacao uma unica
 * vez em vez de repeti-la por pagina.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
