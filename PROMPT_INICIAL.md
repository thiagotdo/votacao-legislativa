# 🏛️ CONTEXTO DO PROJETO — Sistema de Votação Legislativa

## O que é este projeto

Sistema web completo para gestão de sessões plenárias e votações da **Câmara Municipal de Serrinha / BA**.

Desenvolvido com:
- **Backend**: Node.js + Express + PostgreSQL + Socket.IO
- **Frontend**: React + Vite
- **Autenticação**: JWT com perfis de acesso
- **Tempo real**: Socket.IO para votação ao vivo

---

## Estrutura de arquivos

```
votacao-legislativa/
├── backend/
│   ├── src/
│   │   ├── server.js                    ← Entry point + Socket.IO
│   │   ├── config/
│   │   │   ├── database.js              ← Pool PostgreSQL
│   │   │   ├── migrate.js               ← Cria todas as tabelas
│   │   │   └── seed.js                  ← Dados iniciais (vereadores, pauta)
│   │   ├── middleware/
│   │   │   └── auth.js                  ← JWT + exigirPerfil()
│   │   ├── controllers/
│   │   │   ├── authController.js        ← Login, perfil, alterar senha
│   │   │   ├── sessoesController.js     ← CRUD sessões + abrir/suspender/encerrar
│   │   │   ├── votacoesController.js    ← Iniciar, votar, encerrar, histórico
│   │   │   ├── presencasController.js   ← Registro individual e em lote
│   │   │   └── dadosController.js       ← Vereadores, partidos, pauta, tipos
│   │   └── routes/
│   │       └── index.js                 ← Todas as rotas da API
│   ├── .env.example                     ← Variáveis de ambiente necessárias
│   └── package.json
└── frontend/
    ├── src/
    │   ├── main.jsx                     ← Entry point React
    │   ├── App.jsx                      ← Router + rotas protegidas
    │   ├── index.css                    ← CSS global + variáveis de tema
    │   ├── hooks/
    │   │   ├── useAuth.jsx              ← AuthContext + login/logout
    │   │   └── useSocket.js             ← Hook Socket.IO por sessão
    │   ├── services/
    │   │   └── api.js                   ← Axios configurado com JWT
    │   ├── components/
    │   │   ├── Layout.jsx               ← Sidebar + header + Outlet
    │   │   ├── Layout.module.css
    │   │   ├── UI.jsx                   ← Badge, Btn, Card, Modal, Alert, etc.
    │   │   └── UI.module.css
    │   └── pages/
    │       ├── Login.jsx                ← Tela de login
    │       └── Votacao.jsx              ← ✅ PÁGINA COMPLETA (com Socket.IO)
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Banco de dados — tabelas

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Login, email, senha_hash, perfil |
| `vereadores` | Nome, partido, cargo, vinculado a usuario |
| `partidos` | Sigla e nome dos partidos |
| `legislaturas` | Períodos legislativos |
| `sessoes` | Sessões plenárias com status e tipo |
| `presencas` | Presença por vereador por sessão |
| `materias` | Itens da pauta (PL, REQ, IND, MOÇ...) |
| `tipos_materia` | Tipos cadastrados |
| `votacoes` | Votações com resultado e contadores |
| `votos` | Voto individual por vereador por votação |
| `log_sessao` | Log de eventos de cada sessão |

---

## Perfis de acesso (JWT)

| Perfil | Pode fazer |
|--------|-----------|
| `presidente` | Tudo — abrir/encerrar sessão, iniciar/encerrar votação |
| `vice_presidente` | Mesmo que presidente |
| `secretario` | Gerenciar pauta, presenças, vereadores |
| `admin` | Acesso total |
| `vereador` | Votar (somente pelo próprio voto) |

---

## API — endpoints implementados

```
POST   /api/auth/login
GET    /api/auth/perfil
PUT    /api/auth/senha

GET    /api/sessoes
GET    /api/sessoes/:id
POST   /api/sessoes
PUT    /api/sessoes/:id/abrir
PUT    /api/sessoes/:id/suspender
PUT    /api/sessoes/:id/encerrar
GET    /api/sessoes/:id/log

