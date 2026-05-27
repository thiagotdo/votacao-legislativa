require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ─────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket conectado: ${socket.id}`);

  socket.on('entrar:sessao', (sessaoId) => {
    socket.join(`sessao_${sessaoId}`);
    console.log(`   → entrou na sala sessao_${sessaoId}`);
  });

  socket.on('sair:sessao', (sessaoId) => {
    socket.leave(`sessao_${sessaoId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket desconectado: ${socket.id}`);
  });
});

// ─── Middlewares ───────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rotas ─────────────────────────────────────────────
app.use('/api', routes);

// ─── Frontend estático ─────────────────────────────────
const path = require('path');
const fs = require('fs');
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    camara: process.env.CAMARA_NOME || 'Câmara Municipal',
    timestamp: new Date().toISOString(),
  });
});

// Erro 404
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

// Erro global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// ─── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('');
  console.log('🏛️  Sistema de Votação Legislativa');
  console.log(`✅  Backend rodando em http://localhost:${PORT}`);
  console.log(`📡  Socket.IO ativo`);
  console.log('');
});
