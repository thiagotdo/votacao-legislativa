import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { login, carregando } = useAuth()
  const nav = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const res = await login(email, senha)
    if (res.ok) nav('/')
    else setErro(res.erro)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 32, marginBottom: '.5rem' }}>🏛️</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: '.25rem' }}>Sistema de Votação</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{import.meta.env.VITE_CAMARA_NOME || 'Câmara Municipal'}</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required />
            </div>
            {erro && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,81,73,.2)', color: 'var(--red-text)', borderRadius: 'var(--radius)', padding: '.6rem .75rem', fontSize: 13, marginBottom: '1rem' }}>
                {erro}
              </div>
            )}
            <button type="submit" disabled={carregando}
              style={{ width: '100%', padding: '.65rem', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: carregando ? 'not-allowed' : 'pointer', opacity: carregando ? .7 : 1 }}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: '1.5rem' }}>
          Sistema de Votação Legislativa · v1.0
        </p>
      </div>
    </div>
  )
}
