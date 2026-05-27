// === App principal ===

function App() {
  const store = useSessionStore();

  // Hash → view (ex: #adm → "admin", #mesa → "mesa")
  const HASH_MAP = { mesa: "mesa", vereador: "vereador", telao: "telao", arquivo: "arquivo", adm: "admin" };
  const VIEW_TO_HASH = { mesa: "mesa", vereador: "vereador", telao: "telao", arquivo: "arquivo", admin: "adm" };
  const VALID = Object.keys(HASH_MAP);

  function hashToView(hash) {
    const h = (hash || "").replace(/^#/, "").toLowerCase();
    return HASH_MAP[h] || "mesa";
  }

  const [view, setViewState] = React.useState(() => hashToView(window.location.hash));

  function setView(v) {
    setViewState(v);
    const newHash = "#" + (VIEW_TO_HASH[v] || v);
    if (window.location.hash !== newHash) window.location.hash = newHash;
  }

  // Sincroniza botão Voltar/Avançar do browser
  React.useEffect(() => {
    function onHash() { setViewState(hashToView(window.location.hash)); }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

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
