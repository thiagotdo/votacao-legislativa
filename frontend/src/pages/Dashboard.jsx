import { useState, useEffect } from 'react'
import api from '../services/api'
import { Badge, Card, MetricCard, SectionTitle, Alert, Spinner } from '../components/UI'
import styles from './Dashboard.module.css'

function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function BadgeResultado({ resultado }) {
  if (resultado === 'aprovada') return <Badge tipo="green">Aprovada</Badge>
  if (resultado === 'rejeitada') return <Badge tipo="red">Rejeitada</Badge>
  if (resultado === 'empate') return <Badge tipo="yellow">Empate</Badge>
  if (resultado === 'cancelada') return <Badge tipo="gray">Cancelada</Badge>
  return <Badge tipo="blue">Aberta</Badge>
}

function BadgeSessao({ status }) {
  if (status === 'aberta') return <Badge tipo="green">● Aberta</Badge>
  if (status === 'suspensa') return <Badge tipo="yellow">Suspensa</Badge>
  if (status === 'encerrada') return <Badge tipo="gray">Encerrada</Badge>
  return <Badge tipo="blue">Agendada</Badge>
}

export default function Dashboard() {
  const [sessoes, setSessoes] = useState([])
  const [vereadores, setVereadores] = useState([])
  const [votacoes, setVotacoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/sessoes'),
      api.get('/vereadores'),
      api.get('/votacoes/historico'),
    ]).then(([sRes, vRes, vtRes]) => {
      setSessoes(sRes.data)
      setVereadores(vRes.data)
      setVotacoes(vtRes.data.slice(0, 10))
    }).finally(() => setCarregando(false))
  }, [])

  const sessaoAberta = sessoes.find(s => s.status === 'aberta')
  const hoje = new Date().toDateString()
  const votacoesHoje = votacoes.filter(v => new Date(v.iniciada_em).toDateString() === hoje)
  const recenteSessoes = sessoes.slice(0, 5)

  const partidos = vereadores.reduce((acc, v) => {
    const p = v.partido || '?'
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {})
  const partidosArr = Object.entries(partidos).sort((a, b) => b[1] - a[1])

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-muted" style={{ marginTop: '2rem' }}>
        <Spinner /> Carregando...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {sessaoAberta && (
        <Alert tipo="success">
          Sessão {sessaoAberta.numero}ª em andamento — {parseInt(sessaoAberta.total_presentes) || 0} presentes
        </Alert>
      )}

      <div className={styles.metricsGrid}>
        <MetricCard label="Vereadores ativos" value={vereadores.length} color="blue" />
        <MetricCard
          label="Sessão atual"
          value={sessaoAberta ? `${sessaoAberta.numero}ª` : '—'}
          sub={sessaoAberta ? 'aberta' : 'nenhuma aberta'}
          color={sessaoAberta ? 'green' : 'default'}
        />
        <MetricCard
          label="Votações hoje"
          value={votacoesHoje.length}
          color={votacoesHoje.length > 0 ? 'yellow' : 'default'}
        />
        <MetricCard label="Total de sessões" value={sessoes.length} color="default" />
      </div>

      <div className={styles.cols}>
        <Card>
          <SectionTitle>Últimas votações</SectionTitle>
          {votacoes.length === 0
            ? <p className="text-muted text-sm">Nenhuma votação registrada</p>
            : <div className={styles.list}>
                {votacoes.map(v => (
                  <div key={v.id} className={styles.listItem}>
                    <div className={styles.listItemMain}>
                      <div className={styles.listItemTitle}>{v.titulo}</div>
                      <div className="text-muted text-sm">
                        {v.sessao_numero}ª Sessão · {fmtData(v.data_sessao)}
                      </div>
                    </div>
                    <BadgeResultado resultado={v.resultado} />
                  </div>
                ))}
              </div>
          }
        </Card>

        <div>
          <Card>
            <SectionTitle>Sessões recentes</SectionTitle>
            {recenteSessoes.length === 0
              ? <p className="text-muted text-sm">Nenhuma sessão</p>
              : <div className={styles.list}>
                  {recenteSessoes.map(sess => (
                    <div key={sess.id} className={styles.listItem}>
                      <div>
                        <div className="fw-500">{sess.numero}ª Sessão — {sess.tipo}</div>
                        <div className="text-muted text-sm">{fmtData(sess.data_sessao)}</div>
                      </div>
                      <BadgeSessao status={sess.status} />
                    </div>
                  ))}
                </div>
            }
          </Card>

          {partidosArr.length > 0 && (
            <Card style={{ marginTop: '1rem' }}>
              <SectionTitle>Composição ({vereadores.length} vereadores)</SectionTitle>
              <div className={styles.partidosList}>
                {partidosArr.map(([sigla, count]) => (
                  <div key={sigla} className={styles.partidoItem}>
                    <span className={styles.partidoSigla}>{sigla}</span>
                    <div className={styles.partidoBarra}>
                      <div
                        className={styles.partidoBarraFill}
                        style={{ width: `${Math.round(count / vereadores.length * 100)}%` }}
                      />
                    </div>
                    <span className={styles.partidoCount}>{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