GET    /api/presencas/:sessaoId
POST   /api/presencas
POST   /api/presencas/lote

GET    /api/pauta/:sessaoId
POST   /api/pauta
PUT    /api/pauta/:id
DELETE /api/pauta/:id
GET    /api/tipos-materia

POST   /api/votacoes/iniciar
POST   /api/votacoes/:id/votar
PUT    /api/votacoes/:id/encerrar
PUT    /api/votacoes/:id/cancelar
GET    /api/votacoes/ativa/:sessaoId
GET    /api/votacoes/historico
GET    /api/votacoes/:id

GET    /api/vereadores
POST   /api/vereadores
PUT    /api/vereadores/:id
GET    /api/partidos
```

---

## Eventos Socket.IO

| Evento emitido pelo servidor | Quando |
|------------------------------|--------|
| `sessao:status` | Sessão aberta/suspensa/encerrada |
| `votacao:iniciada` | Nova votação começa |
| `votacao:voto` | Vereador registra voto (com contagem atualizada) |
| `votacao:encerrada` | Votação encerrada com resultado e votos individuais |
| `presenca:atualizada` | Presença de vereador alterada |
| `presenca:lote` | Presenças atualizadas em massa |

O frontend se conecta à sala `sessao_{id}` ao entrar na página.

---

## Páginas do frontend

| Rota | Arquivo | Status |
|------|---------|--------|
| `/login` | `Login.jsx` | ✅ Completo |
| `/` | Dashboard | ⬜ Placeholder — implementar |
| `/sessao` | Sessão Atual | ⬜ Placeholder — implementar |
| `/votacao` | `Votacao.jsx` | ✅ Completo (Socket.IO) |
| `/presenca` | Presenças | ⬜ Placeholder — implementar |
| `/pauta` | Pauta | ⬜ Placeholder — implementar |
| `/historico` | Histórico / Atas | ⬜ Placeholder — implementar |
| `/vereadores` | Vereadores | ⬜ Placeholder — implementar |

---

## Design system

Tema escuro (`--bg: #0d1117`) inspirado no GitHub Dark.
Variáveis CSS principais já definidas em `index.css`:

- `--bg`, `--surface`, `--surface2`, `--surface3` — fundos
- `--border`, `--border2` — bordas
- `--text`, `--text2`, `--text3` — textos
- `--green-text`, `--red-text`, `--yellow-text`, `--blue-text`, `--accent` — cores semânticas
- Fonte: DM Sans + DM Mono

Componentes prontos em `UI.jsx`: `Badge`, `Btn`, `Card`, `MetricCard`, `SectionTitle`, `Alert`, `Modal`, `FormGroup`, `Spinner`

---

## Como rodar localmente

```bash
# 1. Configure o .env
cp backend/.env.example backend/.env
# edite: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET

# 2. Backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev          # roda em http://localhost:3001

# 3. Frontend (outro terminal)
cd frontend
npm install
npm run dev          # roda em http://localhost:5173
```

**Usuários padrão após seed:**
- `presidente@camara.gov.br` / `Admin@123`
- `secretaria@camara.gov.br` / `Admin@123`
- `vereador@camara.gov.br` / `Admin@123`

---

## Próximos passos sugeridos

1. Implementar página **Dashboard** (`/`) com métricas, gráfico de partidos, últimas votações
2. Implementar página **Sessão Atual** (`/sessao`) com controles do presidente e log ao vivo
3. Implementar página **Presenças** (`/presenca`) com chamada por clique e quórum
4. Implementar página **Pauta** (`/pauta`) com CRUD e botão de votação
5. Implementar página **Histórico / Atas** (`/historico`) com filtros e exportação
6. Implementar página **Vereadores** (`/vereadores`) com CRUD completo
7. Configurar deploy no **Railway.app** (backend + PostgreSQL + frontend)

---

## Padrão de página a seguir

Todas as páginas seguem o padrão de `Votacao.jsx`:
- `useEffect` para carregar dados da API
- `useSocket` para ouvir eventos em tempo real
- Componentes de `UI.jsx` para layout
- CSS Module para estilos específicos da página
- `useAuth` para controle de permissões (`podeGerir`, `isPresidente`)
