require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

const sql = `
-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Partidos políticos
CREATE TABLE IF NOT EXISTS partidos (
  id SERIAL PRIMARY KEY,
  sigla VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(100),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Usuários do sistema (login)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(30) NOT NULL CHECK (perfil IN ('presidente','vice_presidente','secretario','vereador','admin')),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Vereadores (vinculados a um usuário)
CREATE TABLE IF NOT EXISTS vereadores (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nome VARCHAR(100) NOT NULL,
  partido_id INTEGER REFERENCES partidos(id) ON DELETE SET NULL,
  cargo VARCHAR(50) DEFAULT 'Vereador',
  foto_url VARCHAR(255),
  telefone VARCHAR(20),
  email VARCHAR(150),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Legislaturas
CREATE TABLE IF NOT EXISTS legislaturas (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  ano_inicio INTEGER NOT NULL,
  ano_fim INTEGER NOT NULL,
  ativa BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Sessões plenárias
CREATE TABLE IF NOT EXISTS sessoes (
  id SERIAL PRIMARY KEY,
  legislatura_id INTEGER REFERENCES legislaturas(id),
  numero INTEGER NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ordinaria','extraordinaria','solene','especial')),
  data_sessao DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada','aberta','suspensa','encerrada')),
  presidente_id INTEGER REFERENCES vereadores(id),
  quorum_minimo INTEGER DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Presenças por sessão
CREATE TABLE IF NOT EXISTS presencas (
  id SERIAL PRIMARY KEY,
  sessao_id INTEGER NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
  vereador_id INTEGER NOT NULL REFERENCES vereadores(id) ON DELETE CASCADE,
  presente BOOLEAN DEFAULT FALSE,
  hora_chegada TIME,
  justificativa TEXT,
  registrado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(sessao_id, vereador_id)
);

-- Tipos de matéria
CREATE TABLE IF NOT EXISTS tipos_materia (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  sigla VARCHAR(10) NOT NULL,
  descricao TEXT
);

-- Pauta / Matérias
CREATE TABLE IF NOT EXISTS materias (
  id SERIAL PRIMARY KEY,
  sessao_id INTEGER REFERENCES sessoes(id) ON DELETE CASCADE,
  tipo_id INTEGER REFERENCES tipos_materia(id),
  numero VARCHAR(30),
  ementa TEXT NOT NULL,
  autor VARCHAR(100),
  ordem INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente','em_votacao','aprovada','rejeitada','retirada')),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Votações
CREATE TABLE IF NOT EXISTS votacoes (
  id SERIAL PRIMARY KEY,
  sessao_id INTEGER NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
  materia_id INTEGER REFERENCES materias(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  tipo_votacao VARCHAR(20) DEFAULT 'nominal' CHECK (tipo_votacao IN ('nominal','simbolica','secreta')),
  quorum_necessario VARCHAR(30) DEFAULT 'maioria_simples',
  total_presentes INTEGER DEFAULT 0,
  votos_sim INTEGER DEFAULT 0,
  votos_nao INTEGER DEFAULT 0,
  votos_abstencao INTEGER DEFAULT 0,
  resultado VARCHAR(20) CHECK (resultado IN ('aprovada','rejeitada','empate',NULL)),
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta','encerrada','cancelada')),
  iniciada_em TIMESTAMP DEFAULT NOW(),
  encerrada_em TIMESTAMP
);

-- Votos individuais (para votação nominal)
CREATE TABLE IF NOT EXISTS votos (
  id SERIAL PRIMARY KEY,
  votacao_id INTEGER NOT NULL REFERENCES votacoes(id) ON DELETE CASCADE,
  vereador_id INTEGER NOT NULL REFERENCES vereadores(id) ON DELETE CASCADE,
  voto VARCHAR(20) NOT NULL CHECK (voto IN ('sim','nao','abstencao')),
  votado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(votacao_id, vereador_id)
);

-- Log de eventos da sessão
CREATE TABLE IF NOT EXISTS log_sessao (
  id SERIAL PRIMARY KEY,
  sessao_id INTEGER NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
  tipo VARCHAR(30),
  descricao TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sessoes_data ON sessoes(data_sessao);
CREATE INDEX IF NOT EXISTS idx_presencas_sessao ON presencas(sessao_id);
CREATE INDEX IF NOT EXISTS idx_materias_sessao ON materias(sessao_id);
CREATE INDEX IF NOT EXISTS idx_votacoes_sessao ON votacoes(sessao_id);
CREATE INDEX IF NOT EXISTS idx_votos_votacao ON votos(votacao_id);
CREATE INDEX IF NOT EXISTS idx_log_sessao ON log_sessao(sessao_id);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessoes_atualizado ON sessoes;
CREATE TRIGGER trg_sessoes_atualizado
  BEFORE UPDATE ON sessoes
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

DROP TRIGGER IF EXISTS trg_usuarios_atualizado ON usuarios;
CREATE TRIGGER trg_usuarios_atualizado
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Executando migrations...');
    await client.query(sql);
    console.log('✅ Migrations concluídas!');
  } catch (err) {
    console.error('❌ Erro na migration:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
