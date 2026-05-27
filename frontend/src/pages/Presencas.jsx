import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { Badge, Btn, Card, Alert, SectionTitle } from '../components/UI'
import styles from './Presencas.module.css'

function iniciais(nome) {
  const p = nome.split(' ')
  return (p[0][0] + (p[p.length - 1]?.[0] || '')).toUpperCase()
}

export default function Presencas() {
  const { podeGerir } = useAuth()
  const [sessoes, setSessoes] = useState([])
  const [sessao, setSessao] = useState(null)
  const [presencas, setPresencas] = useState([])
  const [stats, setStats] = useState({ total: 0, presentes: 0 })
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    api.get('/sessoes').then(r => {
      setSessoes(r.data)
      const aberta = r.data.find(s => s.status === 'aberta' || s.status === 'suspensa')
      if (aberta) setSessao(aberta)
    })
  }, [])

  const carregarPresencas = useCallback(() => {
    if (!sessao) return
    api.get(`/presencas/${sessao.id}`).then(r => {
      setPresencas(r.data.presencas)
      setStats({ total: r.data.total, presentes: r.data.presentes })
    })
  }, [sessao?.id])

  useEffect(() => { carregarPresencas() }, [carregarPresencas])

  useSocket(sessao?.id, {
    'presenca:atualizada': () => carregarPresencas(),
    'presenca:lote': () => carregarPresencas(),
  })

  async function togglePresenca(p) {
    if (!podeGerir) return
    try {
      await api.post('/presencas', {
        sessao_id: sessao.id,
        vereador_id: p.vereador_id,
        presente: !p.presente,
      })
      carregarPresencas()
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao registrar presença')
    }
  }

  async function marcarTodos(presente) {
    if (!podeGerir || !sessao || presencas.length === 0) return
    setCarregando(true)
    try {
      await api.post('/presencas/lote', {
        sessao_id: sessao.id,
        vereadores: presencas.map(p => ({ vereador_id: p.vereador_id, presente })),
      })
      carregarPresencas()
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao atualizar presenças')
    } finally {
      setCarregando(false)
    }
  }

  const quorum = sessao?.quorum_minimo || 7
  const quorumOk = stats.presentes >= quorum
  const pct = stats.total > 0 ? Math.round(stats.presentes / stats.total * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Presenças</h1>
          <p className="text-muted text-sm mt-1">Chamada e controle de quórum</p>
        </div>
      </div>

      {/* Seletor de sessão */}
      {!sessao && (
        <Card>
          <SectionTitle>Selecionar sessão</SectionTitle>
          {sessoes.length === 0
            ? <Alert tipo="warn">Nenhuma sessão disponível</Alert>
            : <div>
                {sessoes.map(s => (
                  <div key={s.id} className={styles.sessaoItem} onClick={() => setSessao(s)}>
                    <div>
                      <strong>{s.numero}ª Sessão</strong>
                      <span className="text-muted text-sm" style={{ marginLeft: '.5rem' }}>
                        {s.tipo} · {new Date(s.data_sessao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <Badge tipo={s.status === 'aberta' ? 'green' : 'gray'}>{s.status}</Badge>
                  </div>
                ))}
              </div>
          }
        </Card>
      )}

      {sessao && (
        <>
          {/* Barra de quórum */}
          <div className={styles.quorumCard}>
            <div className={styles.quorumTop}>
              <div>
                <Badge tipo={sessao.status === 'aberta' ? 'green' : 'yellow'}>{sessao.numero}ª Sessão</Badge>
                <span className="text-muted text-sm" style={{ marginLeft: '.75rem' }}>
                  {new Date(sessao.data_sessao).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex gap-2">
                {podeGerir && (
                  <>
                    <Btn size="sm" variant="green" onClick={() => marcarTodos(true)} disabled={carregando}>
                      Todos presentes
                    </Btn>
                    <Btn size="sm" onClick={() => marcarTodos(false)} disabled={carregando}>
                      Limpar chamada
                    </Btn>
                  </>
                )}
                <Btn size="sm" onClick={() => setSessao(null)}>Trocar sessão</Btn>
              </div>
            </div>

            <div className={styles.quorumBar}>
              <div
                className={styles.quorumFill}
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: quorumOk ? 'var(--green-text)' : 'var(--red-text)',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm" style={{ color: quorumOk ? 'var(--green-text)' : 'var(--red-text)' }}>
                {stats.presentes} de {stats.total} presentes
                {' '}· quórum {quorumOk ? 'atingido' : `mínimo: ${quorum}`}
              </span>
              <span className="text-muted text-sm">{pct}%</span>
            </div>
          </div>

          {/* Grid de vereadores */}
          <div className={styles.verGrid}>
            {presencas.map(p => (
              <div
                key={p.vereador_id}
                className={`${styles.verCard} ${p.presente ? styles.presente : styles.ausente} ${podeGerir ? styles.clicavel : ''}`}
                onClick={() => podeGerir && togglePresenca(p)}
              >
                <div className={`${styles.statusDot} ${p.presente ? styles.dotVerde : styles.dotCinza}`} />
                <div className={styles.verAvatar}>{iniciais(p.nome)}</div>
                <div className={styles.verNome}>
                  {p.nome.split(' ')[0]} {p.nome.split(' ').slice(-1)[0]}
                </div>
                <div className={styles.verPartido}>{p.partido || '—'}</div>
                <div className={`${styles.statusLabel} ${p.presente ? styles.labelVerde : styles.labelCinza}`}>
                  {p.presente ? 'Presente' : 'Ausente'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
