// === Painel do Vereador (login independente + votação individual) ===

const VOTANTE_AUTH_KEY = "camara_votante_auth_v1";

function loadVotanteAuth() {
  try {
    const raw = localStorage.getItem(VOTANTE_AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.vId) return null;
    return data;
  } catch (e) { return null; }
}

function saveVotanteAuth(vId) {
  const data = { vId, at: Date.now() };
  localStorage.setItem(VOTANTE_AUTH_KEY, JSON.stringify(data));
  return data;
}

function clearVotanteAuth() {
  localStorage.removeItem(VOTANTE_AUTH_KEY);
}

function LoginVereador({ config, onLogin }) {
  const [usuario, setUsuario] = React.useState("");
  const [senha, setSenha]     = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError]     = React.useState("");
  const [busy, setBusy]       = React.useState(false);

  function submit(e) {
    e?.preventDefault?.();
    setError("");
    setBusy(true);
    // pequeno delay artificial para feedback visual de "verificando"
    setTimeout(() => {
      const u = usuario.trim().toLowerCase();
      const p = senha;
      const match = config.vereadores.find(v =>
        (v.usuario || v.id).toLowerCase() === u && (v.senha || "") === p
      );
      if (!match) {
        setBusy(false);
        setError("Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.");
        return;
      }
      saveVotanteAuth(match.id);
      onLogin(match.id);
    }, 250);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <Brasao size={56} src={config.camara.brasao} />
          <div>
            <div className="login-camara">{config.camara.nomeFormal}</div>
            <div className="login-sub">{config.camara.legislatura} · {config.camara.sessaoLeg}</div>
          </div>
        </div>

        <div className="login-divider" />

        <div className="login-head">
          <div className="login-eyebrow">Acesso restrito</div>
          <h1>Painel do Vereador</h1>
          <p>Entre com suas credenciais individuais para registrar presença e votar nas matérias em apreciação.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <div>
            <label className="field-label">Usuário</label>
            <input
              className="input"
              type="text"
              autoFocus
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="seu.usuario"
            />
          </div>

          <div>
            <label className="field-label">Senha</label>
            <div className="login-pwd">
              <input
                className="input"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••"
              />
              <button type="button" className="login-pwd-toggle"
                onClick={() => setShowPwd(s => !s)}
                title={showPwd ? "Ocultar senha" : "Mostrar senha"}>
                {showPwd ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn login-submit" disabled={busy || !usuario || !senha}>
            {busy ? "Verificando…" : "Entrar no painel"}
          </button>
        </form>

        <div className="login-foot">
          <span className="mono">Sistema de Votação · acesso individual</span>
          <span>Esqueceu suas credenciais? Procure a Mesa Diretora.</span>
        </div>
      </div>
    </div>
  );
}

