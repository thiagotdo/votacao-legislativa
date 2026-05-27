import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import s from './Layout.module.css'

const navItems = [
  { to: '/', icon: '▦', label: 'Dashboard', end: true },
  { to: '/sessao', icon: '⏱', label: 'Sessão Atual' },
  { to: '/votacao', icon: '✓', label: 'Votação' },
  { to: '/presenca', icon: '👥', label: 'Presenças' },
  { to: '/pauta', icon: '📋', label: 'Pauta' },
  { to: '/historico', icon: '📜', label: 'Histórico / Atas' },
  { to: '/vereadores', icon: '🏛', label: 'Vereadores' },
]

export default function Layout() {
  const { usuario, logout, podeGerir } = useAuth()
  const nav = useNavigate()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('pt-BR')), 1000)
    return () => clearInterval(t)
  }, [])

  function handleLogout() { logout(); nav('/login') }

  return (
    <div className={s.app}>
      <header className={s.header}>
        <span className={s.logo}>🏛️ CÂMARA MUNICIPAL</span>
        <div style={{ flex: 1 }} />
        <span className={s.clock}>{clock}</span>
        <div className={s.userChip}>
          <div className={s.avatar}>{usuario?.nome?.[0]?.toUpperCase()}</div>
          <div>
            <div className={s.userName}>{usuario?.nome}</div>
            <div className={s.userRole}>{usuario?.perfil?.replace('_', ' ')}</div>
          </div>
          <button onClick={handleLogout} className={s.logoutBtn} title="Sair">⏻</button>
        </div>
      </header>

      <nav className={s.nav}>
        <div className={s.navSection}>Principal</div>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `${s.navItem} ${isActive ? s.navActive : ''}`}>
            <span className={s.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  )
}
