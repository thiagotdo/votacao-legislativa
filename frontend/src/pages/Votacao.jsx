import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { Badge, Btn, Card, Alert, SectionTitle, Modal, FormGroup } from '../components/UI'
import s from './Votacao.module.css'

function iniciais(nome) {
  const p = nome.split(' ')
  return (p[0][0] + (p[p.length - 1]?.[0] || '')).toUpperCase()
}

export default function Votacao() {
  const { usuario, podeGerir } = useAuth()
  const [sessao, setSessao] = useState(null)
  const [sessoes, setSessoes] = useState([])
  const [votacaoAtiva, setVotacaoAtiva] = useState(null)
  const [vereadores, setVereadores] = useState([])
  const [presencas, setPresencas] = useState([])
  const [pauta, setPauta] = useState([])
  const [votos, setVotos] = useState({})
  const [modalIniciar, setModalIniciar] = useState(false)
  const [modalVoto, setModalVoto] = useState(null)
  const [form, setForm] = useState({ titulo: '', tipo_votacao: 'nominal', quorum_necessario: 'maioria_simples', materia_id: '' })
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega sessões
  useEffect(() => {
    api.get('/sessoes').then(r => {
      setSessoes(r.data)
      const aberta = r.data.find(s => s.status === 'aberta')
      if (aberta) setSessao(aberta)
    })
  }, [])

  // Carrega dados quando sessão é selecionada
  useEffect(() => {
    if (!sessao) return
    Promise.all([
      api.get('/vereadores'),
      api.get(`/presencas/${sessao.id}`),
      api.get(`/pauta/${sessao.id}`),
      api.get(`/votacoes/ativa/${sessao.id}`),
    ]).then(([vRes, pRes, mRes, vAtiva]) => {
      setVereadores(vRes.data)
      setPresencas(pRes.data.presencas)
      setPauta(mRes.data)
      if (vAtiva.data) {
        setVotacaoAtiva(vAtiva.data)
        const votosMap = {}
        vAtiva.data.votos_registrados?.forEach(v => { votosMap[v.id] = v.voto })
        setVotos(votosMap)
      }
    })
  }, [sessao])

  // Socket.IO handlers
  useSocket(sessao?.id, {
    'votacao:iniciada': (data) => { setVotacaoAtiva(data); setVotos({}); setResultado(null) },
    'votacao:voto': (data) => {
      setVotos(prev => ({ ...prev, [data.vereadorId]: data.voto }))
      setVotacaoAtiva(prev => prev ? { ...prev, votos_sim: data.contagem.sim, votos_nao: data.contagem.nao, votos_abstencao: data.contagem.abstencao } : prev)
    },
    'votacao:encerrada': (data) => {
      setVotacaoAtiva(null)
      setResultado(data)
    },
  })

  const presentes = presencas.filter(p => p.presente)
  const totalPresentes = presentes.length

  async function iniciarVotacao() {
    if (!sessao) return setErro('Selecione uma sessão aberta')
    setCarregando(true)
    try {
      await api.post('/votacoes/iniciar', { sessao_id: sessao.id, ...form, materia_id: form.materia_id || undefined })
      setModalIniciar(false)
      setForm({ titulo: '', tipo_votacao: 'nominal', quorum_necessario: 'maioria_simples', materia_id: '' })
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao iniciar votação')
    } finally {
      setCarregando(false)
    }
  }

  async function registrarVoto(voto) {
    if (!votacaoAtiva || !modalVoto) return
    try {
      await api.post(`/votacoes/${votacaoAtiva.id}/votar`, {
        vereador_id: modalVoto.id,
        voto,
      })
      setModalVoto(null)
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao votar')
    }
  }

  async function encerrarVotacao() {
    if (!votacaoAtiva || !confirm('Encerrar a votação?')) return
    try {
      await api.put(`/votacoes/${votacaoAtiva.id}/encerrar`)
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao encerrar')
    }
  }

  async function cancelarVotacao() {
    if (!votacaoAtiva || !confirm('Cancelar a votação?')) return
    try {
      await api.put(`/votacoes/${votacaoAtiva.id}/cancelar`)
      setVotacaoAtiva(null)
      setVotos({})
    } catch (e) {}
  }

  const votsArr = Object.values(votos)
  const totalVotos = votsArr.length
  const sim = votacaoAtiva?.votos_sim || 0
  const nao = votacaoAtiva?.votos_nao || 0
  const abs = votacaoAtiva?.votos_abstencao || 0
  const maxVotos = Math.max(sim + nao + abs, 1)

  // Vereador logado
  const meuVereador = vereadores.find(v => v.id === usuario?.vereadorId)

  function canVotar(vereadorId) {
    if (!votacaoAtiva) return false
    // Presidente pode votar por qualquer vereador; vereador só pelo próprio
    if (podeGerir) return true
    return vereadorId === usuario?.vereadorId
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Votação</h1>
          <p className="text-muted text-sm mt-1">Painel em tempo real via WebSocket</p>
        </div>
        {podeGerir && !votacaoAtiva && sessao?.status === 'aberta' && (
          <Btn variant="primary" onClick={() => setModalIniciar(true)}>▶ Iniciar Votação</Btn>
        )}
      </div>

      {/* Seleção de sessão */}
      {!sessao && (
        <Card>
          <SectionTitle>Selecionar sessão</SectionTitle>
          {sessoes.filter(s => s.status === 'aberta').length === 0
            ? <Alert tipo="warn">Nenhuma sessão aberta no momento</Alert>
            : sessoes.filter(s => s.status === 'aberta').map(s => (
              <div key={s.id} className={`${s.pauta_item} cursor-pointer`} onClick={() => setSessao(s)}>
                <strong>{s.numero}ª Sessão</strong> · {new Date(s.data_sessao).toLocaleDateString('pt-BR')}
              </div>
            ))
          }
        </Card>
      )}

      {sessao && (
        <div className={s.sessaoInfo}>
          <Badge tipo="green">● Sessão {sessao.numero}ª — {sessao.tipo}</Badge>
          <span className="text-muted text-sm">{totalPresentes} presentes</span>
        </div>
      )}

      {/* Resultado final */}
      {resultado && !votacaoAtiva && (
        <div className={`${s.resultadoBox} ${resultado.resultado === 'aprovada' ? s.aprovado : s.rejeitado}`}>
          <div className={s.resultadoIcon}>{resultado.resultado === 'aprovada' ? '✅' : '❌'}</div>
          <div className={s.resultadoTitle}>{resultado.resultado === 'aprovada' ? 'APROVADO' : 'REJEITADO'}</div>
          <div className="text-muted text-sm mt-2">
            {resultado.votacao?.votos_sim} sim · {resultado.votacao?.votos_nao} não · {resultado.votacao?.votos_abstencao} abstenções
          </div>
          <div className={s.resultadoVotosGrid}>
            {resultado.votos?.map(v => (
              <div key={v.nome} className={`${s.votoChip} ${s['voto_' + v.voto]}`}>
                {iniciais(v.nome)}
                <span>{v.nome.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <Btn variant="primary" onClick={() => setResultado(null)} style={{ marginTop: '1.25rem' }}>Nova Votação</Btn>
        </div>
      )}

      {/* Painel de votação ativa */}
      {votacaoAtiva && (
        <div className={s.painelAtivo}>
          <div className={s.painelHeader}>
            <div>
              <div className="flex gap-2 mb-1">
                <Badge tipo="blue">{votacaoAtiva.tipo_votacao}</Badge>
                <Badge tipo="gray">{votacaoAtiva.quorum_necessario?.replace('_', ' ')}</Badge>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{votacaoAtiva.titulo}</div>
            </div>
            {podeGerir && (
              <div className="flex gap-2">
                <Btn variant="red" size="sm" onClick={encerrarVotacao}>Encerrar</Btn>
                <Btn size="sm" onClick={cancelarVotacao}>Cancelar</Btn>
              </div>
            )}
          </div>

          <div className={s.placar}>
            <div className={`${s.placarItem} ${s.placarSim}`}>
              <div className={s.placarNum}>{sim}</div>
              <div className={s.placarLabel}>SIM</div>
              <div className={s.barraContainer}><div className={s.barraSim} style={{ width: `${Math.round(sim / maxVotos * 100)}%` }} /></div>
            </div>
            <div className={`${s.placarItem} ${s.placarNao}`}>
              <div className={s.placarNum}>{nao}</div>
              <div className={s.placarLabel}>NÃO</div>
              <div className={s.barraContainer}><div className={s.barraNao} style={{ width: `${Math.round(nao / maxVotos * 100)}%` }} /></div>
            </div>
            <div className={`${s.placarItem} ${s.placarAbs}`}>
              <div className={s.placarNum}>{abs}</div>
              <div className={s.placarLabel}>ABS</div>
              <div className={s.barraContainer}><div className={s.barraAbs} style={{ width: `${Math.round(abs / maxVotos * 100)}%` }} /></div>
            </div>
          </div>

          <div className="text-muted text-sm mb-3">
            {totalVotos} / {totalPresentes} votos registrados
          </div>

          <div className={s.verGrid}>
            {presentes.map(p => {
              const ver = vereadores.find(v => v.id === p.vereador_id)
              if (!ver) return null
              const voto = votos[ver.id]
              const pode = canVotar(ver.id)
              return (
                <div key={ver.id}
                  className={`${s.verCard} ${voto ? s['ver_' + voto] : ''} ${pode ? s.verClickable : ''}`}
                  onClick={() => pode && !voto ? setModalVoto(ver) : null}>
                  {voto && <div className={`${s.voteIndicator} ${s['vi_' + voto]}`}>{voto === 'sim' ? 'S' : voto === 'nao' ? 'N' : 'A'}</div>}
                  <div className={s.verAvatar} style={{ background: `#${Math.floor(ver.id * 1234567 % 0xFFFFFF).toString(16).padStart(6, '0')}22` }}>
                    {iniciais(ver.nome)}
                  </div>
                  <div className={s.verNome}>{ver.nome.split(' ')[0]}</div>
                  <div className={s.verPartido}>{ver.partido}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal voto individual */}
      <Modal open={!!modalVoto} onClose={() => setModalVoto(null)} title={`Voto — ${modalVoto?.nome}`}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem' }}>{modalVoto?.partido} · {modalVoto?.cargo}</div>
          <div className="flex gap-3 justify-between">
            <Btn variant="green" size="lg" onClick={() => registrarVoto('sim')} fullWidth>✓ SIM</Btn>
            <Btn variant="red" size="lg" onClick={() => registrarVoto('nao')} fullWidth>✗ NÃO</Btn>
            <Btn variant="yellow" size="lg" onClick={() => registrarVoto('abstencao')} fullWidth>— ABS</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal iniciar votação */}
      <Modal open={modalIniciar} onClose={() => setModalIniciar(false)} title="Iniciar Votação"
        footer={<><Btn onClick={() => setModalIniciar(false)}>Cancelar</Btn><Btn variant="primary" onClick={iniciarVotacao} disabled={carregando}>{carregando ? 'Iniciando...' : '▶ Iniciar'}</Btn></>}>
        {erro && <Alert tipo="danger">{erro}</Alert>}
        <FormGroup label="Título / Identificação">
          <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: PL 010/2025 — Fundo de Habitação" />
        </FormGroup>
        <FormGroup label="Item da pauta (opcional)">
          <select value={form.materia_id} onChange={e => {
            const m = pauta.find(p => p.id == e.target.value)
            setForm({ ...form, materia_id: e.target.value, titulo: m ? `${m.numero} — ${m.ementa}` : form.titulo })
          }}>
            <option value="">— Votação avulsa —</option>
            {pauta.filter(p => p.status === 'pendente').map(p => (
              <option key={p.id} value={p.id}>{p.numero} — {p.ementa.substring(0, 60)}</option>
            ))}
          </select>
        </FormGroup>
        <div className="flex gap-3">
          <FormGroup label="Modalidade">
            <select value={form.tipo_votacao} onChange={e => setForm({ ...form, tipo_votacao: e.target.value })}>
              <option value="nominal">Nominal</option>
              <option value="simbolica">Simbólica</option>
              <option value="secreta">Secreta</option>
            </select>
          </FormGroup>
          <FormGroup label="Quórum necessário">
            <select value={form.quorum_necessario} onChange={e => setForm({ ...form, quorum_necessario: e.target.value })}>
              <option value="maioria_simples">Maioria Simples</option>
              <option value="maioria_absoluta">Maioria Absoluta</option>
              <option value="2/3">2/3</option>
            </select>
          </FormGroup>
        </div>
      </Modal>
    </div>
  )
}
