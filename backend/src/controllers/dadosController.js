const pool = require('../config/database');

// =========== VEREADORES ===========

async function listarVereadores(req, res) {
  try {
    const result = await pool.query(`
      SELECT v.*, p.sigla as partido, p.nome as partido_nome
      FROM vereadores v
      LEFT JOIN partidos p ON v.partido_id = p.id
      WHERE v.ativo = true
      ORDER BY v.nome`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar vereadores' });
  }
}

async function criarVereador(req, res) {
  try {
    const { nome, partido_id, cargo, email, telefone } = req.body;
    const result = await pool.query(`
      INSERT INTO vereadores (nome, partido_id, cargo, email, telefone)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nome, partido_id || null, cargo || 'Vereador', email || null, telefone || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar vereador' });
  }
}

async function atualizarVereador(req, res) {
  try {
    const { nome, partido_id, cargo, email, telefone, ativo } = req.body;
    const result = await pool.query(`
      UPDATE vereadores SET nome=$1, partido_id=$2, cargo=$3, email=$4, telefone=$5, ativo=$6
      WHERE id=$7 RETURNING *`,
      [nome, partido_id, cargo, email, telefone, ativo !== false, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function listarPartidos(req, res) {
  try {
    const result = await pool.query('SELECT * FROM partidos ORDER BY sigla');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

// =========== PAUTA ===========

async function listarPauta(req, res) {
  try {
    const result = await pool.query(`
      SELECT m.*, t.nome as tipo_nome, t.sigla as tipo_sigla
      FROM materias m
      LEFT JOIN tipos_materia t ON m.tipo_id = t.id
      WHERE m.sessao_id = $1
      ORDER BY m.ordem, m.id`, [req.params.sessaoId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar pauta' });
  }
}

async function adicionarMateria(req, res) {
  try {
    const { sessao_id, tipo_id, numero, ementa, autor, ordem } = req.body;
    const maxOrdem = await pool.query('SELECT COALESCE(MAX(ordem),0)+1 as prox FROM materias WHERE sessao_id=$1', [sessao_id]);
    const result = await pool.query(`
      INSERT INTO materias (sessao_id, tipo_id, numero, ementa, autor, ordem)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [sessao_id, tipo_id || null, numero || null, ementa, autor || null, ordem || maxOrdem.rows[0].prox]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao adicionar matéria' });
  }
}

async function atualizarMateria(req, res) {
  try {
    const { numero, ementa, autor, status, ordem } = req.body;
    const result = await pool.query(`
      UPDATE materias SET numero=$1, ementa=$2, autor=$3, status=$4, ordem=$5 WHERE id=$6 RETURNING *`,
      [numero, ementa, autor, status, ordem, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function removerMateria(req, res) {
  try {
    await pool.query('DELETE FROM materias WHERE id=$1', [req.params.id]);
    res.json({ mensagem: 'Matéria removida' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function listarTiposMateria(req, res) {
  try {
    const result = await pool.query('SELECT * FROM tipos_materia ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

module.exports = {
  listarVereadores, criarVereador, atualizarVereador, listarPartidos,
  listarPauta, adicionarMateria, atualizarMateria, removerMateria, listarTiposMateria,
};
