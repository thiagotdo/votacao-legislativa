// === Dados padrão + hook de estado global (sessão + configuração) ===

const VEREADORES_DEFAULT = [
  { id: "v01", nome: "Aline Souza",     partido: "PT",          usuario: "aline.souza",      senha: "1234" },
  { id: "v02", nome: "Carlos Mota",     partido: "MDB",         usuario: "carlos.mota",      senha: "1234" },
  { id: "v03", nome: "Deise Lima",      partido: "PSD",         usuario: "deise.lima",       senha: "1234" },
  { id: "v04", nome: "Eduardo Neves",   partido: "PP",          usuario: "eduardo.neves",    senha: "1234" },
  { id: "v05", nome: "Fábio Reis",      partido: "Republicanos",usuario: "fabio.reis",       senha: "1234" },
  { id: "v06", nome: "Graça Torres",    partido: "PDT",         usuario: "graca.torres",     senha: "1234" },
  { id: "v07", nome: "Hugo Castro",     partido: "PSB",         usuario: "hugo.castro",      senha: "1234" },
  { id: "v08", nome: "Isa Correia",     partido: "PSDB",        usuario: "isa.correia",      senha: "1234" },
  { id: "v09", nome: "Júlio Moraes",    partido: "UNIÃO",       usuario: "julio.moraes",     senha: "1234" },
  { id: "v10", nome: "Kátia Pinto",     partido: "PT",          usuario: "katia.pinto",      senha: "1234" },
  { id: "v11", nome: "Lúcio Braga",     partido: "MDB",         usuario: "lucio.braga",      senha: "1234" },
  { id: "v12", nome: "Marina Luz",      partido: "PSD",         usuario: "marina.luz",       senha: "1234" },
  { id: "v13", nome: "Nilton Paz",      partido: "PL",          usuario: "nilton.paz",       senha: "1234" },
];

const TIPOS_DEFAULT = {
  PL:   { sigla: "PL",   nome: "Projeto de Lei",              quorumMin: 7, maioria: "simples"   },
  PLC:  { sigla: "PLC",  nome: "Projeto de Lei Complementar", quorumMin: 9, maioria: "absoluta"  },
  PEC:  { sigla: "PEC",  nome: "Proposta de Emenda à LOM",    quorumMin: 9, maioria: "qualificada" },
  REQ:  { sigla: "REQ",  nome: "Requerimento",                quorumMin: 7, maioria: "simples"   },
  IND:  { sigla: "IND",  nome: "Indicação",                   quorumMin: 7, maioria: "simples"   },
  MOC:  { sigla: "MOÇÃO", nome: "Moção",                       quorumMin: 7, maioria: "simples"   },
  VETO: { sigla: "VETO", nome: "Análise de Veto",             quorumMin: 9, maioria: "absoluta"  },
};

