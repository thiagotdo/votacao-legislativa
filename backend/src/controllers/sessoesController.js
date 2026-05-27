const pool = require('../config/database');

async function listar(req, res) {
  try {
    const result = await pool.query(`
      SELECT s.*, l.numero as legislatura_numero,
             v.nome as presidente_nome,
             COUNT(DISTINCT p.id) FILTER (WHERE p.presente = true) as total_presentes,
             COUNT(DISTINCT p.id) as total_convocados,
             COUNT(DISTINCT m.id) as total_pauta,
             COUNT(DISTINCT vt.id) as total_votacoes
      FROM sessoes s
      LEFT JOIN legislaturas l ON s.legislatura_id = l.id
      LEFT JOIN vereadores v ON s.presidente_id = v.id
      LEFT JOIN presencas p ON p.sessao_id = s.id
      LEFT JOIN materias m ON m.sessao_id = s.id
      LEFT JOIN votacoes vt ON vt.sessao_id = s.id
      GROUP BY s.id, l.numero, v.nome
      ORDER BY s.data_sessao DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar sessões' });
  }
}

async function buscarPorId(req, res) {
  try {
    const result = await pool.query(`
      SELECT s.*, l.numero as legislatura_numero, v.nome as presidente_nome
      FROM sessoes s
      LEFT JOIN legislaturas l ON s.legislatura_id = l.id
      LEFT JOIN vereadores v ON s.presidente_id = v.id
      WHERE s.id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ erro: 'Sessão não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function criar(req, res) {
  try {
    const { numero, tipo, data_sessao, hora_inicio, legislatura_id, presidente_id, quorum_minimo, observacoes } = req.body;
    const result = await pool.query(`
      INSERT INTO sessoes (numero, tipo, data_sessao, hora_inicio, legislatura_id, presidente_id, quorum_minimo, observacoes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [numero, tipo, data_sessao, hora_inicio, legislatura_id, presidente_id, quorum_minimo || 7, observacoes]
    );

    // Cria presenças para todos os vereadores ativos
    const vereadores = await pool.query('SELECT id FROM vereadores WHERE ativo = true');
    for (const v of vereadores.rows) {
      await pool.query(
        'INSERT INTO presencas (sessao_id, vereador_id, presente) VALUES ($1, $2, false) ON CONFLICT DO NOTHING',
        [result.rows[0].id, v.id]
      );
    }

    await registrarLog(result.rows[0].id, 'sessao_criada', `Sessão ${numero}ª criada`, req.usuario.id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar sessão' });
  }
}

async function abrir(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE sessoes SET status = 'aberta', hora_inicio = CURRENT_TIME, atualizado_em = NOW() WHERE id = $1 AND status IN ('agendada','suspensa') RETURNING *`,
      [id]
    );
    if (!result.rows[0]) return res.status(400).json({ erro: 'Sessão não pode ser aberta' });
    await registrarLog(id, 'sessao_aberta', 'Sessão aberta', req.usuario.id);

    // Emite evento Socket.IO
    req.app.get('io')?.to(`sessao_${id}`).emit('sessao:status', { status: 'aberta' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function suspender(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE sessoes SET status = 'suspensa', atualizado_em = NOW() WHERE id = $1 AND status = 'aberta' RETURNING *`, [id]
    );
    if (!result.rows[0]) return res.status(400).json({ erro: 'Sessão não pode ser suspensa' });
    await registrarLog(id, 'sessao_suspensa', 'Sessão suspensa', req.usuario.id);
    req.app.get('io')?.to(`sessao_${id}`).emit('sessao:status', { status: 'suspensa' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function encerrar(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE sessoes SET status = 'encerrada', hora_fim = CURRENT_TIME, atualizado_em = NOW() WHERE id = $1 AND status IN ('aberta','suspensa') RETURNING *`, [id]
    );
    if (!result.rows[0]) return res.status(400).json({ erro: 'Sessão não pode ser encerrada' });
    await registrarLog(id, 'sessao_encerrada', 'Sessão encerrada', req.usuario.id);
    req.app.get('io')?.to(`sessao_${id}`).emit('sessao:status', { status: 'encerrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function logSessao(req, res) {
  try {
    const result = await pool.query(
      `SELECT l.*, u.nome as usuario_nome FROM log_sessao l LEFT JOIN usuarios u ON l.usuario_id = u.id WHERE l.sessao_id = $1 ORDER BY l.criado_em DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function registrarLog(sessaoId, tipo, descricao, usuarioId) {
  try {
    await pool.query(
      'INSERT INTO log_sessao (sessao_id, tipo, descricao, usuario_id) VALUES ($1,$2,$3,$4)',
      [sessaoId, tipo, descricao, usuarioId]
    );
  } catch {}
}

module.exports = { listar, buscarPorId, criar, abrir, suspender, encerrar, logSessao };
