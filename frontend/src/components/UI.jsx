import { useState } from 'react'
import styles from './UI.module.css'

export function Badge({ tipo = 'gray', children, size = 'md' }) {
  const classes = { green: styles.badgeGreen, red: styles.badgeRed, yellow: styles.badgeYellow, blue: styles.badgeBlue, purple: styles.badgePurple, gray: styles.badgeGray }
  return <span className={`${styles.badge} ${classes[tipo] || styles.badgeGray} ${size === 'sm' ? styles.badgeSm : ''}`}>{children}</span>
}

export function Btn({ variant = 'default', size = 'md', onClick, disabled, children, type = 'button', fullWidth }) {
  const base = styles.btn
  const vars = { default: styles.btnDefault, primary: styles.btnPrimary, green: styles.btnGreen, red: styles.btnRed, yellow: styles.btnYellow }
  const sizes = { sm: styles.btnSm, md: '', lg: styles.btnLg }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${vars[variant] || vars.default} ${sizes[size]} ${fullWidth ? styles.btnFull : ''}`}>
      {children}
    </button>
  )
}

export function Card({ children, style }) {
  return <div className={styles.card} style={style}>{children}</div>
}

export function MetricCard({ label, value, sub, color }) {
  const colors = { green: 'var(--green-text)', red: 'var(--red-text)', yellow: 'var(--yellow-text)', blue: 'var(--blue-text)', default: 'var(--text)' }
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricValue} style={{ color: colors[color] || colors.default }}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
      {sub && <div className={styles.metricSub}>{sub}</div>}
    </div>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className={styles.sectionTitle}>
      <span>{children}</span>
      {action && <div>{action}</div>}
    </div>
  )
}

export function Alert({ tipo = 'info', children }) {
  const types = { info: styles.alertInfo, warn: styles.alertWarn, success: styles.alertSuccess, danger: styles.alertDanger }
  return <div className={`${styles.alert} ${types[tipo] || styles.alertInfo}`}>{children}</div>
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.modalClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  )
}

export function FormGroup({ label, children }) {
  return <div className={styles.formGroup}><label className={styles.label}>{label}</label>{children}</div>
}

export function Spinner() {
  return <div className={styles.spinner} />
}
