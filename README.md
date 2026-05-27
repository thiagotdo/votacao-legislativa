# 🏛️ Sistema de Votação Legislativa — Câmara Municipal

Sistema web completo para gestão de sessões e votações legislativas.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js + Express |
| Banco de dados | PostgreSQL |
| Tempo real | Socket.IO |
| Autenticação | JWT + bcrypt |
| Frontend | React + Vite |

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+

---

## Instalação rápida

```bash
# 1. Clone / extraia o projeto
cd votacao-legislativa

# 2. Configure o banco de dados
cp backend/.env.example backend/.env
# Edite backend/.env com suas credenciais do PostgreSQL

# 3. Backend
cd backend
npm install
npm run db:migrate   # cria as tabelas
npm run db:seed      # popula dados iniciais
npm run dev

# 4. Frontend (outro terminal)
cd ../frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

---

## Usuários padrão (após seed)

| Email | Senha | Perfil |
|-------|-------|--------|
| presidente@camara.gov.br | Admin@123 | Presidente |
| secretaria@camara.gov.br | Admin@123 | Secretaria |
| vereador@camara.gov.br | Admin@123 | Vereador |

---

## Estrutura do projeto

```
votacao-legislativa/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, JWT, Socket
│   │   ├── controllers/   # Lógica de negócio
│   │   ├── middleware/     # Auth, roles, erros
│   │   ├── models/        # Queries SQL
│   │   └── routes/        # Rotas da API
│   ├── migrations/        # Scripts SQL
│   └── seeds/             # Dados iniciais
└── frontend/
    └── src/
        ├── components/    # Componentes reutilizáveis
        ├── pages/         # Páginas da aplicação
        ├── hooks/         # Custom hooks (Socket, Auth)
        └── services/      # Chamadas à API
```

---

## Funcionalidades

- ✅ Autenticação JWT com perfis (Presidente, Secretaria, Vereador)
- ✅ Controle de sessões (abrir, suspender, encerrar)
- ✅ Registro de presenças e quórum automático
- ✅ Votação nominal, simbólica e secreta em tempo real via WebSocket
- ✅ Painel ao vivo com placar atualizado automaticamente
- ✅ Gestão de pauta (PL, Requerimento, Indicação, Moção)
- ✅ Histórico completo de votações
- ✅ Geração de ata em texto

---

## API — principais endpoints

```
POST /api/auth/login
GET  /api/sessoes
POST /api/sessoes
PUT  /api/sessoes/:id/abrir
PUT  /api/sessoes/:id/encerrar
GET  /api/vereadores
GET  /api/presencas/:sessaoId
POST /api/presencas
GET  /api/pauta/:sessaoId
POST /api/pauta
POST /api/votacoes/iniciar
POST /api/votacoes/:id/votar
PUT  /api/votacoes/:id/encerrar
GET  /api/historico
```
