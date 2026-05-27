import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sessao from './pages/Sessao'
import Votacao from './pages/Votacao'
import Presencas from './pages/Presencas'
import Pauta from './pages/Pauta'
import Historico from './pages/Historico'
import Vereadores from './pages/Vereadores'

function ProtectedRoute({ children }) {
  const { usuario } = useAuth()
  return usuario ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="sessao" element={<Sessao />} />
            <Route path="votacao" element={<Votacao />} />
            <Route path="presenca" element={<Presencas />} />
            <Route path="pauta" element={<Pauta />} />
            <Route path="historico" element={<Historico />} />
            <Route path="vereadores" element={<Vereadores />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