function PainelVereador({ store }) {
  const { state, config, castVote } = store;
  const [auth, setAuth] = React.useState(() => loadVotanteAuth());

  // Se o vereador autenticado for removido da admin, força logout
  React.useEffect(() => {
    if (auth && !config.vereadores.find(v => v.id === auth.vId)) {
      clearVotanteAuth();
      setAuth(null);
    }
  }, [config.vereadores, auth]);

  if (!auth) {
    return <LoginVereador config={config} onLogin={(vId) => setAuth({ vId, at: Date.now() })} />;
  }

  const vId = auth.vId;
  const vereador = findVereador(vId, config.vereadores);
  if (!vereador) {
    clearVotanteAuth();
    return <LoginVereador config={config} onLogin={(vId) => setAuth({ vId, at: Date.now() })} />;
  }

  const cargo = papelMesa(vId, config);
  const presente = !!state.presencas[vId];
  const materiaAtiva = state.materias.find(m => m.status === "em_votacao");
  const meuVoto = materiaAtiva?.votos?.[vId];

  function logout() {
    if (confirm("Encerrar a sessão deste painel? O próximo vereador precisará entrar com suas credenciais.")) {
      clearVotanteAuth();
      setAuth(null);
    }
  }

  return (
    <div className="vereador-panel">
      <div className="voter-card">
        <VereadorAvatar vereador={vereador} size={84} />
        <div className="who">
          <div className="n">{vereador.nome}</div>
          <div className="p">
            {vereador.partido}
            {cargo && ` · ${cargo.label}`}
          </div>
        </div>
        <div className="voter-actions">
          <span className={`pill ${presente ? "open" : "closed"}`}>
            <span className="dot" />
            {presente ? "Presença registrada" : "Ausente"}
          </span>
          <button className="btn ghost small" onClick={logout} title="Encerrar sessão deste painel">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      {!materiaAtiva && (
        <div className="vote-prompt">
          <div className="matter-id">Aguardando próxima votação</div>
          <div className="matter-ttl">Nenhuma matéria em apreciação</div>
          <div className="matter-desc">
            Quando a Presidência abrir a votação, os botões Sim · Não{config.regimento.permitirAbstencao ? " · Abstenção" : ""} aparecerão automaticamente neste painel.
          </div>
        </div>
      )}

      {materiaAtiva && (
        <div className="vote-prompt">
          <div className="spread">
            <div className="matter-id">
              {config.tipos[materiaAtiva.tipo]?.sigla || materiaAtiva.tipo} · {materiaAtiva.id} · ordem {String(materiaAtiva.ordem).padStart(2, '0')}
            </div>
            <span className="pill live"><span className="dot" />Em votação · aberta {materiaAtiva.votacaoAbertaEm}</span>
          </div>
          <div className="matter-ttl">{materiaAtiva.titulo}</div>
          <div className="matter-desc">{materiaAtiva.ementa}</div>
          <div className="small muted" style={{ marginTop: 10 }}>
            Autoria: <strong style={{ color: "var(--ink)" }}>{materiaAtiva.autor}</strong>
          </div>

          {!presente && (
            <div className="vote-confirmed abst" style={{ marginTop: 18 }}>
              <span className="check serif">!</span>
              <div className="txt">
                <div className="t1">Presença não registrada</div>
                <div className="t2">Procure a Mesa Diretora para registrar presença antes de votar.</div>
              </div>
            </div>
          )}

          {presente && !meuVoto && (
            <div className="vote-buttons" style={!config.regimento.permitirAbstencao ? { gridTemplateColumns: "1fr 1fr" } : {}}>
              <button className="vote-btn sim" onClick={() => castVote(materiaAtiva.id, vId, "sim")}>
                <span className="glyph">SIM</span>
                <span className="lbl">Aprovo</span>
              </button>
              <button className="vote-btn nao" onClick={() => castVote(materiaAtiva.id, vId, "nao")}>
                <span className="glyph">NÃO</span>
                <span className="lbl">Rejeito</span>
              </button>
              {config.regimento.permitirAbstencao && (
                <button className="vote-btn abst" onClick={() => castVote(materiaAtiva.id, vId, "abst")}>
                  <span className="glyph">ABS</span>
                  <span className="lbl">Abstenho-me</span>
                </button>
              )}
            </div>
          )}

          {presente && meuVoto && (
            <>
              <div className={`vote-confirmed ${meuVoto}`}>
                <span className="check serif">✓</span>
                <div className="txt">
                  <div className="t1">Voto registrado</div>
                  <div className="t2">
                    {meuVoto === "sim"  && "SIM — favorável à matéria"}
                    {meuVoto === "nao"  && "NÃO — contrário à matéria"}
                    {meuVoto === "abst" && "ABSTENÇÃO — voto não computado para o resultado"}
                  </div>
                </div>
              </div>
              {config.regimento.permitirAlterarVoto && (
                <>
                  <div className="small muted" style={{ marginTop: 12, textAlign: "center" }}>
                    Você pode alterar seu voto enquanto a votação estiver aberta.
                  </div>
                  <div className="vote-buttons" style={{ marginTop: 10, ...(!config.regimento.permitirAbstencao ? { gridTemplateColumns: "1fr 1fr" } : {}) }}>
                    <button className={`vote-btn sim ${meuVoto === "sim" ? "selected" : ""}`}
                      onClick={() => castVote(materiaAtiva.id, vId, "sim")}>
                      <span className="glyph">SIM</span>
                      <span className="lbl">Aprovo</span>
                    </button>
                    <button className={`vote-btn nao ${meuVoto === "nao" ? "selected" : ""}`}
                      onClick={() => castVote(materiaAtiva.id, vId, "nao")}>
                      <span className="glyph">NÃO</span>
                      <span className="lbl">Rejeito</span>
                    </button>
                    {config.regimento.permitirAbstencao && (
                      <button className={`vote-btn abst ${meuVoto === "abst" ? "selected" : ""}`}
                        onClick={() => castVote(materiaAtiva.id, vId, "abst")}>
                        <span className="glyph">ABS</span>
                        <span className="lbl">Abstenho-me</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ height: 18 }} />
      <div className="card">
        <div className="card-head">
          <span className="label">Histórico</span>
          <span className="title">Meus votos nesta sessão</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {state.materias.filter(m => m.votos && vId in m.votos).length === 0 && (
            <div className="empty" style={{ padding: 16 }}>Nenhum voto registrado ainda nesta sessão.</div>
          )}
          {state.materias.filter(m => m.votos && vId in m.votos).map(m => (
            <div key={m.id} style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--line)",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 10,
              alignItems: "center",
            }}>
              <span className="mono small muted">{m.id}</span>
              <span className="serif" style={{ fontSize: 13, fontWeight: 600 }}>
                {m.titulo.slice(0, 60)}{m.titulo.length > 60 ? "…" : ""}
              </span>
              <VoteChip vote={m.votos[vId]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PainelVereador, LoginVereador });