const CONFIG_DEFAULT = {
  camara: {
    municipio:        "Município de Serrinha",
    estado:           "BA",
    nomeFormal:       "Câmara Municipal de Serrinha",
    legislatura:      "19ª Legislatura",
    sessaoLeg:        "2ª Sessão Legislativa",
    biennio:          "2025—2028",
    enderecoLinha1:   "Praça Cel. João Neves, s/nº — Centro",
    enderecoLinha2:   "CEP 48700-000 · Serrinha / BA",
    cnpj:             "13.826.480/0001-30",
    siteOficial:      "www.camaraserrinha.ba.gov.br",
    plenarioNome:     "Plenário da Câmara Municipal de Serrinha",
    horarioPadrao:    "14:00",
    diaSemana:        "Terça-feira",
    corInstitucional: "#2f6bd1",
    brasao:           null,      // data URL ou URL do brasão; null = brasão geométrico padrão
    tamanhoFonte:     "padrao",  // compacta | padrao | ampla | extra
    fonteSistema:     "moderna", // moderna | institucional | classica | editorial
  },
  sessoesAgendadas: [
    {
      id: "S-2026-010", numero: 10, tipo: "Ordinária",
      dataIso: "2026-06-03", hora: "14:00",
      local: "Plenário da Câmara Municipal de Serrinha",
      pauta: "PL 012/2025 — Cria o Programa Municipal de Incentivo ao Esporte. Requerimentos de informação da Secretaria de Obras.",
      observacoes: "",
    },
    {
      id: "S-2026-011", numero: 11, tipo: "Ordinária",
      dataIso: "2026-06-10", hora: "14:00",
      local: "Plenário da Câmara Municipal de Serrinha",
      pauta: "Primeiro turno da LOA 2027. Audiência pública precedente das 13h às 13h45.",
      observacoes: "Sessão precedida de audiência pública.",
    },
    {
      id: "S-2026-EXT-001", numero: 12, tipo: "Extraordinária",
      dataIso: "2026-06-17", hora: "10:00",
      local: "Plenário da Câmara Municipal de Serrinha",
      pauta: "Apreciação em caráter de urgência do VETO 002/2026 ao PL nº 007/2026.",
      observacoes: "Convocação extraordinária pelo Executivo Municipal.",
    },
  ],
  mesa: [
    { id: "presidente", label: "Presidente",      abrev: "PRES",   desc: "Conduz a sessão, dirige debates e profere voto de minerva quando previsto.", vereadorId: "v02" },
    { id: "vice",       label: "1ª Vice-Presidente", abrev: "VICE",desc: "Substitui o presidente em seus impedimentos.",                                  vereadorId: "v03" },
    { id: "primSec",    label: "1º Secretário",   abrev: "1º SEC", desc: "Lê a ata, conta votos e mantém o expediente.",                                 vereadorId: "v01" },
    { id: "segSec",     label: "2º Secretário",   abrev: "2º SEC", desc: "Auxilia o 1º Secretário e o substitui.",                                      vereadorId: "v04" },
  ],
  vereadores: VEREADORES_DEFAULT,
  tipos: TIPOS_DEFAULT,
  regimento: {
    quorumAbertura:     7,            // mínimo para abrir sessão
    quorumDeliberacao:  7,            // mínimo para deliberar
    permitirAbstencao:  true,
    permitirAlterarVoto: true,
    votacaoPadrao:      "nominal",    // nominal | simbolica | secreta
    tempoLimite:        90,           // segundos por votação (0 = sem limite)
    presidenteDesempata: true,
    presidenteVotaSempre: false,
    contagemMaioria:    "presentes",  // presentes | votantes
  },
};

const SESSAO_INICIAL = {
  id: "S-2026-009",
  numero: 9,
  tipo: "Ordinária",
  legislatura: "19ª Legislatura",
  sessaoLeg: "2ª Sessão Legislativa",
  data: "27 de maio de 2026",
  hora: "14:00",
  local: "Plenário da Câmara Municipal de Serrinha",
  status: "aberta",
  presencas: {
    v01: true, v02: true, v03: true, v04: true, v05: true,
    v06: true, v07: true, v08: false, v09: true, v10: true,
    v11: true, v12: false, v13: true,
  },
  materias: [
    {
      id: "PL 010/2025", tipo: "PL", ordem: 1,
      titulo: "Institui o Fundo Municipal de Habitação Popular de Serrinha",
      autor: "Verª. Aline Souza",
      ementa: "Cria o Fundo Municipal de Habitação Popular para viabilizar programas habitacionais destinados à população de baixa renda no Município de Serrinha.",
      status: "aprovada", votacaoAbertaEm: "14:18", votacaoFechadaEm: "14:26",
      votos: { v01: "sim", v02: "sim", v03: "sim", v04: "abst", v05: "nao", v06: "sim", v07: "sim", v09: "sim", v10: "sim", v11: "abst", v13: "sim" },
    },
    {
      id: "REQ 042/2025", tipo: "REQ", ordem: 2,
      titulo: "Requer informações sobre obras na Av. Central",
      autor: "Ver. Carlos Mota",
      ementa: "Solicita relação completa de obras viárias paralisadas há mais de 180 dias na Av. Central, com cronograma de retomada e empresas contratadas.",
      status: "aprovada", votacaoAbertaEm: "14:35", votacaoFechadaEm: "14:38",
      votos: { v01: "sim", v02: "sim", v03: "sim", v04: "sim", v05: "sim", v06: "sim", v07: "sim", v09: "sim", v10: "sim", v11: "sim", v13: "sim" },
    },
    {
      id: "IND 015/2025", tipo: "IND", ordem: 3,
      titulo: "Indica instalação de lombada eletrônica na Rua das Flores",
      autor: "Verª. Deise Lima",
      ementa: "Indica ao Poder Executivo a instalação de lombada eletrônica na Rua das Flores, em frente à Escola Municipal João Pessoa, para reduzir acidentes.",
      status: "em_votacao", votacaoAbertaEm: "14:52", votacaoFechadaEm: null,
      votos: { v01: "sim", v02: "sim", v03: "sim", v06: "sim" },
    },
    {
      id: "PL 012/2025", tipo: "PL", ordem: 4,
      titulo: "Cria o Programa Municipal de Incentivo ao Esporte",
      autor: "Ver. Eduardo Neves",
      ementa: "Institui o Programa Municipal de Incentivo ao Esporte com vistas a promover a prática esportiva entre crianças e jovens em situação de vulnerabilidade social.",
      status: "pendente", votacaoAbertaEm: null, votacaoFechadaEm: null, votos: {},
    },
  ],
  log: [
    { t: "14:00", ev: "Sessão aberta pela presidência", who: "Presidência" },
    { t: "14:02", ev: "Verificação de quórum: 11 presentes", who: "Mesa Diretora" },
    { t: "14:06", ev: "Leitura da ata anterior aprovada por unanimidade", who: "1º Secretário" },
    { t: "14:18", ev: "Aberta votação — PL 010/2025", who: "Presidência" },
    { t: "14:26", ev: "PL 010/2025 APROVADO (8 sim, 1 não, 2 abst.)", who: "Painel" },
    { t: "14:35", ev: "Aberta votação — REQ 042/2025", who: "Presidência" },
    { t: "14:38", ev: "REQ 042/2025 APROVADO por unanimidade", who: "Painel" },
    { t: "14:52", ev: "Aberta votação — IND 015/2025", who: "Presidência" },
  ],
};

