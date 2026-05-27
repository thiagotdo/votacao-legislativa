// === Área Administrativa ===

function Administracao({ store }) {
  const [tab, setTab] = React.useState(() => localStorage.getItem("admin_tab") || "identidade");
  React.useEffect(() => { localStorage.setItem("admin_tab", tab); }, [tab]);

  const sections = [
    { id: "identidade", label: "Identidade da Câmara", desc: "Município, legislatura, brasão, endereço, plenário." },
    { id: "vereadores", label: "Vereadores",            desc: "Cadastro, partido, identificação." },
    { id: "mesa",       label: "Mesa Diretora",         desc: "Presidência, vice, secretarias." },
    { id: "tipos",      label: "Tipos de Matéria",      desc: "Siglas, quórum, regra de maioria." },
    { id: "regimento",  label: "Regimento Interno",     desc: "Regras de votação, abstenção, tempo." },
    { id: "sistema",    label: "Sistema",               desc: "Backup, importação, restauração." },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-side">
        <div className="ttl">Configurações</div>
        {sections.map((s, i) => (
          <button key={s.id} className={tab === s.id ? "active" : ""} onClick={() => setTab(s.id)}>
            <span className="ix">{String(i + 1).padStart(2, '0')}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </aside>
      <div>
        {tab === "identidade" && <SecaoIdentidade store={store} />}
        {tab === "vereadores" && <SecaoVereadores store={store} />}
        {tab === "mesa"       && <SecaoMesa       store={store} />}
        {tab === "tipos"      && <SecaoTipos      store={store} />}
        {tab === "regimento"  && <SecaoRegimento  store={store} />}
        {tab === "sistema"    && <SecaoSistema    store={store} />}
      </div>
    </div>
  );
}

// === Helpers ===
function Field({ label, hint, children, full, third }) {
  return (
    <div className={full ? "full" : third ? "third" : ""}>
      <label className="field-label">{label}</label>
      {children}
      {hint && <div className="small muted" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function setCamaraField(store, key, value) {
  store.setConfig(c => ({ ...c, camara: { ...c.camara, [key]: value } }));
}

// ───────────────────────────────────────────
// 1) Identidade
// ───────────────────────────────────────────
function BrasaoUploader({ value, onChange }) {
  const inputRef = React.useRef(null);
  const [error, setError] = React.useState("");

  function handleFile(file) {
    setError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) {
      setError("Formato inválido. Use PNG, JPG ou SVG.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Arquivo muito grande. Use uma imagem com no máximo 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.onerror = () => setError("Não foi possível ler o arquivo.");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="brasao-upload">
        <div className={`preview ${value ? "has-img" : ""}`}>
          {value
            ? <img src={value} alt="Brasão" />
            : <span className="empty-glyph">Sem<br/>brasão</span>}
        </div>
        <div className="controls">
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={() => inputRef.current?.click()}>
              {value ? "Trocar imagem" : "Enviar imagem…"}
            </button>
            {value && (
              <button className="btn ghost" onClick={() => onChange(null)}>
                Remover
              </button>
            )}
          </div>
          <div className="small muted">
            Formatos aceitos: PNG, JPG ou SVG.<br/>
            Recomendado: 200×200 px ou maior.<br/>
            Fundo transparente (PNG) fica melhor.
          </div>
          {error && <div className="small" style={{ color: "var(--nao-text)" }}>{error}</div>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

function SecaoIdentidade({ store }) {
  const { config } = store;
  const c = config.camara;
  const colors = ["#2f6bd1", "#1f8a5b", "#7c3aed", "#0d9488", "#475569", "#dc2626"];
  const fontSizes = [
    { v: "compacta", l: "Compacta", d: "13 px — mais densidade, ideal para telas menores." },
    { v: "padrao",   l: "Padrão",   d: "14 px — equilíbrio recomendado." },
    { v: "ampla",    l: "Ampla",    d: "15 px — leitura confortável." },
    { v: "extra",    l: "Extra grande", d: "16 px — máxima legibilidade." },
  ];

  return (
    <div className="admin-section">
      <div className="head">
        <div className="lhs">
          <h2>Identidade da Câmara</h2>
          <p>Dados institucionais usados em cabeçalhos, telão, atas e relatórios oficiais. Todos os campos são livres para refletir a realidade do seu município.</p>
        </div>
        <span className="pill open"><span className="dot" />Salvamento automático</span>
      </div>
      <div className="body">
        <div className="form-grid">
          <Field label="Nome formal da Câmara" full>
            <input className="input" value={c.nomeFormal}
              onChange={e => setCamaraField(store, "nomeFormal", e.target.value)} />
          </Field>
          <Field label="Município">
            <input className="input" value={c.municipio}
              onChange={e => setCamaraField(store, "municipio", e.target.value)} />
          </Field>
          <Field label="Estado (UF)">
            <input className="input" value={c.estado} maxLength={2}
              style={{ textTransform: "uppercase" }}
              onChange={e => setCamaraField(store, "estado", e.target.value.toUpperCase())} />
          </Field>
          <Field label="Legislatura">
            <input className="input" value={c.legislatura}
              onChange={e => setCamaraField(store, "legislatura", e.target.value)} />
          </Field>
          <Field label="Sessão Legislativa">
            <input className="input" value={c.sessaoLeg}
              onChange={e => setCamaraField(store, "sessaoLeg", e.target.value)} />
          </Field>
          <Field label="Biênio da Mesa Diretora">
            <input className="input" value={c.biennio}
              onChange={e => setCamaraField(store, "biennio", e.target.value)} />
          </Field>
          <Field label="CNPJ">
            <input className="input" value={c.cnpj}
              onChange={e => setCamaraField(store, "cnpj", e.target.value)} />
          </Field>
          <Field label="Endereço — linha 1" full>
            <input className="input" value={c.enderecoLinha1}
              onChange={e => setCamaraField(store, "enderecoLinha1", e.target.value)} />
          </Field>
          <Field label="Endereço — linha 2" full>
            <input className="input" value={c.enderecoLinha2}
              onChange={e => setCamaraField(store, "enderecoLinha2", e.target.value)} />
          </Field>
          <Field label="Site oficial">
            <input className="input" value={c.siteOficial}
              onChange={e => setCamaraField(store, "siteOficial", e.target.value)} />
          </Field>
          <Field label="Nome do plenário">
            <input className="input" value={c.plenarioNome}
              onChange={e => setCamaraField(store, "plenarioNome", e.target.value)} />
          </Field>
          <Field label="Dia da semana padrão das sessões">
            <input className="input" value={c.diaSemana}
              onChange={e => setCamaraField(store, "diaSemana", e.target.value)} />
          </Field>
          <Field label="Horário padrão de início">
            <input className="input" value={c.horarioPadrao}
              onChange={e => setCamaraField(store, "horarioPadrao", e.target.value)} />
          </Field>

          <Field label="Brasão / Logotipo da Câmara" full
            hint="Imagem exibida no cabeçalho do sistema. Se nenhuma imagem for enviada, é utilizado um brasão geométrico padrão na cor institucional.">
            <BrasaoUploader value={c.brasao} onChange={(v) => setCamaraField(store, "brasao", v)} />
          </Field>

          <Field label="Cor institucional" full
            hint="Cor de destaque usada no brasão geométrico padrão, marcadores de quórum, separadores e elementos hierárquicos no telão.">
            <div className="swatch-pick">
              {colors.map(col => (
                <button key={col} className={c.corInstitucional === col ? "on" : ""}
                  style={{ background: col }}
                  onClick={() => setCamaraField(store, "corInstitucional", col)}
                  title={col} />
              ))}
              <input type="color" value={c.corInstitucional}
                onChange={e => setCamaraField(store, "corInstitucional", e.target.value)}
                style={{ width: 32, height: 32, padding: 0, border: "2px solid var(--line)", borderRadius: "var(--radius-sm)" }} />
            </div>
          </Field>

          <Field label="Tamanho da fonte do sistema" full
            hint="Aplica-se a todas as visões — Mesa Diretora, Painel do Vereador, Telão, Arquivo e Administração.">
            <div className="admin-radio-group">
              {fontSizes.map(o => (
                <div key={o.v} className={`admin-radio ${(c.tamanhoFonte || "padrao") === o.v ? "on" : ""}`}
                  onClick={() => setCamaraField(store, "tamanhoFonte", o.v)}>
                  <span className="l">{o.l}</span>
                  <span className="s">{o.d}</span>
                </div>
              ))}
            </div>
          </Field>

        </div>

        <div className="divider" />
        <div className="admin-card">
          <div className="ttl">Pré-visualização do cabeçalho</div>
          <div className="small muted" style={{ marginBottom: 10 }}>
            Como o nome da Câmara aparecerá no topo de cada visão e no telão público.
          </div>
          <div style={{
            background: "var(--surface)", color: "var(--ink)",
            padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
            border: "1px solid var(--line)", borderRadius: "var(--radius)",
          }}>
            <Brasao src={c.brasao} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 600 }}>
                {c.nomeFormal}
              </span>
              <span className="upper tracked" style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
                {c.legislatura} · {c.sessaoLeg} · Sistema de Votação
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// 2) Vereadores
// ───────────────────────────────────────────
function FotoUploader({ vereador, onUpload, onRemove }) {
  const inputRef = React.useRef(null);
  return (
    <div className="foto-uploader">
      <button type="button" className="foto-thumb"
        onClick={() => inputRef.current?.click()}
        title={vereador.foto ? "Trocar foto" : "Enviar foto"}>
        <VereadorAvatar vereador={vereador} size={40} />
        <span className="foto-overlay">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </span>
      </button>
      {vereador.foto && (
        <button type="button" className="foto-remove" onClick={onRemove} title="Remover foto">×</button>
      )}
      <input ref={inputRef} type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

function SecaoVereadores({ store }) {
  const { config, setConfig } = store;
  const [showSenha, setShowSenha] = React.useState({});

  function updateVereador(id, patch) {
    setConfig(c => ({
      ...c,
      vereadores: c.vereadores.map(v => v.id === id ? { ...v, ...patch } : v),
    }));
  }
  function removeVereador(id) {
    if (!confirm("Remover este vereador? Os votos já registrados em sessão permanecerão no histórico.")) return;
    setConfig(c => ({ ...c, vereadores: c.vereadores.filter(v => v.id !== id) }));
  }
  function addVereador() {
    setConfig(c => {
      const nums = c.vereadores.map(v => parseInt(v.id.replace(/\D/g, ""), 10)).filter(Number.isFinite);
      const next = (Math.max(0, ...nums) + 1).toString().padStart(2, "0");
      const id = `v${next}`;
      return {
        ...c,
        vereadores: [...c.vereadores, {
          id, nome: "Novo vereador", partido: "—",
          usuario: id, senha: "1234",
        }],
      };
    });
  }
  function gerarSenha(id) {
    const senha = Math.floor(1000 + Math.random() * 9000).toString();
    updateVereador(id, { senha });
    setShowSenha(s => ({ ...s, [id]: true }));
  }

  function uploadFoto(id, file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { alert("Selecione um arquivo de imagem."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2 MB)."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      // Redimensiona para 256x256 (square crop) para economizar localStorage
      const img = new Image();
      img.onload = () => {
        const SIZE = 256;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        // crop quadrado centralizado
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width  - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        updateVereador(id, { foto: dataUrl });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="admin-section">
      <div className="head">
        <div className="lhs">
          <h2>Vereadores</h2>
          <p>Cadastro de parlamentares e credenciais de acesso ao painel individual. Cada vereador faz login independentemente com seu usuário e senha.</p>
        </div>
        <button className="btn" onClick={addVereador}>+ Adicionar vereador</button>
      </div>
      <div className="body" style={{ padding: 0 }}>
        <div className="admin-table-scroll">
        <table className="admin-table vereadores-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>Foto</th>
              <th style={{ width: 50 }}>ID</th>
              <th style={{ minWidth: 200 }}>Nome</th>
              <th style={{ width: 100 }}>Partido</th>
              <th style={{ width: 70 }}>Cargo</th>
              <th style={{ width: 150 }}>Usuário</th>
              <th style={{ width: 150 }}>Senha</th>
              <th style={{ width: 90, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {config.vereadores.map(v => {
              const role = papelMesa(v.id, config);
              const visible = !!showSenha[v.id];
              return (
                <tr key={v.id}>
                  <td>
                    <FotoUploader vereador={v}
                      onUpload={(file) => uploadFoto(v.id, file)}
                      onRemove={() => updateVereador(v.id, { foto: null })} />
                  </td>
                  <td className="id-cell">{v.id}</td>
                  <td>
                    <input className="input" value={v.nome}
                      onChange={e => updateVereador(v.id, { nome: e.target.value })} />
                  </td>
                  <td>
                    <input className="input" value={v.partido}
                      onChange={e => updateVereador(v.id, { partido: e.target.value })} />
                  </td>
                  <td>
                    {role ? (
                      <span style={{
                        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: "var(--brasao)", fontWeight: 700,
                      }}>{papelAbrev(role)}</span>
                    ) : (
                      <span className="small muted">—</span>
                    )}
                  </td>
                  <td>
                    <input className="input mono" style={{ fontSize: 12 }} value={v.usuario || ""}
                      placeholder={v.id}
                      onChange={e => updateVereador(v.id, { usuario: e.target.value })} />
                  </td>
                  <td>
                    <div className="senha-cell">
                      <input className="input mono" style={{ fontSize: 12 }}
                        type={visible ? "text" : "password"}
                        value={v.senha || ""}
                        onChange={e => updateVereador(v.id, { senha: e.target.value })} />
                      <button className="senha-icon" type="button"
                        onClick={() => setShowSenha(s => ({ ...s, [v.id]: !visible }))}
                        title={visible ? "Ocultar" : "Mostrar"}>
                        {visible ? "🙈" : "👁"}
                      </button>
                      <button className="senha-icon" type="button"
                        onClick={() => gerarSenha(v.id)}
                        title="Gerar nova senha aleatória">⟳</button>
                    </div>
                  </td>
                  <td className="actions">
                    <button className="btn small ghost" onClick={() => removeVereador(v.id)}>Remover</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {config.vereadores.length === 0 && (
          <div className="empty" style={{ padding: 28 }}>Nenhum vereador cadastrado. Adicione o primeiro acima.</div>
        )}
        </div>
        <div className="admin-card" style={{ margin: 22, marginTop: 18 }}>
          <div className="ttl">Como funciona o login</div>
          <div className="small muted" style={{ lineHeight: 1.6 }}>
            Cada vereador acessa o <strong>Painel do Vereador</strong> com seu próprio usuário e senha — ideal para terminais de votação compartilhados ou tablets individuais.
            A senha padrão para novos cadastros é <span className="mono">1234</span> — recomenda-se que seja alterada no primeiro acesso, ou que a Mesa Diretora gere senhas aleatórias clicando no ícone <span className="mono">⟳</span>.
            Os dados são armazenados localmente no navegador onde o sistema está instalado.
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// 3) Mesa Diretora — lista configurável de cargos
// ───────────────────────────────────────────
function SecaoMesa({ store }) {
  const { config, setConfig } = store;
  const mesa = config.mesa || [];

  function updateCargo(idx, patch) {
    setConfig(c => ({
      ...c,
      mesa: c.mesa.map((cargo, i) => i === idx ? { ...cargo, ...patch } : cargo),
    }));
  }
  function moveCargo(idx, dir) {
    setConfig(c => {
      const arr = [...c.mesa];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return c;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...c, mesa: arr };
    });
  }
  function removeCargo(idx) {
    const cargo = mesa[idx];
    if (!confirm(`Remover o cargo "${cargo.label}" da Mesa Diretora?`)) return;
    setConfig(c => ({ ...c, mesa: c.mesa.filter((_, i) => i !== idx) }));
  }
  function addCargo(template) {
    const t = template || { label: "Novo cargo", abrev: "CARGO", desc: "" };
    setConfig(c => {
      // gera id estável a partir do label
      const baseId = (t.label || "cargo").toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 16) || "cargo";
      let id = baseId, n = 2;
      while ((c.mesa || []).some(x => x.id === id)) id = `${baseId}${n++}`;
      return {
        ...c,
        mesa: [...(c.mesa || []), { id, label: t.label, abrev: t.abrev, desc: t.desc || "", vereadorId: null }],
      };
    });
  }

  const sugestoes = [
    { label: "3º Secretário",     abrev: "3º SEC", desc: "Auxilia os demais secretários." },
    { label: "4º Secretário",     abrev: "4º SEC", desc: "Auxilia os demais secretários." },
    { label: "Corregedor",        abrev: "COR",    desc: "Zela pelo decoro parlamentar." },
    { label: "Ouvidor",           abrev: "OUV",    desc: "Recebe e encaminha demandas da população." },
    { label: "Líder de Bancada",  abrev: "LID",    desc: "Representa sua bancada na Mesa." },
    { label: "Líder da Maioria",  abrev: "LMA",    desc: "Representa a maioria parlamentar." },
    { label: "Líder da Minoria",  abrev: "LMI",    desc: "Representa a minoria parlamentar." },
  ];

  return (
    <div className="admin-section">
      <div className="head">
        <div className="lhs">
          <h2>Mesa Diretora</h2>
          <p>Composição da Mesa para o biênio {config.camara.biennio}. Adicione, renomeie e reordene cargos conforme o regimento da sua Câmara — todos aparecem no painel de presença, no telão e nas assinaturas da ata.</p>
        </div>
        <button className="btn" onClick={() => addCargo()}>+ Adicionar cargo</button>
      </div>
      <div className="body">
        {mesa.length === 0 && (
          <div className="empty" style={{ padding: 22 }}>Nenhum cargo cadastrado. Adicione o primeiro acima.</div>
        )}
        <div className="stack" style={{ gap: 10 }}>
          {mesa.map((cargo, i) => {
            const vereador = findVereador(cargo.vereadorId, config.vereadores);
            return (
              <div key={cargo.id} className="cargo-row">
                <div className="cargo-order">
                  <span className="mono small muted">{String(i + 1).padStart(2, '0')}</span>
                  <div className="row" style={{ gap: 2, marginTop: 4 }}>
                    <button className="btn small ghost mvbtn" onClick={() => moveCargo(i, -1)} disabled={i === 0} title="Mover para cima">↑</button>
                    <button className="btn small ghost mvbtn" onClick={() => moveCargo(i, +1)} disabled={i === mesa.length - 1} title="Mover para baixo">↓</button>
                  </div>
                </div>
                <div className="cargo-fields">
                  <div className="form-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
                    <Field label="Denominação do cargo">
                      <input className="input" value={cargo.label}
                        onChange={e => updateCargo(i, { label: e.target.value })} />
                    </Field>
                    <Field label="Abreviação (telão)">
                      <input className="input" value={cargo.abrev}
                        onChange={e => updateCargo(i, { abrev: e.target.value })}
                        maxLength={8} />
                    </Field>
                    <Field label="Vereador titular" full>
                      <select className="select" value={cargo.vereadorId || ""}
                        onChange={e => updateCargo(i, { vereadorId: e.target.value || null })}>
                        <option value="">— vago —</option>
                        {config.vereadores.map(v => (
                          <option key={v.id} value={v.id}>{v.nome} ({v.partido})</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Descrição / atribuições" full>
                      <textarea className="textarea" rows={2} value={cargo.desc || ""}
                        onChange={e => updateCargo(i, { desc: e.target.value })} />
                    </Field>
                  </div>
                </div>
                <div className="cargo-actions">
                  {vereador ? (
                    <div className="cargo-occupant">
                      <VereadorAvatar vereador={vereador} size={44} />
                      <div>
                        <div className="serif" style={{ fontWeight: 600, fontSize: 13 }}>{vereador.nome.split(" ").slice(0,2).join(" ")}</div>
                        <div className="mono tiny muted">{vereador.partido}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="small muted serif" style={{ fontStyle: "italic" }}>cargo vago</div>
                  )}
                  <button className="btn small ghost" onClick={() => removeCargo(i)}>Remover cargo</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="divider" />
        <div className="admin-card">
          <div className="ttl">Sugestões de cargos</div>
          <div className="small muted" style={{ marginBottom: 10 }}>
            Estruturas comuns em câmaras municipais — clique para adicionar à Mesa.
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            {sugestoes.map(s => {
              const already = mesa.some(c => c.label === s.label);
              return (
                <button key={s.label}
                  className="btn small ghost"
                  disabled={already}
                  onClick={() => addCargo(s)}
                  title={already ? "Já adicionado" : s.desc}>
                  + {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div className="admin-card">
          <div className="ttl">Composição atual</div>
          <div className="small muted" style={{ marginBottom: 12 }}>
            Síntese da Mesa Diretora — esta é a ordem usada nas assinaturas da ata.
          </div>
          <table className="admin-table" style={{ marginTop: 4 }}>
            <tbody>
              {mesa.map(cargo => {
                const v = findVereador(cargo.vereadorId, config.vereadores);
                return (
                  <tr key={cargo.id}>
                    <td style={{ width: 200, fontWeight: 600 }}>{cargo.label}</td>
                    <td>{v ? `${v.nome} (${v.partido})` : <span className="muted">— vago —</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// 4) Tipos de Matéria
// ───────────────────────────────────────────
function SecaoTipos({ store }) {
  const { config, setConfig } = store;
  const maioriaOpts = [
    { v: "simples",     l: "Maioria simples",     d: "> presentes/2" },
    { v: "absoluta",    l: "Maioria absoluta",    d: "> total/2" },
    { v: "qualificada", l: "Maioria qualificada", d: "≥ 2/3 do total" },
  ];

  function updateTipo(k, patch) {
    setConfig(c => ({ ...c, tipos: { ...c.tipos, [k]: { ...c.tipos[k], ...patch } } }));
  }
  function removeTipo(k) {
    if (!confirm(`Remover o tipo "${k}"? Matérias já cadastradas com este tipo continuarão existindo.`)) return;
    setConfig(c => {
      const t = { ...c.tipos }; delete t[k]; return { ...c, tipos: t };
    });
  }
  function addTipo() {
    const k = prompt("Sigla do novo tipo (ex.: SUB):");
    if (!k) return;
    const key = k.toUpperCase().trim();
    if (config.tipos[key]) { alert("Tipo já existe."); return; }
    setConfig(c => ({
      ...c,
      tipos: { ...c.tipos, [key]: { sigla: key, nome: "Novo tipo", quorumMin: 7, maioria: "simples" } },
    }));
  }

  return (
    <div className="admin-section">
      <div className="head">
        <div className="lhs">
          <h2>Tipos de Matéria</h2>
          <p>Cada tipo legislativo (PL, PLC, PEC, REQ, etc.) define seu próprio quórum mínimo e regra de maioria. As regras alimentam a verificação automática feita pelo console de votação.</p>
        </div>
        <button className="btn" onClick={addTipo}>+ Novo tipo</button>
      </div>
      <div className="body" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Sigla</th>
              <th>Denominação</th>
              <th style={{ width: 130 }}>Quórum mín.</th>
              <th style={{ width: 220 }}>Regra de maioria</th>
              <th style={{ width: 100, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(config.tipos).map(([k, t]) => (
              <tr key={k}>
                <td className="id-cell" style={{ fontWeight: 600 }}>{t.sigla}</td>
                <td>
                  <input className="input" value={t.nome}
                    onChange={e => updateTipo(k, { nome: e.target.value })} />
                </td>
                <td>
                  <input className="input tab" type="number" min="1" max="50" value={t.quorumMin}
                    onChange={e => updateTipo(k, { quorumMin: parseInt(e.target.value, 10) || 1 })} />
                </td>
                <td>
                  <select className="select" value={t.maioria}
                    onChange={e => updateTipo(k, { maioria: e.target.value })}>
                    {maioriaOpts.map(o => (
                      <option key={o.v} value={o.v}>{o.l} — {o.d}</option>
                    ))}
                  </select>
                </td>
                <td className="actions">
                  <button className="btn small ghost" onClick={() => removeTipo(k)}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// 5) Regimento
// ───────────────────────────────────────────
function SecaoRegimento({ store }) {
  const { config, setConfig } = store;
  const r = config.regimento;

  function setReg(key, val) {
    setConfig(c => ({ ...c, regimento: { ...c.regimento, [key]: val } }));
  }

  return (
    <div className="admin-section">
      <div className="head">
        <div className="lhs">
          <h2>Regimento Interno</h2>
          <p>Parâmetros que regem o funcionamento da sessão: quórum, modalidades de votação, abstenção e tempo. Ajustes refletem em todos os painéis.</p>
        </div>
      </div>
      <div className="body">
        <div className="form-grid">
          <Field label="Quórum mínimo para abertura" hint={`Total de ${config.vereadores.length} vereadores cadastrados.`}>
            <input className="input tab" type="number" min="1" max={config.vereadores.length}
              value={r.quorumAbertura}
              onChange={e => setReg("quorumAbertura", parseInt(e.target.value, 10) || 1)} />
          </Field>
          <Field label="Quórum mínimo para deliberação" hint="Mínimo de vereadores presentes para que uma matéria possa ser votada.">
            <input className="input tab" type="number" min="1" max={config.vereadores.length}
              value={r.quorumDeliberacao}
              onChange={e => setReg("quorumDeliberacao", parseInt(e.target.value, 10) || 1)} />
          </Field>

          <Field label="Modalidade padrão de votação" full
            hint="Pode ser sobreposta caso a caso pela presidência ao abrir a votação.">
            <div className="admin-radio-group">
              {[
                { v: "nominal",   l: "Nominal",    d: "Voto identificado e exibido publicamente." },
                { v: "simbolica", l: "Simbólica",  d: "Apenas o tally agregado é registrado." },
                { v: "secreta",   l: "Secreta",    d: "Voto registrado anônimo (urna)." },
              ].map(o => (
                <div key={o.v} className={`admin-radio ${r.votacaoPadrao === o.v ? "on" : ""}`}
                  onClick={() => setReg("votacaoPadrao", o.v)}>
                  <span className="l">{o.l}</span>
                  <span className="s">{o.d}</span>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Contagem de maioria" full>
            <div className="admin-radio-group">
              {[
                { v: "presentes", l: "Sobre presentes",  d: "Maioria calculada em função dos presentes." },
                { v: "votantes",  l: "Sobre votantes",   d: "Abstenções e ausências excluídas da base." },
              ].map(o => (
                <div key={o.v} className={`admin-radio ${r.contagemMaioria === o.v ? "on" : ""}`}
                  onClick={() => setReg("contagemMaioria", o.v)}>
                  <span className="l">{o.l}</span>
                  <span className="s">{o.d}</span>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Tempo limite por votação (segundos)" hint="Use 0 para permitir tempo indeterminado.">
            <input className="input tab" type="number" min="0" max="600"
              value={r.tempoLimite}
              onChange={e => setReg("tempoLimite", parseInt(e.target.value, 10) || 0)} />
          </Field>
          <Field label="Total de vereadores">
            <input className="input tab" value={config.vereadores.length} readOnly
              style={{ background: "var(--paper-2)", color: "#6c6553" }} />
          </Field>

          <Field label="Comportamentos" full>
            <div className="stack" style={{ gap: 10 }}>
              <TogglePill on={r.permitirAbstencao}    onChange={v => setReg("permitirAbstencao", v)}
                label="Permitir abstenção"
                desc="Quando desligado, o painel do vereador exibe apenas Sim e Não." />
              <TogglePill on={r.permitirAlterarVoto}  onChange={v => setReg("permitirAlterarVoto", v)}
                label="Permitir alterar voto"
                desc="Vereador pode mudar o próprio voto enquanto a votação estiver aberta." />
              <TogglePill on={r.presidenteVotaSempre} onChange={v => setReg("presidenteVotaSempre", v)}
                label="Presidente vota em todas as matérias"
                desc="Por padrão, o presidente vota apenas para desempate." />
              <TogglePill on={r.presidenteDesempata}  onChange={v => setReg("presidenteDesempata", v)}
                label="Presidente desempata"
                desc="Voto de qualidade nos casos de empate." />
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

function TogglePill({ on, onChange, label, desc }) {
  return (
    <div className={`dot-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}>
      <span className="box" />
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        {desc && <div className="small muted">{desc}</div>}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// 6) Sistema
// ───────────────────────────────────────────
function SecaoSistema({ store }) {
  const { config, setConfig, state, resetSession, resetConfig } = store;
  const fileRef = React.useRef(null);

  function exportarConfig() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `camara-config-${config.camara.municipio.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
  }
  function exportarTudo() {
    const data = { config, sessao: state, exportadoEm: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `camara-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }
  function importar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.config && data.sessao) {
          if (!confirm("Substituir a configuração e a sessão atuais pelos dados do arquivo?")) return;
          setConfig(data.config);
          store.setState(data.sessao);
        } else if (data.camara || data.vereadores) {
          if (!confirm("Substituir somente a configuração da Câmara?")) return;
          setConfig(data);
        } else {
          alert("Arquivo não reconhecido.");
        }
      } catch (err) {
        alert("Não foi possível ler o arquivo: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="admin-section">
      <div className="head">
        <div className="lhs">
          <h2>Sistema</h2>
          <p>Backup, importação e restauração de dados. Tudo é armazenado localmente — use a exportação para migrar entre máquinas ou para guardar versões.</p>
        </div>
      </div>
      <div className="body">
        <div className="admin-card">
          <div className="ttl">Backup e exportação</div>
          <div className="small muted" style={{ marginBottom: 12 }}>
            Exporte sua configuração ou o estado completo (configuração + sessão em andamento) como JSON.
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="btn" onClick={exportarConfig}>Exportar configuração</button>
            <button className="btn ghost" onClick={exportarTudo}>Exportar backup completo</button>
            <button className="btn ghost" onClick={() => fileRef.current?.click()}>Importar arquivo…</button>
            <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={importar} />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div className="admin-card">
          <div className="ttl">Estado atual</div>
          <table className="admin-table">
            <tbody>
              <tr><td style={{ width: 220, fontWeight: 600 }}>Vereadores cadastrados</td><td className="tab mono">{config.vereadores.length}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Tipos de matéria</td><td className="tab mono">{Object.keys(config.tipos).length}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Sessão em curso</td><td className="tab mono">{state.id} · {state.status}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Matérias na sessão</td><td className="tab mono">{state.materias.length}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Eventos registrados</td><td className="tab mono">{state.log.length}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Chave de armazenamento (sessão)</td><td className="mono small">{SESSION_KEY}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Chave de armazenamento (config)</td><td className="mono small">{CONFIG_KEY}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ height: 16 }} />

        <div className="danger-zone">
          <div className="ttl">Zona crítica</div>
          <p>
            As ações abaixo são <strong>irreversíveis</strong>. Considere exportar um backup antes de prosseguir.
          </p>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="btn ghost" onClick={() => {
              if (confirm("Restaurar a sessão de exemplo? A sessão atual será perdida.")) resetSession();
            }}>Restaurar sessão de exemplo</button>
            <button className="btn ghost" onClick={() => {
              if (confirm("Restaurar todas as configurações ao padrão? Os dados da Câmara serão perdidos.")) resetConfig();
            }}>Restaurar configuração padrão</button>
            <button className="btn danger" onClick={() => {
              if (confirm("Apagar TUDO (configuração + sessão)? Esta ação não pode ser desfeita.")) {
                resetSession();
                resetConfig();
              }
            }}>Apagar todos os dados</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Administracao, Field });
