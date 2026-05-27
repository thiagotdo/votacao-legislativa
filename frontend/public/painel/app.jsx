// === App principal ===

function App() {
  const store = useSessionStore();
  const [view, setView] = React.useState(() => localStorage.getItem("camara_view") || "mesa");
  React.useEffect(() => { localStorage.setItem("camara_view", view); }, [view]);

  // Tweaks (apenas visuais — configuração institucional vive na admin)
  const [t, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "simulador": false
  }/*EDITMODE-END*/);

  // Cor institucional vem da configuração administrativa
  React.useEffect(() => {
    document.documentElement.style.setProperty("--brasao", store.config.camara.corInstitucional || "#2f6bd1");
  }, [store.config.camara.corInstitucional]);

  // Tamanho da fonte do sistema — definido na Identidade da Câmara
  React.useEffect(() => {
    const map = { compacta: "13px", padrao: "14px", ampla: "15px", extra: "16px" };
    const size = map[store.config.camara.tamanhoFonte] || "14px";
    document.documentElement.style.fontSize = size;
  }, [store.config.camara.tamanhoFonte]);

  // Família tipográfica do sistema — definida na Identidade da Câmara
  React.useEffect(() => {
    document.documentElement.setAttribute(
      "data-font",
      store.config.camara.fonteSistema || "moderna"
    );
  }, [store.config.camara.fonteSistema]);

  // Auto-tick simulator
  React.useEffect(() => {
    if (!t.simulador) return;
    const interval = setInterval(() => {
      const m = store.state.materias.find(x => x.status === "em_votacao");
      if (!m) return;
      const presentes = Object.keys(store.state.presencas).filter(id => store.state.presencas[id]);
      const pending = presentes.filter(id => !(id in (m.votos || {})));
      if (pending.length === 0) return;
      const opts = ["sim", "sim", "sim", "nao", "nao", "abst"];
      const pick = opts[Math.floor(Math.random() * opts.length)];
      const who = pending[Math.floor(Math.random() * pending.length)];
      store.castVote(m.id, who, pick);
    }, 2200);
    return () => clearInterval(interval);
  }, [t.simulador, store.state]);

  return (
    <div className="app">
      <TopBar view={view} setView={setView} config={store.config} />
      <div className="content" data-screen-label={view}>
        {view === "mesa"     && <MesaDiretora    store={store} />}
        {view === "vereador" && <PainelVereador  store={store} />}
        {view === "telao"    && <TelaoPlenario   store={store} />}
        {view === "arquivo"  && <ArquivoSessoes  store={store} />}
        {view === "admin"    && <Administracao   store={store} />}
      </div>

      <TweaksPanel title="Ajustes de visualização">
        <TweakSection label="Demonstração">
          <TweakToggle
            label="Auto-votação"
            value={!!t.simulador}
            onChange={(v) => setTweak("simulador", v)}
          />
          <div className="small" style={{ color: "var(--muted)", marginTop: -4 }}>
            Tamanho da fonte, cor e brasão ficam em <strong>Administração → Identidade</strong>.
          </div>
          <TweakButton label="Restaurar sessão de exemplo" onClick={() => store.resetSession()} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
