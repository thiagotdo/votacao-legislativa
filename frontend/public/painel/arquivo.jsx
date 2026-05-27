// === Arquivo de Sessões (histórico + ata) ===

function ArquivoSessoes({ store }) {
  const { state, config } = store;
  const [tab, setTab] = React.useState("agenda");
  const [sel, setSel] = React.useState(null);
  const agendadasCount = (config.sessoesAgendadas || []).length;

  return (
    <div>
      <div className="subtabs">
        <button className={tab === "agenda" ? "active" : ""} onClick={() => setTab("agenda")}>
          Próximas sessões{agendadasCount > 0 ? ` · ${agendadasCount}` : ""}
        </button>
        <button className={tab === "lista" ? "active" : ""} onClick={() => setTab("lista")}>Sessões anteriores</button>
        <button className={tab === "ata" ? "active" : ""} onClick={() => setTab("ata")}>Ata da sessão atual</button>
      </div>

      {tab === "agenda" && <AgendaSessoes store={store} />}

      {tab === "lista" && (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-head">
              <span className="label">Estatísticas</span>
              <span className="title">Resumo do biênio {config.camara.biennio}</span>
            </div>
            <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18 }}>
              <Stat k="Sessões realizadas" v="74" />
              <Stat k="Matérias apreciadas" v="312" />
              <Stat k="Taxa de aprovação" v="78%" />
              <Stat k="Quórum médio" v="11,2" />
              <Stat k="Duração média" v="2h 08min" />
            </div>
          </div>

          <div className="card-head" style={{ background: "transparent", border: 0, padding: "0 0 10px" }}>
            <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Sessões anteriores</span>
            <span className="small muted" style={{ marginLeft: "auto" }}>Mais recentes primeiro</span>
          </div>

          <div className="session-list">
            <div className="session-row" style={{ background: "var(--paper-2)", cursor: "default" }}>
              <div className="mono tiny tracked upper muted">Data</div>
              <div className="mono tiny tracked upper muted">Sessão</div>
              <div className="mono tiny tracked upper muted">Quórum</div>
              <div className="mono tiny tracked upper muted">Matérias</div>
              <div className="mono tiny tracked upper muted">Duração</div>
            </div>
            {SESSOES_PASSADAS.map(s => (
              <div key={s.id}
                className={`session-row ${sel === s.id ? "selected" : ""}`}
                onClick={() => setSel(sel === s.id ? null : s.id)}>
                <div className="date tab">
                  {s.dataIso.slice(8,10)}/{s.dataIso.slice(5,7)}
                  <div className="y">{s.dataIso.slice(0,4)}</div>
                </div>
                <div className="ttl">
                  {s.numero}ª {s.tipo}
                  <div className="sub">{s.id}</div>
                </div>
                <div className="stat tab">
                  <span style={{ color: "var(--sim)", fontWeight: 600 }}>{s.presentes}</span>
                  {" / "}
                  <span style={{ color: "var(--ausente)" }}>{s.ausentes} aus.</span>
                </div>
                <div className="num tab">
                  {s.materias}
                  <span className="lbl">total · {s.aprovadas} aprov. · {s.rejeitadas} rejeit.</span>
                </div>
                <div className="num tab">{s.duracao}<span className="lbl">duração</span></div>
              </div>
            ))}
          </div>

          {sel && (() => {
            const s = SESSOES_PASSADAS.find(x => x.id === sel);
            return (
              <div className="card" style={{ marginTop: 18 }}>
                <div className="card-head">
                  <span className="label">{s.id}</span>
                  <span className="title">Documentos vinculados</span>
                  <span style={{ marginLeft: "auto" }} className="row">
                    <button className="btn small ghost">Abrir ata (PDF)</button>
                    <button className="btn small ghost">Exportar votos (CSV)</button>
                    <button className="btn small ghost">Vídeo da sessão</button>
                  </span>
                </div>
                <div className="card-body small muted">
                  Sessão concluída em {s.data}, com {s.presentes} vereadores presentes.
                  Ata redigida pela 1ª Secretaria, publicada no Diário Oficial Eletrônico do Município
                  em D+1 e disponível para consulta pública.
                </div>
              </div>
            );
          })()}
        </>
      )}

      {tab === "ata" && <AtaDocumento state={state} config={config} />}
    </div>
  );
}

function Stat({ k, v }) {
  return (
    <div>
      <div className="mono tiny tracked upper muted">{k}</div>
      <div className="serif tab" style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{v}</div>
    </div>
  );
}

