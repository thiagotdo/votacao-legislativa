import { useState, useEffect } from 'react'
import api from '../services/api'
import { Badge, Btn, Card, Alert, SectionTitle, Modal, Spinner } from '../components/UI'
import styles from './Historico.module.css'

function BadgeResultado({ resultado }) {
  if (resultado === 'aprovada') return <Badge tipo="green">Aprovada</Badge>
  if (resultado === 'rejeitada') return <Badge tipo="red">Rejeitada</Badge>
  if (resultado === 'empate') return <Badge tipo="yellow">Empate</Badge>
  if (resultado === 'cancelada') return <Badge tipo="gray">Cancelada</Badge>
  return <Badge tipo="blue">Aberta</Badge>
}

function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function fmtHora(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function Historico() {
  const [sessoes, setSessoes] = useState([])
  const [filtroSessao, setFiltroSessao] = useState('')
  const [votacoes, setVotacoes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [detalhe, setDetalhe] = useState(null)
  const [ata, setAta] = useState('')

  useEffect(() => {
    api.get('/sessoes').then(r => setSessoes(r.data))
    carregarHistorico('')
  }, [])

  async function carregarHistorico(sessaoId) {
    setCarregando(true)
    try {
      const url = sessaoId ? `/votacoes/historico?sessao_id=${sessaoId}` : '/votacoes/historico'
      const r = await api.get(url)
      setVotacoes(r.data)
    } finally {
      setCarregando(false)
    }
  }

  function filtrar(sessaoId) {
    setFiltroSessao(sessaoId)
    carregarHistorico(sessaoId)
  }

  async function verDetalhe(v) {
    const r = await api.get(`/votacoes/${v.id}`)
    setDetalhe(r.data)
    setAta('')
  }

  function gerarAta() {
    if (!detalhe) return
    const { votacao: v, votos } = detalhe
    const sim = votos.filter(x => x.voto === 'sim').map(x => x.nome)
    const nao = votos.filter(x => x.voto === 'nao').map(x => x.nome)
    const abs = votos.filter(x => x.voto === 'abstencao').map(x => x.nome)
    const texto = [
      'EXTRATO DE VOTAÇÃO',
      `Sessão Nº ${v.sessao_numero || '—'} — ${fmtData(v.data_sessao)}`,
      `Matéria: ${v.titulo}`,
      `Modalidade: ${v.tipo_votacao}  |  Quórum: ${(v.quorum_necessario || '').replace('_', ' ')}`,
      '',
      `RESULTADO: ${(v.resultado || '').toUpperCase()}`,
      `SIM: ${v.votos_sim}  |  NÃO: ${v.votos_nao}  |  ABSTENÇÕES: ${v.votos_abstencao}`,
      '',
      `VOTOS SIM (${sim.length}):`,
      sim.join(', ') || '—',
      '',
      `VOTOS NÃO (${nao.length}):`,
      nao.join(', ') || '—',
      '',
      `ABSTENÇÕES (${abs.length}):`,
      abs.join(', ') || '—',
      '',
      `Registrado em: ${fmtData(v.iniciada_em)} às ${fmtHora(v.iniciada_em)}`,
    ].join('\n')
    setAta(texto)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Histórico / Atas</h1>
          <p className="text-muted text-sm mt-1">Registro completo de votações e resultados</p>
        </div>
      </div>

      {/* Filtro por sessão */}
      <div className="mb-4">
        <select
          style={{ maxWidth: 360 }}
          value={filtroSessao}
          onChange={e => filtrar(e.target.value)}
        >
          <option value="">Todas as sessões</option>
          {sessoes.map(s => (
            <option key={s.id} value={s.id}>
              {s.numero}ª Sessão — {fmtData(s.data_sessao)}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {carregando
          ? <div className="flex items-center gap-2 text-muted"><Spinner /> Carregando...</div>
          : votacoes.length === 0
            ? <Alert tipo="info">Nenhuma votação encontrada</Alert>
            : <div className={styles.lista}>
                {votacoes.map(v => (
                  <div key={v.id} className={styles.item} onClick={() => verDetalhe(v)}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemTitulo}>{v.titulo}</div>
                      <div className="text-muted text-sm" style={{ marginTop: 3 }}>
                        {v.sessao_numero}ª Sessão · {fmtData(v.data_sessao)} · {v.tipo_votacao}
                        {' · '}
                        <span className="text-green">{v.votos_sim} sim</span>
                        {' · '}
                        <span className="text-red">{v.votos_nao} não</span>
                        {' · '}
                        <span className="text-yellow">{v.votos_abstencao} abs</span>
                      </div>
                    </div>
                    <BadgeResultado resultado={v.resultado} />
                  </div>
                ))}
              </div>
        }
      </Card>

      {/* Modal detalhe */}
      <Modal
        open={!!detalhe}
        onClose={() => { setDetalhe(null); setAta('') }}
        title={detalhe?.votacao?.titulo || 'Detalhe da votação'}
        footer={
          <div className="flex gap-2">
            <Btn onClick={gerarAta}>Gerar extrato</Btn>
            <Btn onClick={() => { setDetalhe(null); setAta('') }}>Fechar</Btn>
          </div>
        }
      >
        {detalhe && (
          <>
            <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
              <BadgeResultado resultado={detalhe.votacao?.resultado} />
              <Badge tipo="gray">{detalhe.votacao?.tipo_votacao}</Badge>
              <Badge tipo="gray">{(detalhe.votacao?.quorum_necessario || '').replace('_', ' ')}</Badge>
              <span className="text-muted text-sm">
                {fmtData(detalhe.votacao?.data_sessao)}
              </span>
            </div>

            <div className={styles.placarModal}>
              <div className={`${styles.placarItem} ${styles.placarSim}`}>
                <div className={styles.placarNum}>{detalhe.votacao?.votos_sim}</div>
                <div className={styles.placarLabel}>SIM</div>
              </div>
              <div className={`${styles.placarItem} ${styles.placarNao}`}>
                <div className={styles.placarNum}>{detalhe.votacao?.votos_nao}</div>
                <div className={styles.placarLabel}>NÃO</div>
              </div>
              <div className={`${styles.placarItem} ${styles.placarAbs}`}>
                <div className={styles.placarNum}>{detalhe.votacao?.votos_abstencao}</div>
                <div className={styles.placarLabel}>ABS</div>
              </div>
            </div>

            {detalhe.votos?.length > 0 && (
              <>
                <SectionTitle>Votos individuais ({detalhe.votos.length})</SectionTitle>
                <div className={styles.votosGrid}>
                  {detalhe.votos.map(v => (
                    <div key={v.nome} className={`${styles.votoChip} ${styles['voto_' + v.voto]}`}>
                      <span>{v.nome.split(' ')[0]}</span>
                      <span className={styles.votoIcon}>
                        {v.voto === 'sim' ? 'S' : v.voto === 'nao' ? 'N' : 'A'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {ata && (
              <div className={styles.ataBox}>
                <div className={styles.ataHeader}>
                  <span className="text-muted text-sm fw-500">Extrato gerado</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(ata)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12 }}
                  >
                    Copiar
                  </button>
                </div>
                <pre className={styles.ataPre}>{ata}</pre>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
