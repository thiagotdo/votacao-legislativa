import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')) } catch { return null }
  })
  const [carregando, setCarregando] = useState(false)

  async function login(email, senha) {
    setCarregando(true)
    try {
      const { data } = await api.post('/auth/login', { email, senha })
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      setUsuario(data.usuario)
      return { ok: true }
    } catch (err) {
      return { ok: false, erro: err.response?.data?.erro || 'Erro ao fazer login' }
    } finally {
      setCarregando(false)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  const isPresidente = ['presidente', 'vice_presidente'].includes(usuario?.perfil)
  const isSecretaria = ['secretario', 'admin'].includes(usuario?.perfil)
  const podeGerir = isPresidente || isSecretaria

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando, isPresidente, isSecretaria, podeGerir }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