function AtaDocumento({ state, config }) {
  const presentes = config.vereadores.filter(v => state.presencas[v.id]);
  const ausentes  = config.vereadores.filter(v => !state.presencas[v.id]);
  const apreciadas = state.materias.filter(m => m.status === "aprovada" || m.status === "rejeitada");
  const presidenteC = mesaCargo("presidente", config);
  const primSecC    = mesaCargo("primSec", config);
  const president = presidenteC ? findVereador(presidenteC.vereadorId, config.vereadores) : null;
  const primSec   = primSecC    ? findVereador(primSecC.vereadorId, config.vereadores)    : null;
  // Todos os cargos preenchidos, em ordem, para assinaturas
  const cargosPreenchidos = (config.mesa || [])
    .map(c => ({ cargo: c, vereador: findVereador(c.vereadorId, config.vereadores) }))
    .filter(x => x.vereador);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 22 }}>
      <div className="ata-doc">
        <div className="head">
          <div className="org">{config.camara.nomeFormal} · {config.camara.legislatura}</div>
          <div className="ttl">Ata da {state.numero}ª Sessão {state.tipo}</div>
          <div className="sub">{config.camara.sessaoLeg} · {state.data}</div>
        </div>

        <h3>I. Abertura</h3>
        <p>
          Aos {state.data.toLowerCase()}, às {state.hora}, no {state.local || config.camara.plenarioNome},
          sob a presidência {president ? `da Verª. ${president.nome} (${president.partido})` : "—"}
          {primSec ? ` e secretariada pelo Ver. ${primSec.nome} (${primSec.partido})` : ""},
          reuniu-se a {config.camara.nomeFormal} em sua {state.numero}ª Sessão {state.tipo},
          da {config.camara.sessaoLeg}.
          Verificado o quórum regimental com a presença de {presentes.length} vereadores, foi aberta a sessão.
        </p>

        <h3>II. Presenças</h3>
        <p>
          <strong>Presentes ({presentes.length}):</strong> {presentes.map(v => `${v.nome} (${v.partido})`).join("; ")}.
          {ausentes.length > 0 && (
            <> <strong>Ausentes ({ausentes.length}):</strong> {ausentes.map(v => `${v.nome} (${v.partido})`).join("; ")}.</>
          )}
        </p>

        <h3>III. Ordem do Dia · Matérias apreciadas</h3>
        {apreciadas.length === 0 && (
          <p>Não houve matéria apreciada até o presente registro.</p>
        )}
        {apreciadas.map(m => {
          const t = computeTally(m, state.presencas);
          return (
            <div className="matter-block" key={m.id}>
              <div className="h">
                <span>{config.tipos[m.tipo]?.sigla || m.tipo} · {m.id} · ordem {String(m.ordem).padStart(2, '0')}</span>
                <span>{m.votacaoAbertaEm} → {m.votacaoFechadaEm}</span>
              </div>
              <div className="t">{m.titulo}</div>
              <div className="r tab">
                Resultado: <span className={m.status === "aprovada" ? "ap" : "rj"}>
                  {m.status === "aprovada" ? "APROVADA" : "REJEITADA"}
                </span>
                {" — "}
                {t.sim} sim · {t.nao} não · {t.abst} abstenções · {t.pendentes} pendentes.
                Autoria de {m.autor}.
              </div>
            </div>
          );
        })}

        <h3>IV. Comunicações e encerramento</h3>
        <p>
          Esgotada a pauta da Ordem do Dia, a presidência declarou {state.status === "encerrada" ? "encerrada" : "em andamento"} a
          presente sessão, convocando os senhores vereadores para a próxima sessão ordinária, na data e horário regimentais.
          Para constar, lavrou-se a presente ata que, lida e aprovada, vai assinada pela Mesa Diretora.
        </p>

        <div className="sig" style={{
          gridTemplateColumns: `repeat(${Math.min(Math.max(cargosPreenchidos.length, 2), 4)}, 1fr)`,
        }}>
          {cargosPreenchidos.length === 0 && (
            <>
              <div className="line">
                <div className="nm">—</div>
                <div className="ro">Presidente</div>
              </div>
              <div className="line">
                <div className="nm">—</div>
                <div className="ro">Secretário</div>
              </div>
            </>
          )}
          {cargosPreenchidos.map(({ cargo, vereador }) => (
            <div className="line" key={cargo.id}>
              <div className="nm">{vereador.nome}</div>
              <div className="ro">{cargo.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ alignSelf: "start", width: 260 }}>
        <div className="card-head">
          <span className="label">Ações</span>
          <span className="title">Documento</span>
        </div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
          <button className="btn ghost" onClick={() => downloadAta(state, config)}>Exportar como .txt</button>
          <button className="btn ghost" onClick={() => exportVotosCSV(state, config)}>Exportar votos (.csv)</button>
          <div className="divider" />
          <div className="field-label">Metadados</div>
          <div className="mono small tab">
            ID: {state.id}<br/>
            Eventos: {state.log.length}<br/>
            Matérias: {state.materias.length}<br/>
            Apreciadas: {apreciadas.length}
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadAta(state, config) {
  const lines = [
    `ATA — ${state.numero}ª Sessão ${state.tipo}`,
    `${config.camara.nomeFormal}`,
    `${config.camara.legislatura} · ${config.camara.sessaoLeg}`,
    `${state.data} · ${state.local || config.camara.plenarioNome}`,
    "",
    "REGISTRO DA SESSÃO:",
    ...state.log.slice().reverse().map(e => `${e.t} — ${e.ev} (${e.who})`),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `ata-${state.id}.txt`; a.click();
}

function exportVotosCSV(state, config) {
  const rows = [["materia_id", "tipo", "titulo", "vereador", "partido", "voto"]];
  state.materias.forEach(m => {
    Object.entries(m.votos || {}).forEach(([vId, voto]) => {
      const v = findVereador(vId, config.vereadores);
      if (!v) return;
      rows.push([m.id, m.tipo, m.titulo, v.nome, v.partido, voto]);
    });
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `votos-${state.id}.csv`; a.click();
}

Object.assign(window, { ArquivoSessoes });