const SESSOES_PASSADAS = [
  { id: "S-2026-008", numero: 8, tipo: "Ordinária",      data: "20 de maio de 2026",   dataIso: "2026-05-20", status: "encerrada", presentes: 12, ausentes: 1, materias: 4, aprovadas: 3, rejeitadas: 1, duracao: "1h 58min" },
  { id: "S-2026-007", numero: 7, tipo: "Ordinária",      data: "13 de maio de 2026",   dataIso: "2026-05-13", status: "encerrada", presentes: 11, ausentes: 2, materias: 5, aprovadas: 4, rejeitadas: 1, duracao: "2h 14min" },
  { id: "S-2026-006", numero: 6, tipo: "Extraordinária", data: "08 de maio de 2026",   dataIso: "2026-05-08", status: "encerrada", presentes: 13, ausentes: 0, materias: 2, aprovadas: 2, rejeitadas: 0, duracao: "0h 52min" },
  { id: "S-2026-005", numero: 5, tipo: "Ordinária",      data: "06 de maio de 2026",   dataIso: "2026-05-06", status: "encerrada", presentes: 10, ausentes: 3, materias: 6, aprovadas: 4, rejeitadas: 2, duracao: "2h 45min" },
  { id: "S-2026-004", numero: 4, tipo: "Solene",         data: "21 de abril de 2026",  dataIso: "2026-04-21", status: "encerrada", presentes: 13, ausentes: 0, materias: 1, aprovadas: 1, rejeitadas: 0, duracao: "1h 10min" },
  { id: "S-2026-003", numero: 3, tipo: "Ordinária",      data: "15 de abril de 2026",  dataIso: "2026-04-15", status: "encerrada", presentes: 9,  ausentes: 4, materias: 7, aprovadas: 5, rejeitadas: 1, duracao: "3h 05min" },
];

// === Hook unificado: sessão + configuração ===
const SESSION_KEY = "serrinha_painel_sessao_v1";
const CONFIG_KEY  = "serrinha_painel_config_v1";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return fallback;
}

