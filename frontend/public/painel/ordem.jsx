// === Painel de Gerenciamento da Ordem do Dia ===
// Modal acessível pela Mesa Diretora para cadastrar, editar, reordenar e remover matérias

function OrdemDoDiaPanel({ store, onClose }) {
  const { state, config, addMateria, updateMateria, removeMateria, moveMateria } = store;
  const [editingId, setEditingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);

  const editing = state.materias.find(m => m.id === editingId);

  function handleAdd(mat) {
    addMateria(mat);
    setCreating(false);
  }

  function handleEdit(patch) {
    if (!editing) return;
    updateMateria(editing.id, patch);
    setEditingId(null);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel ordem-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">Mesa Diretora · {state.numero}ª Sessão {state.tipo}</div>
            <h2>Ordem do Dia</h2>
            <p>Cadastre, edite e organize as matérias que serão deliberadas. Matérias já em votação ou apreciadas ficam bloqueadas para preservar o histórico.</p>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => { setEditingId(null); setCreating(true); }}>
              + Nova matéria
            </button>
            <button className="modal-close" onClick={onClose} title="Fechar (Esc)">×</button>
          </div>
        </div>

        <div className="modal-body">
          {(creating || editing) && (
            <MateriaForm
              key={editing?.id || "new"}
              tipos={config.tipos}
              vereadores={config.vereadores}
              initial={editing}
              onSubmit={editing ? handleEdit : handleAdd}
              onCancel={() => { setCreating(false); setEditingId(null); }}
            />
          )}

          {!creating && !editing && (
            <>
              <OrdemStats materias={state.materias} />
              <OrdemList
                materias={state.materias}
                tipos={config.tipos}
                onEdit={(id) => setEditingId(id)}
                onRemove={removeMateria}
                onMove={moveMateria}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdemStats({ materias }) {
  const pendentes  = materias.filter(m => m.status === "pendente").length;
  const apreciadas = materias.filter(m => m.status === "aprovada" || m.status === "rejeitada").length;
  const aprovadas  = materias.filter(m => m.status === "aprovada").length;
  const rejeitadas = materias.filter(m => m.status === "rejeitada").length;
  const emVotacao  = materias.filter(m => m.status === "em_votacao").length;

  return (
    <div className="ordem-stats">
      <div className="ordem-stat">
        <span className="v">{materias.length}</span>
        <span className="k">no total</span>
      </div>
      <div className="ordem-stat">
        <span className="v">{pendentes}</span>
        <span className="k">pendentes</span>
      </div>
      {emVotacao > 0 && (
        <div className="ordem-stat live">
          <span className="v">{emVotacao}</span>
          <span className="k">em votação</span>
        </div>
      )}
      <div className="ordem-stat">
        <span className="v">{apreciadas}</span>
        <span className="k">apreciadas</span>
      </div>
      {apreciadas > 0 && (
        <>
          <div className="ordem-stat sim">
            <span className="v">{aprovadas}</span>
            <span className="k">aprovadas</span>
          </div>
          <div className="ordem-stat nao">
            <span className="v">{rejeitadas}</span>
            <span className="k">rejeitadas</span>
          </div>
        </>
      )}
    </div>
  );
}

function OrdemList({ materias, tipos, onEdit, onRemove, onMove }) {
  if (materias.length === 0) {
    return (
      <div className="empty" style={{ padding: 36 }}>
        Nenhuma matéria cadastrada na ordem do dia.<br/>
        Clique em <strong>+ Nova matéria</strong> para incluir a primeira.
      </div>
    );
  }
  return (
    <div className="ordem-list">
      {materias.map((m, i) => {
        const tipo = tipos[m.tipo];
        const isPendente = m.status === "pendente";
        const isFirst = i === 0;
        const isLast  = i === materias.length - 1;
        return (
          <div key={m.id} className={`ordem-item ordem-item-${m.status}`}>
            <div className="ordem-num">
              <span className="serif">{String(m.ordem).padStart(2, "0")}</span>
              <div className="ordem-mv">
                <button className="mvbtn" disabled={!isPendente || isFirst}
                  onClick={() => onMove(m.id, -1)} title="Mover para cima">↑</button>
                <button className="mvbtn" disabled={!isPendente || isLast}
                  onClick={() => onMove(m.id, +1)} title="Mover para baixo">↓</button>
              </div>
            </div>
            <div className="ordem-body">
              <div className="ordem-tags">
                <span className="mono small tag-tipo">{tipo?.sigla || m.tipo}</span>
                <span className="mono small muted">{m.id}</span>
                <StatusPill status={m.status} />
              </div>
              <div className="ordem-ttl">{m.titulo}</div>
              <div className="ordem-ementa">{m.ementa}</div>
              <div className="ordem-meta">
                <span className="small muted">Autoria:</span>
                <span className="small" style={{ fontWeight: 600 }}>{m.autor || "—"}</span>
                {tipo && (
                  <span className="small muted" style={{ marginLeft: "auto" }}>
                    Quórum mín. {tipo.quorumMin} · maioria {tipo.maioria}
                  </span>
                )}
              </div>
            </div>
            <div className="ordem-actions">
              {isPendente ? (
                <>
                  <button className="btn small ghost" onClick={() => onEdit(m.id)}>Editar</button>
                  <button className="btn small ghost danger-ghost"
                    onClick={() => {
                      if (confirm(`Retirar "${m.id}" da ordem do dia?`)) onRemove(m.id);
                    }}>Remover</button>
                </>
              ) : (
                <span className="small muted serif" style={{ fontStyle: "italic" }}>
                  {m.status === "em_votacao" && "em votação"}
                  {m.status === "aprovada" && "deliberada"}
                  {m.status === "rejeitada" && "deliberada"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MateriaForm({ tipos, vereadores, initial, onSubmit, onCancel }) {
  const [tipo, setTipo]       = React.useState(initial?.tipo || "PL");
  const [id, setId]           = React.useState(initial?.id || "");
  const [titulo, setTitulo]   = React.useState(initial?.titulo || "");
  const [autor, setAutor]     = React.useState(initial?.autor || "");
  const [ementa, setEmenta]   = React.useState(initial?.ementa || "");
  const [error, setError]     = React.useState("");

  const isEdit = !!initial;

  function handleSubmit(e) {
    e.preventDefault();
    if (!titulo.trim()) { setError("O título é obrigatório."); return; }
    if (!ementa.trim()) { setError("A ementa é obrigatória."); return; }
    const data = {
      tipo,
      titulo: titulo.trim(),
      autor: autor.trim(),
      ementa: ementa.trim(),
    };
    if (id.trim()) data.id = id.trim();
    onSubmit(data);
  }

  const sugestoesAutor = [
    ...vereadores.map(v => `${v.partido.includes("PT") || v.nome.split(" ")[0].endsWith("a") ? "Verª." : "Ver."} ${v.nome}`),
    "Mesa Diretora",
    "Comissão de Constituição e Justiça",
    "Comissão de Educação, Cultura e Esporte",
    "Comissão de Saúde e Assistência Social",
    "Comissão de Finanças e Orçamento",
    "Executivo Municipal",
  ];

  return (
    <form className="materia-form" onSubmit={handleSubmit}>
      <div className="materia-form-head">
        <h3>{isEdit ? "Editar matéria" : "Nova matéria"}</h3>
        <p className="small muted">
          {isEdit
            ? `Alterações afetam a matéria ${initial.id}. O número e o tipo só podem ser modificados antes da abertura da votação.`
            : "Preencha os campos abaixo. O número será gerado automaticamente se for deixado em branco."}
        </p>
      </div>

      <div className="form-grid">
        <Field label="Tipo de matéria">
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(tipos).map(([k, t]) => (
              <option key={k} value={k}>{t.sigla} — {t.nome}</option>
            ))}
          </select>
        </Field>
        <Field label="Número / identificação" hint="Deixe em branco para numerar automaticamente, ou informe manualmente (ex.: PL-082/2026).">
          <input className="input mono" value={id}
            placeholder={`Ex.: ${tipos[tipo]?.sigla || tipo}-001/${new Date().getFullYear()}`}
            onChange={(e) => setId(e.target.value)} />
        </Field>

        <Field label="Título" full>
          <input className="input" value={titulo}
            placeholder="Título oficial da matéria"
            onChange={(e) => setTitulo(e.target.value)} />
        </Field>

        <Field label="Autoria" full hint="Vereador autor, comissão proponente ou origem (Executivo, Mesa, etc.).">
          <input className="input" value={autor} list="autores-sugeridos"
            placeholder="Autor ou origem"
            onChange={(e) => setAutor(e.target.value)} />
          <datalist id="autores-sugeridos">
            {sugestoesAutor.map(a => <option key={a} value={a} />)}
          </datalist>
        </Field>

        <Field label="Ementa" full hint="Resumo do conteúdo da matéria — aparece no painel da Mesa, no telão e na ata.">
          <textarea className="textarea" rows={4} value={ementa}
            placeholder="Descreva sucintamente o conteúdo da matéria."
            onChange={(e) => setEmenta(e.target.value)} />
        </Field>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="materia-form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn">
          {isEdit ? "Salvar alterações" : "Incluir na ordem do dia"}
        </button>
      </div>
    </form>
  );
}

Object.assign(window, { OrdemDoDiaPanel });
