// === Componentes compartilhados ===

function Brasao({ size = 36, src }) {
  // Brasão geométrico/abstrato — não é réplica de nenhum símbolo oficial.
  // Quando `src` for fornecido (configurado pela administração), exibe a imagem oficial da Câmara.
  const s = size;
  if (src) {
    return (
      <div className="brasao brasao-img" style={{ width: s, height: s }}>
        <img src={src} alt="Brasão" />
      </div>
    );
  }
  return (
    <div className="brasao" style={{ width: s, height: s }}>
      <svg width={s * 0.65} height={s * 0.65} viewBox="0 0 24 24">
        <g fill="none" stroke="var(--brasao)" strokeWidth="1.2">
          <path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z" />
          <path d="M12 6 L17 9 L17 15 L12 18 L7 15 L7 9 Z" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </g>
      </svg>
    </div>
  );
}

function VereadorAvatar({ vereador, size = 64, className = "" }) {
  if (!vereador) return null;
  const cls = `voter-avatar ${vereador.foto ? "has-photo" : ""} ${className}`.trim();
  if (vereador.foto) {
    return (
      <div className={cls} style={{ width: size, height: size }}>
        <img src={vereador.foto} alt={vereador.nome} />
      </div>
    );
  }
  const fs = Math.round(size * 0.36);
  return (
    <div className={cls} style={{ width: size, height: size, fontSize: fs }}>
      {initials(vereador.nome)}
    </div>
  );
}

function LiveClock({ sessionDate }) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (n) => String(n).padStart(2, '0');
  const time = `${fmt(now.getHours())}:${fmt(now.getMinutes())}:${fmt(now.getSeconds())}`;
  return (
    <div className="clock">
      <span className="time tab">{time}</span>
      <span>{sessionDate}</span>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem("camara_theme") || "light";
  });
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("camara_theme", theme);
  }, [theme]);
  const isDark = theme === "dark";
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-label="Alternar tema"
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function TopBar({ view, setView, config }) {
  const tabs = [
    { id: "mesa",     label: "Mesa Diretora" },
    { id: "vereador", label: "Painel do Vereador" },
    { id: "telao",    label: "Telão Plenário" },
    { id: "arquivo",  label: "Arquivo" },
    { id: "admin",    label: "Administração" },
  ];
  return (
    <div className="topbar">
      <Brasao src={config.camara.brasao} />
      <div className="topbar-title">
        <span className="name">{config.camara.nomeFormal}</span>
        <span className="sub">{config.camara.legislatura} · {config.camara.sessaoLeg} · Sistema de Votação</span>
      </div>
      <div className="nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={view === t.id ? "active" : ""}
            onClick={() => setView(t.id)}
          >{t.label}</button>
        ))}
      </div>
      <ThemeToggle />
      <LiveClock sessionDate="14 mai 2026" />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    aberta:    { cls: "open",      label: "Sessão Aberta" },
    suspensa:  { cls: "suspended", label: "Suspensa" },
    encerrada: { cls: "closed",    label: "Encerrada" },
    em_votacao: { cls: "live",     label: "Em Votação" },
    aprovada:  { cls: "open",      label: "Aprovada" },
    rejeitada: { cls: "live",      label: "Rejeitada" },
    pendente:  { cls: "closed",    label: "Pendente" },
  };
  const m = map[status] || { cls: "closed", label: status };
  return (
    <span className={`pill ${m.cls}`}>
      <span className="dot" />
      {m.label}
    </span>
  );
}

function VoteChip({ vote }) {
  const map = {
    sim:  { cls: "sim",  label: "Sim" },
    nao:  { cls: "nao",  label: "Não" },
    abst: { cls: "abst", label: "Abstenção" },
    ausente: { cls: "ausente", label: "Ausente" },
    pendente: { cls: "pendente", label: "—" },
  };
  const m = map[vote] || map.pendente;
  return <span className={`vote-chip ${m.cls}`}>{m.label}</span>;
}

function SessionBar({ state, config }) {
  const presentes = presenceCount(state.presencas);
  const total = config.vereadores.length;
  return (
    <div className="session-bar">
      <div className="title-block">
        <div className="t">{state.numero}ª Sessão {state.tipo} · {config.camara.legislatura}</div>
        <div className="s">{config.camara.sessaoLeg} · {state.local || config.camara.plenarioNome}</div>
      </div>
      <div className="meta">
        <div className="meta-item">
          <span className="k">Identificador</span>
          <span className="v">{state.id}</span>
        </div>
        <div className="meta-item">
          <span className="k">Data</span>
          <span className="v">{state.data}</span>
        </div>
        <div className="meta-item">
          <span className="k">Início</span>
          <span className="v">{state.hora}</span>
        </div>
        <div className="meta-item">
          <span className="k">Quórum</span>
          <span className="v">{presentes}/{total}</span>
        </div>
      </div>
      <StatusPill status={state.status} />
    </div>
  );
}

Object.assign(window, { Brasao, LiveClock, TopBar, ThemeToggle, StatusPill, VoteChip, SessionBar, VereadorAvatar });
