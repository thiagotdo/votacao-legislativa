import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Badge, Btn, Card, Alert, SectionTitle, Modal, FormGroup } from '../components/UI'
import styles from './Vereadores.module.css'

function iniciais(nome) {
  const p = nome.split(' ')
  return (p[0][0] + (p[p.length - 1]?.[0] || '')).toUpperCase()
}

const FORM_VAZIO = { nome: '', partido_id: '', cargo: 'Vereador', email: '', telefone: '' }

export default function Vereadores() {
  const { isSecretaria } = useAuth()
  const [vereadores, setVereadores] = useState([])
  const [partidos, setPartidos] = useState([])
  const [modalForm, setModalForm] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    api.get('/vereadores').then(r => setVereadores(r.data))
    api.get('/partidos').then(r => setPartidos(r.data))
  }, [])

  function abrirCriar() {
    setForm({ ...FORM_VAZIO, partido_id: partidos[0]?.id || '' })
    setModalForm('criar')
    setErro('')
  }

  function abrirEditar(v) {
    setForm({
      nome: v.nome,
      partido_id: v.partido_id || '',
      cargo: v.cargo || 'Vereador',
      email: v.email || '',
      telefone: v.telefone || '',
    })
    setModalForm(v)
    setErro('')
  }

  async function salvar() {
    if (!form.nome.trim()) return setErro('Informe o nome completo')
    setCarregando(true)
    setErro('')
    try {
      if (modalForm === 'criar') {
        await api.post('/vereadores', {
          nome: form.nome,
          partido_id: form.partido_id || undefined,
          cargo: form.cargo,
          email: form.email || undefined,
          telefone: form.telefone || undefined,
        })
      } else {
        await api.put(`/vereadores/${modalForm.id}`, {
          nome: form.nome,
          partido_id: form.partido_id || undefined,
          cargo: form.cargo,
          email: form.email || undefined,
          telefone: form.telefone || undefined,
          ativo: true,
        })
      }
      const r = await api.get('/vereadores')
      setVereadores(r.data)
      setModalForm(null)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setCarregando(false)
    }
  }

  const filtrados = vereadores.filter(v =>
    v.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (v.partido || '').toLowerCase().includes(busca.toLowerCase()) ||
    (v.cargo || '').toLowerCase().includes(busca.toLowerCase())
  )

  // Summary by partido
  const porPartido = partidos
    .map(p => ({ ...p, count: vereadores.filter(v => v.partido_id === p.id).length }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Vereadores</h1>
          <p className="text-muted text-sm mt-1">{vereadores.length} vereadores ativos</p>
        </div>
        {isSecretaria && (
          <Btn variant="primary" onClick={abrirCriar}>+ Novo vereador</Btn>
        )}
      </div>

      {/* Composição por partido */}
      {porPartido.length > 0 && (
        <div className={styles.partidosRow}>
          {porPartido.map(p => (
            <div key={p.id} className={styles.partidoChip}>
              <span className={styles.partidoSigla}>{p.sigla}</span>
              <span className={styles.partidoCount}>{p.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Busca */}
      <div className="mb-3">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, partido ou cargo..."
          style={{ maxWidth: 340 }}
        />
      </div>

      <div className={styles.grid}>
        {filtrados.map(v => (
          <div key={v.id} className={styles.card}>
            <div
              className={styles.avatar}
              style={{ background: `#${Math.floor(v.id * 1234567 % 0xFFFFFF).toString(16).padStart(6, '0')}33` }}
            >
              {iniciais(v.nome)}
            </div>
            <div className={styles.info}>
              <div className={styles.nome}>{v.nome}</div>
              <div className={styles.cargo}>{v.cargo || 'Vereador'}</div>
              {v.partido && (
                <div className={styles.badges}>
                  <Badge tipo="blue" size="sm">{v.partido}</Badge>
                </div>
              )}
              {v.email && <div className="text-muted text-sm" style={{ marginTop: 4 }}>{v.email}</div>}
            </div>
            {isSecretaria && (
              <Btn size="sm" onClick={() => abrirEditar(v)}>Editar</Btn>
            )}
          </div>
        ))}
      </div>

      {filtrados.length === 0 && busca && (
        <Card style={{ marginTop: '1rem' }}>
          <p className="text-muted text-sm">Nenhum vereador encontrado para "{busca}"</p>
        </Card>
      )}

      <Modal
        open={!!modalForm}
        onClose={() => setModalForm(null)}
        title={modalForm === 'criar' ? 'Novo vereador' : 'Editar vereador'}
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
        <FormGroup label="Nome completo *">
          <input
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome completo do vereador"
          />
        </FormGroup>
        <div className="flex gap-3">
          <FormGroup label="Partido">
            <select value={form.partido_id} onChange={e => setForm({ ...form, partido_id: e.target.value })}>
              <option value="">— Sem partido —</option>
              {partidos.map(p => (
                <option key={p.id} value={p.id}>{p.sigla} — {p.nome}</option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Cargo">
            <input
              value={form.cargo}
              onChange={e => setForm({ ...form, cargo: e.target.value })}
              placeholder="Vereador"
            />
          </FormGroup>
        </div>
        <FormGroup label="E-mail">
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="email@camara.gov.br"
          />
        </FormGroup>
        <FormGroup label="Telefone">
          <input
            value={form.telefone}
            onChange={e => setForm({ ...form, telefone: e.target.value })}
            placeholder="(00) 9 0000-0000"
          />
        </FormGroup>
      </Modal>
    </div>
  )
}
