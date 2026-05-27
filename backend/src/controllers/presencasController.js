const pool = require('../config/database');

async function listar(req, res) {
  try {
    const result = await pool.query(`
      SELECT p.*, v.nome, v.cargo, pt.sigla as partido
      FROM presencas p
      JOIN vereadores v ON p.vereador_id = v.id
      LEFT JOIN partidos pt ON v.partido_id = pt.id
      WHERE p.sessao_id = $1
      ORDER BY v.nome`, [req.params.sessaoId]
    );
    const presentes = result.rows.filter(r => r.presente).length;
    res.json({ presencas: result.rows, total: result.rows.length, presentes, ausentes: result.rows.length - presentes });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar presenças' });
  }
}

async function registrar(req, res) {
  try {
    const { sessao_id, vereador_id, presente, hora_chegada, justificativa } = req.body;
    const result = await pool.query(`
      INSERT INTO presencas (sessao_id, vereador_id, presente, hora_chegada, justificativa)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (sessao_id, vereador_id)
      DO UPDATE SET presente = $3, hora_chegada = $4, justificativa = $5, registrado_em = NOW()
      RETURNING *`, [sessao_id, vereador_id, presente, hora_chegada || null, justificativa || null]
    );

    // Emite atualização em tempo real
    const ver = await pool.query('SELECT nome FROM vereadores WHERE id = $1', [vereador_id]);
    req.app.get('io')?.to(`sessao_${sessao_id}`).emit('presenca:atualizada', {
      vereadorId: vereador_id,
      vereadorNome: ver.rows[0]?.nome,
      presente,
    });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar presença' });
  }
}

async function registrarLote(req, res) {
  try {
    const { sessao_id, vereadores } = req.body;
    for (const { vereador_id, presente } of vereadores) {
      await pool.query(`
        INSERT INTO presencas (sessao_id, vereador_id, presente)
        VALUES ($1,$2,$3)
        ON CONFLICT (sessao_id, vereador_id) DO UPDATE SET presente = $3, registrado_em = NOW()`,
        [sessao_id, vereador_id, presente]
      );
    }
    req.app.get('io')?.to(`sessao_${sessao_id}`).emit('presenca:lote', { sessaoId: sessao_id });
    res.json({ mensagem: 'Presenças atualizadas' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

module.exports = { listar, registrar, registrarLote };
