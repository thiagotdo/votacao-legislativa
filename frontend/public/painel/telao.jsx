// === Telão Plenário (placar público em tempo real) ===

function TelaoStatusBanner({ materia, tally, presentes, regimento }) {
  const status = materia.status;
  if (status === "em_votacao") {
    const pct = presentes > 0 ? Math.round(((tally.sim + tally.nao + tally.abst) / presentes) * 100) : 0;
    return (
      <div className="telao-status em-votacao" data-status="em_votacao">
        <div className="ts-glow" aria-hidden="true" />
        <div className="ts-bar"><div className="ts-bar-fill" style={{ width: `${pct}%` }} /></div>
        <div className="ts-content">
          <div className="ts-left">
            <span className="ts-pulse-dot" />
            <div>
              <div className="ts-label">Em votação</div>
              <div className="ts-meta">aberta {materia.votacaoAbertaEm || "—"}{regimento?.tempoLimite ? ` · tempo limite ${regimento.tempoLimite}s` : ""}</div>
            </div>
          </div>
          <div className="ts-right">
            <div className="ts-counter">
              <span className="ts-counter-val">{tally.pendentes}</span>
              <span className="ts-counter-lbl">{tally.pendentes === 1 ? "voto pendente" : "votos pendentes"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (status === "aprovada") {
    return (
      <div className="telao-status aprovada" data-status="aprovada">
        <div className="ts-content">
          <div className="ts-left">
            <span className="ts-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <div>
              <div className="ts-label">Matéria aprovada</div>
              <div className="ts-meta">{tally.sim} {tally.sim === 1 ? "voto favorável" : "votos favoráveis"} · {tally.nao} contrário{tally.nao !== 1 ? "s" : ""}{tally.abst > 0 ? ` · ${tally.abst} abstenção${tally.abst !== 1 ? "s" : ""}` : ""}</div>
            </div>
          </div>
          <div className="ts-right">
            <div className="ts-tally-mini sim">
              <span className="v">{tally.sim}</span>
              <span className="l">SIM</span>
            </div>
            <div className="ts-vs">×</div>
            <div className="ts-tally-mini nao">
              <span className="v">{tally.nao}</span>
              <span className="l">NÃO</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (status === "rejeitada") {
    return (
      <div className="telao-status rejeitada" data-status="rejeitada">
        <div className="ts-content">
          <div className="ts-left">
            <span className="ts-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </span>
            <div>
              <div className="ts-label">Matéria rejeitada</div>
              <div className="ts-meta">{tally.nao} {tally.nao === 1 ? "voto contrário" : "votos contrários"} · {tally.sim} favoráve{tally.sim !== 1 ? "is" : "l"}{tally.abst > 0 ? ` · ${tally.abst} abstenção${tally.abst !== 1 ? "s" : ""}` : ""}</div>
            </div>
          </div>
          <div className="ts-right">
            <div className="ts-tally-mini sim">
              <span className="v">{tally.sim}</span>
              <span className="l">SIM</span>
            </div>
            <div className="ts-vs">×</div>
            <div className="ts-tally-mini nao">
              <span className="v">{tally.nao}</span>
              <span className="l">NÃO</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="telao-status aguardando" data-status="aguardando">
      <div className="ts-content">
        <div className="ts-left">
          <span className="ts-icon ts-icon-ring"><span /></span>
          <div>
            <div className="ts-label">Aguardando votação</div>
            <div className="ts-meta">A Presidência abrirá a votação da próxima matéria.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TelaoPlenario({ store }) {
  const { state, config } = store;
  const materia = state.materias.find(m => m.status === "em_votacao")
              || state.materias.filter(m => m.status === "aprovada" || m.status === "rejeitada").slice(-1)[0]
              || state.materias[0];

  const tally = computeTally(materia, state.presencas);
  const presentes = presenceCount(state.presencas);
  const total = config.vereadores.length;

  return (
    <div className="telao">
      <div className="telao-header">
        <div className="left">
          <div className="k">Sessão</div>
          <div>{state.numero}ª {state.tipo} · {state.id}</div>
          <div className="telao-header-aux">{state.data} · {state.local || config.camara.plenarioNome}</div>
        </div>
        <div className="center">
          {config.camara.brasao && (
            <img src={config.camara.brasao} alt="" className="telao-brasao" />
          )}
          {config.camara.nomeFormal.toUpperCase()}
          <div className="sub">{config.camara.legislatura} · {config.camara.sessaoLeg}</div>
        </div>
        <div className="right">
          <div className="k">Presença</div>
          <div className="tab">{presentes} de {total} vereadores</div>
          <div className="telao-header-aux">
            <StatusPill status={state.status} />
          </div>
        </div>
      </div>

      <TelaoStatusBanner materia={materia} tally={tally} presentes={presentes} regimento={config.regimento} />

      <div className="telao-matter">
        <div className="id">
          {config.tipos[materia.tipo]?.sigla || materia.tipo} · {materia.id}
          {" · "}
          <span className="telao-author">{materia.autor}</span>
        </div>
        <div className="ttl">{materia.titulo}</div>
        <div className="desc">{materia.ementa}</div>
      </div>

      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 18 }}>
        <div className="telao-tally">
          <TelaoCell label="Sim"        kind="sim"  value={tally.sim}  total={presentes} />
          <TelaoCell label="Não"        kind="nao"  value={tally.nao}  total={presentes} />
          <TelaoCell label="Abstenção"  kind="abst" value={tally.abst} total={presentes} />
          <TelaoCell label="Pendentes"  kind="pend" value={tally.pendentes} total={presentes} />
        </div>

        <div className="telao-grid">
          {config.vereadores.map(v => {
            const presente = !!state.presencas[v.id];
            const voto = presente ? (materia.votos?.[v.id] || "pendente") : "ausente";
            const cargo = papelMesa(v.id, config);
            return (
              <div key={v.id} className={`cell ${voto === "pendente" ? "" : voto}`}>
                <VereadorAvatar vereador={v} size={36} className="cell-avatar" />
                <div className="cell-info">
                  <div className="n">{v.nome}</div>
                  <div className="meta">
                    <span>{v.partido}{cargo ? ` · ${cargo.abrev}` : ""}</span>
                    <span className="vote-tag">
                      {voto === "sim" && "SIM"}
                      {voto === "nao" && "NÃO"}
                      {voto === "abst" && "ABST"}
                      {voto === "ausente" && "AUS"}
                      {voto === "pendente" && "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="telao-footer">
        <span>Painel Eletrônico de Votação · transmissão ao vivo</span>
        <span className="tab"><LiveTime /></span>
      </div>
    </div>
  );
}

function TelaoCell({ label, kind, value, total }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className={`telao-cell ${kind}`}>
      <div className="k">{label}</div>
      <div className="v tab">{String(value).padStart(2, '0')}</div>
      <div className="bar"><div style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function LiveTime() {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (n) => String(n).padStart(2, '0');
  return <span>{fmt(now.getHours())}:{fmt(now.getMinutes())}:{fmt(now.getSeconds())}</span>;
}

Object.assign(window, { TelaoPlenario });