function useSessionStore() {
  const [state, setState] = React.useState(() => loadJSON(SESSION_KEY, SESSAO_INICIAL));
  const [config, setConfigRaw] = React.useState(() => {
    const loaded = loadJSON(CONFIG_KEY, CONFIG_DEFAULT);
    // Garante novos campos default em configs antigas
    // Migração: mesa antiga (objeto) vira lista
    let mesa = loaded.mesa;
    if (mesa && !Array.isArray(mesa)) {
      const oldKeys = [
        { oldKey: "presidenteId",     id: "presidente", label: "Presidente",      abrev: "PRES",   desc: "Conduz a sessão."                    },
        { oldKey: "vicePresidenteId", id: "vice",       label: "Vice-Presidente", abrev: "VICE",   desc: "Substitui o presidente."             },
        { oldKey: "primeiroSecId",    id: "primSec",    label: "1º Secretário",   abrev: "1º SEC", desc: "Lê a ata e conta votos."            },
        { oldKey: "segundoSecId",     id: "segSec",     label: "2º Secretário",   abrev: "2º SEC", desc: "Auxilia o 1º Secretário."           },
      ];
      mesa = oldKeys.map(k => ({ id: k.id, label: k.label, abrev: k.abrev, desc: k.desc, vereadorId: loaded.mesa[k.oldKey] || null }));
    }
    return {
      ...CONFIG_DEFAULT,
      ...loaded,
      camara: {
        ...CONFIG_DEFAULT.camara,
        ...(loaded.camara || {}),
        // Migração: substitui cor institucional dourada antiga pelo azul moderno
        corInstitucional: (loaded.camara?.corInstitucional === "#b18a3b")
          ? CONFIG_DEFAULT.camara.corInstitucional
          : (loaded.camara?.corInstitucional || CONFIG_DEFAULT.camara.corInstitucional),
      },
      mesa: mesa || CONFIG_DEFAULT.mesa,
      regimento: { ...CONFIG_DEFAULT.regimento, ...(loaded.regimento || {}) },
      sessoesAgendadas: loaded.sessoesAgendadas || CONFIG_DEFAULT.sessoesAgendadas,
      vereadores: (loaded.vereadores || CONFIG_DEFAULT.vereadores).map(v => ({
        ...v,
        usuario: v.usuario || v.id,
        senha:   v.senha   || "1234",
      })),
      tipos: { ...CONFIG_DEFAULT.tipos, ...(loaded.tipos || {}) },
    };
  });

  React.useEffect(() => {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  React.useEffect(() => {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch (e) {}
  }, [config]);

  // Sync cross-tab
  React.useEffect(() => {
    function onStorage(e) {
      if (e.newValue == null) return;
      try {
        if (e.key === SESSION_KEY) setState(JSON.parse(e.newValue));
        else if (e.key === CONFIG_KEY) setConfigRaw(JSON.parse(e.newValue));
      } catch (err) {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const setConfig = (patch) => {
    setConfigRaw(c => typeof patch === "function" ? patch(c) : { ...c, ...patch });
  };

  const api = {
    state,
    setState,
    config,
    setConfig,
    togglePresence: (vId) => setState(s => {
      const v = (config.vereadores).find(x => x.id === vId);
      const wasPresent = !!s.presencas[vId];
      return {
        ...s,
        presencas: { ...s.presencas, [vId]: !wasPresent },
        log: [{ t: now(), ev: `${v?.nome || vId} registrou ${wasPresent ? "ausência" : "presença"}`, who: "Plenário" }, ...s.log],
      };
    }),
    openVoting: (mId) => setState(s => ({
      ...s,
      materias: s.materias.map(x => x.id === mId
        ? { ...x, status: "em_votacao", votacaoAbertaEm: now(), votos: {} }
        : (x.status === "em_votacao" ? { ...x, status: "pendente", votacaoAbertaEm: null } : x)
      ),
      log: [{ t: now(), ev: `Aberta votação — ${mId}`, who: "Presidência" }, ...s.log],
    })),
    closeVoting: (mId) => setState(s => {
      const m = s.materias.find(x => x.id === mId);
      const tally = computeTally(m, s.presencas);
      const aprovada = tally.sim > tally.nao;
      return {
        ...s,
        materias: s.materias.map(x => x.id === mId
          ? { ...x, status: aprovada ? "aprovada" : "rejeitada", votacaoFechadaEm: now() }
          : x
        ),
        log: [{
          t: now(),
          ev: `${mId} ${aprovada ? "APROVADO" : "REJEITADO"} (${tally.sim} sim, ${tally.nao} não, ${tally.abst} abst.)`,
          who: "Painel",
        }, ...s.log],
      };
    }),
    castVote: (mId, vId, vote) => setState(s => {
      const v = (config.vereadores).find(x => x.id === vId);
      return {
        ...s,
        materias: s.materias.map(x => x.id === mId
          ? { ...x, votos: { ...x.votos, [vId]: vote } }
          : x
        ),
        log: [{ t: now(), ev: `Voto registrado: ${v?.nome || vId} → ${vote.toUpperCase()}`, who: mId }, ...s.log],
      };
    }),
    sessionAction: (action) => setState(s => {
      const map = {
        suspender: { status: "suspensa",  ev: "Sessão suspensa pela presidência" },
        retomar:   { status: "aberta",    ev: "Sessão retomada" },
        encerrar:  { status: "encerrada", ev: "Sessão encerrada pela presidência" },
      };
      const m = map[action];
      if (!m) return s;
      return { ...s, status: m.status, log: [{ t: now(), ev: m.ev, who: "Presidência" }, ...s.log] };
    }),
    addMateria: (mat) => setState(s => {
      const ordem = Math.max(0, ...s.materias.map(m => m.ordem || 0)) + 1;
      const novo = {
        ordem,
        tipo: "PL",
        titulo: "",
        autor: "",
        ementa: "",
        status: "pendente",
        votacaoAbertaEm: null,
        votacaoFechadaEm: null,
        votos: {},
        ...mat,
      };
      if (!novo.id) {
        const sigla = (config.tipos?.[novo.tipo]?.sigla || novo.tipo);
        const year = new Date().getFullYear();
        const nums = s.materias
          .map(m => parseInt(String(m.id).match(/-(\d+)\//)?.[1], 10))
          .filter(Number.isFinite);
        const next = (Math.max(0, ...nums) + 1).toString().padStart(3, "0");
        novo.id = `${sigla}-${next}/${year}`;
      }
      return {
        ...s,
        materias: [...s.materias, novo],
        log: [{ t: now(), ev: `Matéria incluída na ordem do dia: ${novo.id}`, who: "Mesa Diretora" }, ...s.log],
      };
    }),
    updateMateria: (mId, patch) => setState(s => ({
      ...s,
      materias: s.materias.map(m => m.id === mId ? { ...m, ...patch } : m),
    })),
    removeMateria: (mId) => setState(s => {
      const m = s.materias.find(x => x.id === mId);
      if (!m || m.status !== "pendente") return s;
      const remaining = s.materias.filter(x => x.id !== mId)
        .map((x, i) => ({ ...x, ordem: i + 1 }));
      return {
        ...s,
        materias: remaining,
        log: [{ t: now(), ev: `Matéria retirada da ordem do dia: ${mId}`, who: "Mesa Diretora" }, ...s.log],
      };
    }),
    moveMateria: (mId, dir) => setState(s => {
      const idx = s.materias.findIndex(m => m.id === mId);
      if (idx < 0) return s;
      const j = idx + dir;
      if (j < 0 || j >= s.materias.length) return s;
      const arr = [...s.materias];
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...s, materias: arr.map((x, i) => ({ ...x, ordem: i + 1 })) };
    }),
    reorderMaterias: (ids) => setState(s => {
      const map = new Map(s.materias.map(m => [m.id, m]));
      const ordered = ids.map(id => map.get(id)).filter(Boolean);
      // Preserva materias não incluídas no array (fallback)
      const missing = s.materias.filter(m => !ids.includes(m.id));
      const next = [...ordered, ...missing].map((x, i) => ({ ...x, ordem: i + 1 }));
      return { ...s, materias: next };
    }),
    // === Sessões agendadas ===
    agendarSessao: (sessao) => {
      setConfigRaw(c => {
        const list = c.sessoesAgendadas || [];
        const nums = list.map(x => x.numero).filter(Number.isFinite);
        const numero = sessao.numero || (Math.max(0, ...nums, state.numero || 0) + 1);
        const year = (sessao.dataIso || new Date().toISOString()).slice(0, 4);
        let id = sessao.id;
        if (!id) {
          const prefix = sessao.tipo === "Extraordinária" ? "EXT" : sessao.tipo === "Solene" ? "SOL" : "ORD";
          id = `S-${year}-${prefix}-${String(numero).padStart(3, "0")}`;
        }
        const novo = {
          id, numero, tipo: "Ordinária",
          dataIso: new Date().toISOString().slice(0, 10),
          hora: c.camara?.horarioPadrao || "14:00",
          local: c.camara?.plenarioNome || "",
          pauta: "",
          observacoes: "",
          ...sessao,
          id, numero,
        };
        return { ...c, sessoesAgendadas: [...list, novo].sort((a, b) => (a.dataIso + a.hora).localeCompare(b.dataIso + b.hora)) };
      });
    },
    updateSessaoAgendada: (id, patch) => {
      setConfigRaw(c => ({
        ...c,
        sessoesAgendadas: (c.sessoesAgendadas || []).map(s => s.id === id ? { ...s, ...patch } : s)
          .sort((a, b) => (a.dataIso + a.hora).localeCompare(b.dataIso + b.hora)),
      }));
    },
    removeSessaoAgendada: (id) => {
      setConfigRaw(c => ({
        ...c,
        sessoesAgendadas: (c.sessoesAgendadas || []).filter(s => s.id !== id),
      }));
    },
    iniciarSessao: (id) => {
      // Move uma sessão agendada para sessão ativa (estado), preservando os dados,
      // e remove-a da lista de agendadas.
      const agendada = (config.sessoesAgendadas || []).find(s => s.id === id);
      if (!agendada) return;
      const dataExtenso = formatarDataExtenso(agendada.dataIso);
      const nova = {
        id: agendada.id,
        numero: agendada.numero,
        tipo: agendada.tipo,
        legislatura: config.camara.legislatura,
        sessaoLeg: config.camara.sessaoLeg,
        data: dataExtenso,
        dataIso: agendada.dataIso,
        hora: agendada.hora,
        local: agendada.local || config.camara.plenarioNome,
        status: "aberta",
        presencas: Object.fromEntries(config.vereadores.map(v => [v.id, false])),
        materias: [],
        log: [
          { t: now(), ev: `Sessão aberta — ${agendada.numero}ª ${agendada.tipo}`, who: "Presidência" },
        ],
      };
      setState(nova);
      setConfigRaw(c => ({
        ...c,
        sessoesAgendadas: (c.sessoesAgendadas || []).filter(s => s.id !== id),
      }));
    },
    resetSession: () => {
      localStorage.removeItem(SESSION_KEY);
      setState(SESSAO_INICIAL);
    },
    resetConfig: () => {
      localStorage.removeItem(CONFIG_KEY);
      setConfigRaw(CONFIG_DEFAULT);
    },
  };

  return api;
}

function computeTally(materia, presencas) {
  const presentes = Object.entries(presencas).filter(([k,v]) => v).map(([k]) => k);
  const votos = materia?.votos || {};
  let sim = 0, nao = 0, abst = 0;
  for (const vId of presentes) {
    const v = votos[vId];
    if (v === "sim") sim++;
    else if (v === "nao") nao++;
    else if (v === "abst") abst++;
  }
  const total = presentes.length;
  const pendentes = total - sim - nao - abst;
  return { sim, nao, abst, pendentes, total, presentes };
}

function presenceCount(presencas) {
  return Object.values(presencas).filter(Boolean).length;
}

function findVereador(id, list) {
  return (list || VEREADORES_DEFAULT).find(v => v.id === id);
}
function initials(name) {
  const parts = (name || "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}

// Helper: retorna o cargo da Mesa ocupado por um vereador, ou null
function papelMesa(vId, config) {
  const mesa = config?.mesa;
  if (!Array.isArray(mesa)) return null;
  return mesa.find(c => c.vereadorId === vId) || null;
}
function papelLabel(cargo) { return cargo?.label || ""; }
function papelAbrev(cargo) { return cargo?.abrev || ""; }
function mesaCargo(id, config) {
  return (config?.mesa || []).find(c => c.id === id) || null;
}

const MESES_EXTENSO = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const DIAS_SEMANA_EXTENSO = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

function formatarDataExtenso(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${String(d).padStart(2, "0")} de ${MESES_EXTENSO[m - 1]} de ${y}`;
}
function formatarDiaSemana(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return DIAS_SEMANA_EXTENSO[date.getDay()];
}
function compararComHoje(isoDate) {
  if (!isoDate) return 0;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (isoDate < todayIso) return -1;
  if (isoDate > todayIso) return 1;
  return 0;
}

Object.assign(window, {
  VEREADORES_DEFAULT, TIPOS_DEFAULT, CONFIG_DEFAULT, SESSAO_INICIAL, SESSOES_PASSADAS,
  SESSION_KEY, CONFIG_KEY,
  useSessionStore, computeTally, presenceCount, findVereador, initials,
  papelMesa, papelLabel, papelAbrev, mesaCargo,
  formatarDataExtenso, formatarDiaSemana, compararComHoje, DIAS_SEMANA_EXTENSO,
});
