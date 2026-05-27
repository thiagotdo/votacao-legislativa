import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Badge, Btn, Card, Alert, SectionTitle, Modal, FormGroup } from '../components/UI'
import styles from './Pauta.module.css'

function BadgeStatus({ status }) {
  if (status === 'aprovada') return <Badge tipo="green">Aprovada</Badge>
  if (status === 'rejeitada') return <Badge tipo="red">Rejeitada</Badge>
  if (status === 'em_votacao') return <Badge tipo="blue">Em votação</Badge>
  if (status === 'retirada') return <Badge tipo="gray">Retirada</Badge>
  return <Badge tipo="yellow">Pendente</Badge>
}

const FORM_VAZIO = { tipo_id: '', numero: '', ementa: '', autor: '', ordem: '' }

export default function Pauta() {
  const { podeGerir } = useAuth()
  const [sessoes, setSessoes] = useState([])
  const [sessao, setSessao] = useState(null)
  const [pauta, setPauta] = useState([])
  const [tipos, setTipos] = useState([])
  const [modalForm, setModalForm] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get('/sessoes').then(r => {
      setSessoes(r.data)
      const aberta = r.data.find(s => s.status === 'aberta' || s.status === 'suspensa')
      if (aberta) setSessao(aberta)
    })
    api.get('/tipos-materia').then(r => setTipos(r.data))
  }, [])

  useEffect(() => {
    if (!sessao) return
    api.get(`/pauta/${sessao.id}`).then(r => setPauta(r.data))
  }, [sessao?.id])

  function abrirCriar() {
    setForm({ ...FORM_VAZIO, tipo_id: tipos[0]?.id || '' })
    setModalForm('criar')
    setErro('')
  }

  function abrirEditar(item) {
    setForm({
      tipo_id: item.tipo_id || '',
      numero: item.numero || '',
      ementa: item.ementa || '',
      autor: item.autor || '',
      ordem: item.ordem || '',
    })
    setModalForm(item)
    setErro('')
  }

  async function salvar() {
    if (!form.ementa.trim()) return setErro('Informe a ementa da matéria')
    setCarregando(true)
    setErro('')
    try {
      if (modalForm === 'criar') {
        await api.post('/pauta', {
          sessao_id: sessao.id,
          tipo_id: form.tipo_id || undefined,
          numero: form.numero || undefined,
          ementa: form.ementa,
          autor: form.autor || undefined,
          ordem: form.ordem ? parseInt(form.ordem) : undefined,
        })
      } else {
        await api.put(`/pauta/${modalForm.id}`, {
          numero: form.numero,
          ementa: form.ementa,
          autor: form.autor,
          status: modalForm.status,
          ordem: form.ordem ? parseInt(form.ordem) : modalForm.ordem,
        })
      }
      api.get(`/pauta/${sessao.id}`).then(r => setPauta(r.data))
      setModalForm(null)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setCarregando(false)
    }
  }

  async function remover(id) {
    if (!confirm('Remover este item da pauta?')) return
    try {
      await api.delete(`/pauta/${id}`)
      setPauta(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao remover')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Pauta</h1>
          <p className="text-muted text-sm mt-1">Ordem do dia e matérias em discussão</p>
        </div>
      </div>

      {/* Seletor de sessão */}
      {!sessao && (
        <Card>
          <SectionTitle>Selecionar sessão</SectionTitle>
          {sessoes.length === 0
            ? <Alert tipo="warn">Nenhuma sessão disponível</Alert>
            : sessoes.map(s => (
                <div key={s.id} className={styles.sessaoItem} onClick={() => setSessao(s)}>
                  <strong>{s.numero}ª Sessão</strong>
                  <span className="text-muted text-sm" style={{ marginLeft: '.5rem' }}>
                    {s.tipo} · {new Date(s.data_sessao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))
          }
        </Card>
      )}

      {sessao && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2 items-center">
              <Badge tipo={sessao.status === 'aberta' ? 'green' : 'gray'}>
                {sessao.numero}ª Sessão
              </Badge>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 12 }}
                onClick={() => setSessao(null)}
              >
                Trocar sessão ↩
              </button>
            </div>
            {podeGerir && (
              <Btn variant="primary" onClick={abrirCriar}>+ Adicionar item</Btn>
            )}
          </div>

          <Card>
            {pauta.length === 0
              ? <Alert tipo="info">Nenhum item na pauta desta sessão</Alert>
              : <div className={styles.pautaList}>
                  {pauta.map((item, i) => (
                    <div key={item.id} className={styles.pautaItem}>
                      <div className={styles.pautaOrdem}>{item.ordem || i + 1}</div>
                      <div className={styles.pautaContent}>
                        <div className="flex gap-2 items-center mb-1" style={{ flexWrap: 'wrap' }}>
                          {item.tipo_sigla && <Badge tipo="blue" size="sm">{item.tipo_sigla}</Badge>}
                          {item.numero && <span className="text-sm fw-500">{item.numero}</span>}
                          <BadgeStatus status={item.status} />
                        </div>
                        <div className={styles.pautaEmenta}>{item.ementa}</div>
                        {item.autor && (
                          <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                            Autor: {item.autor}
                          </div>
                        )}
                      </div>
                      {podeGerir && item.status === 'pendente' && (
                        <div className="flex gap-2">
                          <Btn size="sm" onClick={() => abrirEditar(item)}>Editar</Btn>
                          <Btn size="sm" variant="red" onClick={() => remover(item.id)}>Remover</Btn>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            }
          </Card>
        </>
      )}

      <Modal
        open={!!modalForm}
        onClose={() => setModalForm(null)}
        title={modalForm === 'criar' ? 'Adicionar à pauta' : 'Editar item da pauta'}
        footer={
          <>
            <Btn onClick={() => setModalForm(null)}>Cancelar</Btn>
            <Btn variant="primary" onClick={salvar} disabled={carregando}>
              {carregando ? 'Salvando...' : 'Salvar'}
            </Btn>
          </>
        }
      >
        {erro && <Alert tipo="danger">{erro}</Alert>}
        <div className="flex gap-3">
          <FormGroup label="Tipo de matéria">
            <select value={form.tipo_id} onChange={e => setForm({ ...form, tipo_id: e.target.value })}>
              <option value="">— Sem tipo —</option>
              {tipos.map(t => (
                <option key={t.id} value={t.id}>{t.sigla} — {t.nome}</option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Número / Código">
            <input
              value={form.numero}
              onChange={e => setForm({ ...form, numero: e.target.value })}
              placeholder="Ex: PL 010/2025"
            />
          </FormGroup>
        </div>
        <FormGroup label="Ementa *">
          <textarea
            value={form.ementa}
            onChange={e => setForm({ ...form, ementa: e.target.value })}
            rows={3}
            placeholder="Descrição completa da matéria..."
          />
        </FormGroup>
        <div className="flex gap-3">
          <FormGroup label="Autor">
            <input
              value={form.autor}
              onChange={e => setForm({ ...form, autor: e.target.value })}
              placeholder="Nome do autor ou proponente"
            />
          </FormGroup>
          <FormGroup label="Ordem na pauta">
            <input
              type="number"
              value={form.ordem}
              onChange={e => setForm({ ...form, ordem: e.target.value })}
              placeholder="Automático"
            />
          </FormGroup>
        </div>
      </Modal>
    </div>
  )
}
