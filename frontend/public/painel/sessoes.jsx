// === Agenda de Sessões (cadastro e visualização) ===

function AgendaSessoes({ store }) {
  const { config, agendarSessao, updateSessaoAgendada, removeSessaoAgendada, iniciarSessao } = store;
  const agendadas = config.sessoesAgendadas || [];
  const [editingId, setEditingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);

  const editing = agendadas.find(s => s.id === editingId);

  // Particiona: próximas (hoje ou futuro) vs vencidas (passado, ainda não iniciadas)
  const proximas  = agendadas.filter(s => compararComHoje(s.dataIso) >= 0);
  const vencidas  = agendadas.filter(s => compararComHoje(s.dataIso) < 0);

  function handleSave(data) {
    if (editing) {
      updateSessaoAgendada(editing.id, data);
    } else {
      agendarSessao(data);
    }
    setCreating(false);
    setEditingId(null);
  }

  function handleIniciar(s) {
    if (!confirm(
      `Iniciar a ${s.numero}ª Sessão ${s.tipo} (${formatarDataExtenso(s.dataIso)})?\n\n` +
      `Isto substituirá a sessão em andamento. Considere encerrar a sessão atual e gerar a ata antes de prosseguir.`
    )) return;
    iniciarSessao(s.id);
    alert("Sessão iniciada. Acesse a Mesa Diretora para iniciar a deliberação.");
  }

  return (
    <div>
      <div className="agenda-head">
        <div>
          <h2 className="serif" style={{ margin: 0, fontSize: 22, letterSpacing: "-0.01em" }}>Próximas sessões</h2>
          <div className="small muted" style={{ marginTop: 4 }}>
            Sessões agendadas pela Mesa Diretora. Iniciar uma sessão a torna a sessão ativa do sistema.
          </div>
        </div>
        <button className="btn" onClick={() => { setEditingId(null); setCreating(true); }}>
          + Agendar sessão
        </button>
      </div>

      {(creating || editing) && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-head">
            <span className="label">{editing ? "Editar" : "Nova"}</span>
            <span className="title">{editing ? `Editar sessão ${editing.id}` : "Agendar nova sessão"}</span>
          </div>
          <div className="card-body">
            <SessaoForm
              key={editing?.id || "new"}
              initial={editing}
              config={config}
              onSubmit={handleSave}
              onCancel={() => { setCreating(false); setEditingId(null); }}
            />
          </div>
        </div>
      )}

      {agendadas.length === 0 && !creating && (
        <div className="empty" style={{ padding: 36, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
          Nenhuma sessão agendada no momento.<br/>
          Clique em <strong>+ Agendar sessão</strong> para registrar a próxima sessão da Câmara.
        </div>
      )}

      {vencidas.length > 0 && (
        <>
          <div className="agenda-sec-head">
            <span className="upper tracked tiny muted">Atenção · datas vencidas sem início</span>
          </div>
          {vencidas.map(s => (
            <SessaoCard key={s.id} sessao={s} vencida
              onEdit={() => { setCreating(false); setEditingId(s.id); }}
              onRemove={() => {
                if (confirm(`Remover a agenda de "${s.numero}ª ${s.tipo}"?`)) removeSessaoAgendada(s.id);
              }}
              onIniciar={() => handleIniciar(s)} />
          ))}
        </>
      )}

      {proximas.length > 0 && (
        <>
          {vencidas.length > 0 && (
            <div className="agenda-sec-head">
              <span className="upper tracked tiny muted">Próximas</span>
            </div>
          )}
          {proximas.map(s => (
            <SessaoCard key={s.id} sessao={s}
              onEdit={() => { setCreating(false); setEditingId(s.id); }}
              onRemove={() => {
                if (confirm(`Remover a agenda de "${s.numero}ª ${s.tipo}"?`)) removeSessaoAgendada(s.id);
              }}
              onIniciar={() => handleIniciar(s)} />
          ))}
        </>
      )}
    </div>
  );
}

function SessaoCard({ sessao, vencida, onEdit, onRemove, onIniciar }) {
  const dataExt = formatarDataExtenso(sessao.dataIso);
  const diaSem  = formatarDiaSemana(sessao.dataIso);
  const isToday = compararComHoje(sessao.dataIso) === 0;

  const tipoClass = sessao.tipo.toLowerCase().replace(/[^a-z]/g, "");

  return (
    <div className={`sessao-card sessao-${tipoClass} ${isToday ? "is-today" : ""} ${vencida ? "vencida" : ""}`}>
      <div className="sessao-date">
        <div className="sessao-dia">{sessao.dataIso.slice(8, 10)}</div>
        <div className="sessao-mes">{MESES_EXTENSO[parseInt(sessao.dataIso.slice(5, 7), 10) - 1]?.slice(0, 3).toUpperCase()}</div>
        <div className="sessao-ano">{sessao.dataIso.slice(0, 4)}</div>
      </div>
      <div className="sessao-body">
        <div className="sessao-meta">
          <span className={`tipo-badge tipo-${tipoClass}`}>{sessao.tipo}</span>
          <span className="mono small muted">{sessao.id}</span>
          {isToday && <span className="pill live"><span className="dot" />Hoje</span>}
        </div>
        <div className="sessao-ttl">{sessao.numero}ª Sessão {sessao.tipo}</div>
        <div className="sessao-when">
          {diaSem} · {dataExt} · às {sessao.hora}
        </div>
        {sessao.local && <div className="sessao-local">📍 {sessao.local}</div>}
        {sessao.pauta && (
          <div className="sessao-pauta">
            <div className="sessao-pauta-lbl">Pauta prevista</div>
            <div className="sessao-pauta-txt">{sessao.pauta}</div>
          </div>
        )}
        {sessao.observacoes && (
          <div className="sessao-obs">
            <strong>Obs.:</strong> {sessao.observacoes}
          </div>
        )}
      </div>
      <div className="sessao-actions">
        <button className="btn small" onClick={onIniciar}>Iniciar agora</button>
        <button className="btn small ghost" onClick={onEdit}>Editar</button>
        <button className="btn small ghost danger-ghost" onClick={onRemove}>Cancelar</button>
      </div>
    </div>
  );
}

function SessaoForm({ initial, config, onSubmit, onCancel }) {
  const [tipo, setTipo]               = React.useState(initial?.tipo || "Ordinária");
  const [numero, setNumero]           = React.useState(initial?.numero || "");
  const [dataIso, setDataIso]         = React.useState(initial?.dataIso || nextSessionDate(config));
  const [hora, setHora]               = React.useState(initial?.hora || config.camara.horarioPadrao || "14:00");
  const [local, setLocal]             = React.useState(initial?.local || config.camara.plenarioNome || "");
  const [pauta, setPauta]             = React.useState(initial?.pauta || "");
  const [observacoes, setObservacoes] = React.useState(initial?.observacoes || "");
  const [error, setError]             = React.useState("");

  function submit(e) {
    e.preventDefault();
    if (!dataIso) { setError("Informe a data da sessão."); return; }
    if (!hora) { setError("Informe o horário."); return; }
    const data = {
      tipo,
      dataIso, hora,
      local: local.trim(),
      pauta: pauta.trim(),
      observacoes: observacoes.trim(),
    };
    if (numero) data.numero = parseInt(numero, 10);
    onSubmit(data);
  }

  const diaSem = dataIso ? formatarDiaSemana(dataIso) : "";

  return (
    <form className="materia-form" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Tipo de sessão">
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option>Ordinária</option>
            <option>Extraordinária</option>
            <option>Solene</option>
            <option>Audiência Pública</option>
            <option>Especial</option>
            <option>Permanente</option>
          </select>
        </Field>
        <Field label="Número da sessão" hint="Em branco para numerar automaticamente.">
          <input className="input tab" type="number" min="1" value={numero}
            placeholder="Ex.: 19"
            onChange={(e) => setNumero(e.target.value)} />
        </Field>

        <Field label="Data">
          <input className="input" type="date" value={dataIso}
            onChange={(e) => setDataIso(e.target.value)} />
          {diaSem && <div className="small muted" style={{ marginTop: 4 }}>{diaSem}</div>}
        </Field>
        <Field label="Horário de início">
          <input className="input" type="time" value={hora}
            onChange={(e) => setHora(e.target.value)} />
        </Field>

        <Field label="Local" full>
          <input className="input" value={local}
            placeholder="Plenário, salão, etc."
            onChange={(e) => setLocal(e.target.value)} />
        </Field>

        <Field label="Pauta prevista / Ordem do Dia" full
          hint="Resumo dos temas a serem deliberados. Pode ser atualizado posteriormente na Ordem do Dia da Mesa.">
          <textarea className="textarea" rows={4} value={pauta}
            placeholder="Ex.: Discussão do PL 008/2026; primeiro turno da PEC 002/2026; moção de aplausos."
            onChange={(e) => setPauta(e.target.value)} />
        </Field>

        <Field label="Observações" full hint="Convocação extraordinária, instrução prévia, audiência pública, etc.">
          <input className="input" value={observacoes}
            placeholder="Informações complementares (opcional)"
            onChange={(e) => setObservacoes(e.target.value)} />
        </Field>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="materia-form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn">
          {initial ? "Salvar alterações" : "Agendar sessão"}
        </button>
      </div>
    </form>
  );
}

// Sugere a próxima data: próximo dia da semana padrão da Câmara, contado a partir de amanhã
function nextSessionDate(config) {
  const diaPadrao = config?.camara?.diaSemana || "Quinta-feira";
  const idx = DIAS_SEMANA_EXTENSO.indexOf(diaPadrao);
  if (idx < 0) return new Date().toISOString().slice(0, 10);
  const today = new Date();
  // procura próxima ocorrência, mínimo amanhã
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === idx) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
}

Object.assign(window, { AgendaSessoes, SessaoCard, SessaoForm });
