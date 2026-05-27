import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { Badge, Btn, Card, Alert, SectionTitle, MetricCard, Modal, FormGroup, Spinner } from '../components/UI'
import styles from './Sessao.module.css'

function BadgeStatus({ status }) {
  if (status === 'aberta') return <Badge tipo="green">● Aberta</Badge>
  if (status === 'suspensa') return <Badge tipo="yellow">Suspensa</Badge>
  if (status === 'encerrada') return <Badge tipo="gray">Encerrada</Badge>
  return <Badge tipo="blue">Agendada</Badge>
}

function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Sessao() {
  const { podeGerir } = useAuth()
  const [sessoes, setSessoes] = useState([])
  const [sessao, setSessao] = useState(null)
  const [presencas, setPresencas] = useState({ presentes: 0, total: 0 })
  const [log, setLog] = useState([])
  const [modalCriar, setModalCriar] = useState(false)
  const [form, setForm] = useState({
    numero: '',
    tipo: 'ordinaria',
    data_sessao: new Date().toISOString().slice(0, 10),
    hora_inicio: '09:00',
    quorum_minimo: 7,
    observacoes: '',
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  function carregarSessoes() {
    api.get('/sessoes').then(r => {
      setSessoes(r.data)
      setSessao(prev => {
        if (prev) return r.data.find(s => s.id === prev.id) || prev
        return r.data.find(s => s.status === 'aberta' || s.status === 'suspensa') || null
      })
    })
  }

  useEffect(() => { carregarSessoes() }, [])

  useEffect(() => {
    if (!sessao) return
    api.get(`/presencas/${sessao.id}`).then(r =>
      setPresencas({ presentes: r.data.presentes, total: r.data.total })
    )
    api.get(`/sessoes/${sessao.id}/log`).then(r => setLog(r.data))
  }, [sessao?.id])

  useSocket(sessao?.id, {
    'sessao:status': (data) => {
      setSessao(prev => prev ? { ...prev, status: data.status } : prev)
      if (sessao) api.get(`/sessoes/${sessao.id}/log`).then(r => setLog(r.data))
    },
    'presenca:atualizada': () => {
      if (sessao) api.get(`/presencas/${sessao.id}`).then(r =>
        setPresencas({ presentes: r.data.presentes, total: r.data.total })
      )
    },
    'presenca:lote': () => {
      if (sessao) api.get(`/presencas/${sessao.id}`).then(r =>
        setPresencas({ presentes: r.data.presentes, total: r.data.total })
      )
    },
  })

  async function acaoSessao(acao) {
    if (!sessao) return
    const msgs = { abrir: 'Abrir sessão?', suspender: 'Suspender sessão?', encerrar: 'Encerrar a sessão definitivamente?' }
    if (!confirm(msgs[acao])) return
    try {
      await api.put(`/sessoes/${sessao.id}/${acao}`)
      carregarSessoes()
    } catch (e) {
      alert(e.response?.data?.erro || `Erro ao ${acao} sessão`)
    }
  }

  async function criarSessao() {
    if (!form.numero || !form.data_sessao) return setErro('Preencha número e data')
    setCarregando(true)
    setErro('')
    try {
      const { data } = await api.post('/sessoes', {
        numero: parseInt(form.numero),
        tipo: form.tipo,
        data_sessao: form.data_sessao,
        hora_inicio: form.hora_inicio,
        legislatura_id: 1,
        quorum_minimo: parseInt(form.quorum_minimo) || 7,
        observacoes: form.observacoes || null,
      })
      setModalCriar(false)
      setSessao(data)
      carregarSessoes()
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao criar sessão')
    } finally {
      setCarregando(false)
    }
  }

  const quorum = sessao?.quorum_minimo || 7
  const presentes = presencas.presentes || 0
  const quorumOk = presentes >= quorum

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Sessão Atual</h1>
          <p className="text-muted text-sm mt-1">Controle e acompanhamento da sessão plenária</p>
        </div>
        {podeGerir && (
          <Btn variant="primary" onClick={() => { setErro(''); setModalCriar(true) }}>+ Nova Sessão</Btn>
        )}
      </div>

      {/* Seletor de sessão */}
      {!sessao && (
        <Card>
          <SectionTitle>Selecionar sessão</SectionTitle>
          {sessoes.length === 0
            ? <Alert tipo="warn">Nenhuma sessão cadastrada. Crie a primeira sessão.</Alert>
            : <div className={styles.sessaoList}>
                {sessoes.map(s => (
                  <div key={s.id} className={styles.sessaoItem} onClick={() => setSessao(s)}>
                    <div>
                      <strong>{s.numero}ª Sessão</strong>
                      <span className="text-muted text-sm" style={{ marginLeft: '.5rem' }}>
                        {s.tipo} · {new Date(s.data_sessao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <BadgeStatus status={s.status} />
                  </div>
                ))}
              </div>
          }
        </Card>
      )}

      {sessao && (
        <>
          {/* Header */}
          <div className={styles.sessaoHeader}>
            <div>
              <div className="flex gap-2 items-center mb-1">
                <BadgeStatus status={sessao.status} />
                <span className="text-muted text-sm">{sessao.tipo}</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{sessao.numero}ª Sessão</h2>
              <p className="text-muted text-sm mt-1">{fmtData(sessao.data_sessao)}</p>
            </div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {podeGerir && sessao.status === 'agendada' && (
                <Btn variant="green" onClick={() => acaoSessao('abrir')}>Abrir Sessão</Btn>
              )}
              {podeGerir && sessao.status === 'suspensa' && (
                <Btn variant="green" onClick={() => acaoSessao('abrir')}>Retomar</Btn>
              )}
              {podeGerir && sessao.status === 'aberta' && (
                <>
                  <Btn onClick={() => acaoSessao('suspender')}>Suspender</Btn>
                  <Btn variant="red" onClick={() => acaoSessao('encerrar')}>Encerrar</Btn>
                </>
              )}
              <Btn size="sm" onClick={() => setSessao(null)}>Trocar sessão</Btn>
            </div>
          </div>

          {/* Métricas */}
          <div className={styles.metricsRow}>
            <MetricCard
              label="Presentes"
              value={presentes}
              sub={`quórum mínimo: ${quorum}`}
              color={quorumOk ? 'green' : 'red'}
            />
            <MetricCard
              label="Ausentes"
              value={(presencas.total || 0) - presentes}
              color="default"
            />
            <MetricCard label="Itens na pauta" value={parseInt(sessao.total_pauta) || 0} color="blue" />
            <MetricCard label="Votações" value={parseInt(sessao.total_votacoes) || 0} color="default" />
          </div>

          {!quorumOk && sessao.status !== 'encerrada' && sessao.status !== 'agendada' && (
            <Alert tipo="warn">Quórum insuficiente — {presentes} de {quorum} necessários</Alert>
          )}

          {/* Log de eventos */}
          <Card>
            <SectionTitle>Log da sessão</SectionTitle>
            {log.length === 0
              ? <p className="text-muted text-sm">Nenhum evento registrado ainda</p>
              : <div className={styles.logList}>
                  {log.map(item => (
                    <div key={item.id} className={styles.logItem}>
                      <div className={styles.logDot} />
                      <div className={styles.logContent}>
                        <div>
                          <span className={styles.logDesc}>{item.descricao}</span>
                          {item.usuario_nome && (
                            <span className="text-muted text-sm" style={{ marginLeft: '.5rem' }}>
                              · {item.usuario_nome}
                            </span>
                          )}
                        </div>
                        <div className="text-muted text-sm">
                          {new Date(item.criado_em).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </Card>
        </>
      )}

      {/* Modal criar sessão */}
      <Modal
        open={modalCriar}
        onClose={() => setModalCriar(false)}
        title="Nova Sessão"
        footer={
          <>
            <Btn onClick={() => setModalCriar(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={criarSessao} disabled={carregando}>
              {carregando ? 'Criando...' : 'Criar Sessão'}
            </Btn>
          </>
        }
      >
        {erro && <Alert tipo="danger">{erro}</Alert>}
        <div className="flex gap-3">
          <FormGroup label="Número *">
            <input
              type="number"
              value={form.numero}
              onChange={e => setForm({ ...form, numero: e.target.value })}
              placeholder="Ex: 15"
            />
          </FormGroup>
          <FormGroup label="Tipo">
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="ordinaria">Ordinária</option>
              <option value="extraordinaria">Extraordinária</option>
              <option value="especial">Especial</option>
            </select>
          </FormGroup>
        </div>
        <div className="flex gap-3">
          <FormGroup label="Data *">
            <input
              type="date"
              value={form.data_sessao}
              onChange={e => setForm({ ...form, data_sessao: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Hora início">
            <input
              type="time"
              value={form.hora_inicio}
              onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
            />
          </FormGroup>
        </div>
        <FormGroup label="Quórum mínimo">
          <input
            type="number"
            value={form.quorum_minimo}
            onChange={e => setForm({ ...form, quorum_minimo: e.target.value })}
            placeholder="7"
          />
        </FormGroup>
        <FormGroup label="Observações">
          <textarea
            value={form.observacoes}
            onChange={e => setForm({ ...form, observacoes: e.target.value })}
            rows={2}
            placeholder="Observações opcionais..."
          />
        </FormGroup>
      </Modal>
    </div>
  )
}
