// === Painel da Mesa Diretora (Presidente) ===

function MesaDiretora({ store }) {
  const { state, config } = store;
  const materiaAtiva = state.materias.find(m => m.status === "em_votacao");

  return (
    <div>
      <SessionBar state={state} config={config} />
      <div className="mesa-grid">
        <div>
          <PresenceCard store={store} />
          <ActivityLog log={state.log} />
        </div>
        <div>
          <VotingConsole store={store} materia={materiaAtiva} />
          <div style={{ height: 18 }} />
          <MateriasOrdem store={store} />
        </div>
        <div>
          <SessionControl store={store} />
          <div style={{ height: 18 }} />
          <ResultsSummary state={state} />
        </div>
      </div>
    </div>
  );
}

function PresenceCard({ store }) {
  const { state, config, togglePresence } = store;
  const presentes = presenceCount(state.presencas);
  const total = config.vereadores.length;
  const min = config.regimento.quorumDeliberacao;
  const pct = total > 0 ? Math.min(100, (presentes / total) * 100) : 0;
  const minPct = total > 0 ? (min / total) * 100 : 0;
  const ok = presentes >= min;

  return (
    <div className="card">
      <div className="card-head">
        <span className="label">I</span>
        <span className="title">Verificação de Quórum</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div style={{ padding: "14px 14px 0" }}>
          <div className="quorum-bar">
            <div className="head">
              <div>
                <div className="count tab">
                  {presentes}<span className="total tab">/{total}</span>
                </div>
                <div className="small muted">presentes em plenário</div>
              </div>
              <span className={`pill ${ok ? "open" : "live"}`}>
                <span className="dot" />
                {ok ? "Quórum atingido" : "Sem quórum"}
              </span>
            </div>
            <div className="bar">
              <div className={`fill ${ok ? "ok" : ""}`} style={{ width: `${pct}%` }} />
              <div className="marker" style={{ left: `${minPct}%` }} />
            </div>
            <div className="small muted tab" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Mínimo: {min} vereadores</span>
              <span>{Math.round(pct)}% do total</span>
            </div>
          </div>
        </div>
        <div>
          {config.vereadores.map(v => {
            const presente = !!state.presencas[v.id];
            const cargo = papelMesa(v.id, config);
            return (
              <div key={v.id} className={`vereador-row ${cargo?.id === "presidente" ? "president" : ""}`}>
                <div
                  className={`pres-toggle ${presente ? "on" : ""}`}
                  onClick={() => togglePresence(v.id)}
                  title={presente ? "Marcar ausente" : "Marcar presente"}
                />
                <div>
                  <div className="name">
                    {v.nome}
                    {cargo && cargo.id !== "presidente" && (
                      <span style={{
                        marginLeft: 8, fontSize: 9, letterSpacing: "0.14em",
                        textTransform: "uppercase", color: "var(--brasao)",
                        fontWeight: 600,
                      }}>{cargo.abrev?.toLowerCase()}</span>
                    )}
                  </div>
                </div>
                <div className="party">{v.partido}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VotingConsole({ store, materia }) {
  const { config } = store;
  if (!materia) {
    return (
      <div className="card">
        <div className="card-head">
          <span className="label">II</span>
          <span className="title">Console de Votação</span>
          <span style={{ marginLeft: "auto" }} className="pill closed"><span className="dot" />Aguardando</span>
        </div>
        <div className="card-body">
          <div className="empty">
            Nenhuma matéria em votação.<br/>
            Selecione uma matéria na Ordem do Dia abaixo e clique em "Abrir votação".
          </div>
        </div>
      </div>
    );
  }

  const tally = computeTally(materia, store.state.presencas);
  const tipo = config.tipos[materia.tipo];
  const ok = tally.sim > tally.nao && tally.sim + tally.nao + tally.abst >= (tipo?.quorumMin || 7);

  return (
    <div className="voting-console">
      <div className="head">
        <div>
          <div className="matter-id">{tipo?.sigla || materia.tipo} · {materia.id} · aberta às {materia.votacaoAbertaEm}</div>
          <div className="matter-title">{materia.titulo}</div>
        </div>
        <span className="pill live"><span className="dot" />Em Votação</span>
      </div>
      <div className="tally">
        <div className="tally-cell sim">
          <div className="k">Sim</div>
          <div className="v tab">{String(tally.sim).padStart(2, '0')}</div>
        </div>
        <div className="tally-cell nao">
          <div className="k">Não</div>
          <div className="v tab">{String(tally.nao).padStart(2, '0')}</div>
        </div>
        <div className="tally-cell abst">
          <div className="k">Abstenções</div>
          <div className="v tab">{String(tally.abst).padStart(2, '0')}</div>
        </div>
        <div className="tally-cell pend">
          <div className="k">Pendentes</div>
          <div className="v tab">{String(tally.pendentes).padStart(2, '0')}</div>
        </div>
      </div>
      <div className="actions">
        <button className="btn success" onClick={() => store.closeVoting(materia.id)}>
          Encerrar votação
        </button>
        <button className="btn ghost" style={{ borderColor: "#3a4350", color: "var(--bone)" }}
          onClick={() => simulateVotes(store, materia.id)}>
          Simular votos pendentes
        </button>
        <div className="small mono" style={{ marginLeft: "auto", color: "#8c8775", display: "flex", alignItems: "center", gap: 8 }}>
          {ok ? "✓ Resultado preliminar: APROVADO" : "Maioria pendente"}
        </div>
      </div>
    </div>
  );
}

function simulateVotes(store, mId) {
  const state = store.state;
  const mat = state.materias.find(m => m.id === mId);
  if (!mat) return;
  const presentes = Object.keys(state.presencas).filter(id => state.presencas[id]);
  const pending = presentes.filter(id => !(id in (mat.votos || {})));
  const opts = ["sim", "sim", "sim", "sim", "nao", "nao", "abst"];
  let i = 0;
  pending.forEach(id => {
    setTimeout(() => {
      store.castVote(mId, id, opts[(i++ + Math.floor(Math.random()*opts.length)) % opts.length]);
    }, i * 180);
  });
}

function MateriasOrdem({ store }) {
  const { state, config, openVoting } = store;
  const [showPanel, setShowPanel] = React.useState(false);
  React.useEffect(() => {
    if (!showPanel) return;
    const onKey = (e) => { if (e.key === "Escape") setShowPanel(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPanel]);

  return (
    <div className="card">
      <div className="card-head">
        <span className="label">III</span>
        <span className="title">Ordem do Dia</span>
        <span className="small muted" style={{ marginLeft: "auto" }}>
          {state.materias.length} matérias · {state.materias.filter(m => m.status === "aprovada" || m.status === "rejeitada").length} apreciadas
        </span>
        <button className="btn small ghost" onClick={() => setShowPanel(true)}
          title="Cadastrar, editar e reordenar matérias">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Gerenciar
        </button>
      </div>
      <div className="card-body">
        {state.materias.length === 0 && (
          <div className="empty" style={{ padding: 24 }}>
            Nenhuma matéria na ordem do dia.<br/>
            <button className="btn small" style={{ marginTop: 14 }} onClick={() => setShowPanel(true)}>
              + Cadastrar primeira matéria
            </button>
          </div>
        )}
        {state.materias.map(m => {
          const tipo = config.tipos[m.tipo];
          const active = m.status === "em_votacao";
          const done = m.status === "aprovada" || m.status === "rejeitada";
          return (
            <div key={m.id} className={`materia ${active ? "active" : ""} ${done ? "voted" : ""}`}>
              <div className="num">
                <div>{String(m.ordem).padStart(2, '0')}</div>
                <div style={{ marginTop: 4 }}>{m.id}</div>
              </div>
              <div>
                <div className="ttl">{m.titulo}</div>
                <div className="desc">{m.ementa}</div>
                <div className="tags">
                  <span className="vote-chip pendente">{tipo?.sigla || m.tipo}</span>
                  <span className="small muted">{m.autor}</span>
                </div>
              </div>
              <div className="right">
                <StatusPill status={m.status} />
                {m.status === "pendente" && (
                  <button className="btn small" onClick={() => openVoting(m.id)}>Abrir votação</button>
                )}
                {done && (
                  <span className="mono small muted">
                    {m.status === "aprovada" ? "APROV." : "REJEIT."} · {m.votacaoFechadaEm}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showPanel && <OrdemDoDiaPanel store={store} onClose={() => setShowPanel(false)} />}
    </div>
  );
}

function SessionControl({ store }) {
  const { state, sessionAction, resetSession } = store;
  return (
    <div className="card">
      <div className="card-head">
        <span className="label">IV</span>
        <span className="title">Comando da Sessão</span>
      </div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {state.status === "aberta" && (
          <>
            <button className="btn ghost" onClick={() => sessionAction("suspender")}>
              Suspender sessão
            </button>
            <button className="btn danger" onClick={() => sessionAction("encerrar")}>
              Encerrar sessão
            </button>
          </>
        )}
        {state.status === "suspensa" && (
          <>
            <button className="btn success" onClick={() => sessionAction("retomar")}>
              Retomar sessão
            </button>
            <button className="btn danger" onClick={() => sessionAction("encerrar")}>
              Encerrar sessão
            </button>
          </>
        )}
        {state.status === "encerrada" && (
          <div className="empty" style={{ padding: "10px 0" }}>
            Sessão encerrada. Acesse o Arquivo para gerar a ata.
          </div>
        )}
        <div className="divider" />
        <div className="field-label">Atalhos de uso</div>
        <button className="btn ghost small" onClick={() => {
          store.config.vereadores.forEach(v => {
            if (!store.state.presencas[v.id]) store.togglePresence(v.id);
          });
        }}>
          Marcar todos presentes
        </button>
        <button className="btn ghost small" onClick={resetSession}>
          Restaurar sessão de exemplo
        </button>
      </div>
    </div>
  );
}

function ResultsSummary({ state }) {
  const apreciadas = state.materias.filter(m => m.status === "aprovada" || m.status === "rejeitada");
  if (apreciadas.length === 0) {
    return (
      <div className="card">
        <div className="card-head">
          <span className="label">V</span>
          <span className="title">Resultados desta sessão</span>
        </div>
        <div className="card-body">
          <div className="empty" style={{ padding: 14 }}>Nenhuma matéria apreciada até o momento.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="card-head">
        <span className="label">V</span>
        <span className="title">Resultados desta sessão</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {apreciadas.map(m => {
          const t = computeTally(m, state.presencas);
          return (
            <div key={m.id} style={{
              padding: "11px 14px",
              borderBottom: "1px solid var(--paper-3)",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 10,
            }}>
              <div>
                <div className="mono tiny tracked upper muted">{m.id}</div>
                <div className="serif" style={{ fontSize: 13, fontWeight: 600, marginTop: 2, lineHeight: 1.25 }}>
                  {m.titulo.slice(0, 70)}{m.titulo.length > 70 ? "…" : ""}
                </div>
                <div className="mono small tab" style={{ marginTop: 4 }}>
                  <span style={{ color: "var(--sim)", fontWeight: 600 }}>{t.sim} sim</span>
                  {" · "}
                  <span style={{ color: "var(--nao)", fontWeight: 600 }}>{t.nao} não</span>
                  {" · "}
                  <span style={{ color: "var(--abst)", fontWeight: 600 }}>{t.abst} abst</span>
                </div>
              </div>
              <StatusPill status={m.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityLog({ log }) {
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="card-head">
        <span className="label">VI</span>
        <span className="title">Registro da sessão</span>
        <span className="small muted" style={{ marginLeft: "auto" }}>{log.length} eventos</span>
      </div>
      <div className="activity">
        {log.map((e, i) => (
          <div key={i} className="activity-item">
            <span className="t tab">{e.t}</span>
            <span className="e">
              <span className="ev">{e.ev}</span>
              <span className="who">— {e.who}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MesaDiretora });
