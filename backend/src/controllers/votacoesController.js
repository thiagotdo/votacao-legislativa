const pool = require('../config/database');

async function iniciar(req, res) {
  try {
    const { sessao_id, materia_id, titulo, tipo_votacao, quorum_necessario } = req.body;

    // Verifica se sessão está aberta
    const sessao = await pool.query('SELECT * FROM sessoes WHERE id = $1 AND status = \'aberta\'', [sessao_id]);
    if (!sessao.rows[0]) return res.status(400).json({ erro: 'Sessão não está aberta' });

    // Verifica se já há votação aberta nesta sessão
    const ativa = await pool.query(
      'SELECT id FROM votacoes WHERE sessao_id = $1 AND status = \'aberta\'', [sessao_id]
    );
    if (ativa.rows.length > 0) return res.status(400).json({ erro: 'Já existe uma votação em andamento nesta sessão' });

    // Conta presentes
    const presentes = await pool.query(
      'SELECT COUNT(*) FROM presencas WHERE sessao_id = $1 AND presente = true', [sessao_id]
    );
    const totalPresentes = parseInt(presentes.rows[0].count);

    const result = await pool.query(`
      INSERT INTO votacoes (sessao_id, materia_id, titulo, tipo_votacao, quorum_necessario, total_presentes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [sessao_id, materia_id || null, titulo, tipo_votacao || 'nominal', quorum_necessario || 'maioria_simples', totalPresentes]
    );

    if (materia_id) {
      await pool.query('UPDATE materias SET status = \'em_votacao\' WHERE id = $1', [materia_id]);
    }

    const votacao = result.rows[0];

    // Emite para todos conectados à sala da sessão
    req.app.get('io')?.to(`sessao_${sessao_id}`).emit('votacao:iniciada', votacao);

    await registrarLog(sessao_id, 'votacao_iniciada', `Votação iniciada: ${titulo}`, req.usuario.id);
    res.status(201).json(votacao);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao iniciar votação' });
  }
}

async function votar(req, res) {
  try {
    const { id } = req.params;
    const { vereador_id, voto } = req.body;

    if (!['sim', 'nao', 'abstencao'].includes(voto)) {
      return res.status(400).json({ erro: 'Voto inválido' });
    }

    // Verifica votação aberta
    const votacao = await pool.query('SELECT * FROM votacoes WHERE id = $1 AND status = \'aberta\'', [id]);
    if (!votacao.rows[0]) return res.status(400).json({ erro: 'Votação não está aberta' });

    // Verifica se vereador está presente
    const presente = await pool.query(
      'SELECT * FROM presencas WHERE sessao_id = $1 AND vereador_id = $2 AND presente = true',
      [votacao.rows[0].sessao_id, vereador_id]
    );
    if (!presente.rows[0]) return res.status(400).json({ erro: 'Vereador não está presente nesta sessão' });

    // Registra ou atualiza voto (upsert)
    await pool.query(`
      INSERT INTO votos (votacao_id, vereador_id, voto)
      VALUES ($1, $2, $3)
      ON CONFLICT (votacao_id, vereador_id) DO UPDATE SET voto = $3, votado_em = NOW()`,
      [id, vereador_id, voto]
    );

    // Atualiza contadores na votação
    const contagem = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE voto = 'sim') as sim,
        COUNT(*) FILTER (WHERE voto = 'nao') as nao,
        COUNT(*) FILTER (WHERE voto = 'abstencao') as abstencao
      FROM votos WHERE votacao_id = $1`, [id]
    );
    const { sim, nao, abstencao } = contagem.rows[0];
    await pool.query(`
      UPDATE votacoes SET votos_sim = $1, votos_nao = $2, votos_abstencao = $3 WHERE id = $4`,
      [sim, nao, abstencao, id]
    );

    // Busca nome do vereador para broadcast
    const ver = await pool.query('SELECT nome FROM vereadores WHERE id = $1', [vereador_id]);

    // Emite voto em tempo real
    req.app.get('io')?.to(`sessao_${votacao.rows[0].sessao_id}`).emit('votacao:voto', {
      votacaoId: parseInt(id),
      vereadorId: vereador_id,
      vereadorNome: ver.rows[0]?.nome,
      voto,
      contagem: { sim: parseInt(sim), nao: parseInt(nao), abstencao: parseInt(abstencao) },
    });

    res.json({ mensagem: 'Voto registrado', contagem: { sim: parseInt(sim), nao: parseInt(nao), abstencao: parseInt(abstencao) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar voto' });
  }
}

async function encerrar(req, res) {
  try {
    const { id } = req.params;
    const votacao = await pool.query('SELECT * FROM votacoes WHERE id = $1 AND status = \'aberta\'', [id]);
    if (!votacao.rows[0]) return res.status(400).json({ erro: 'Votação não encontrada ou já encerrada' });

    const v = votacao.rows[0];
    let resultado;
    const quorum = v.quorum_necessario;
    const total = v.total_presentes;

    let minVotos;
    if (quorum === '2/3') minVotos = Math.ceil(total * 2 / 3);
    else if (quorum === 'maioria_absoluta') minVotos = Math.floor(total / 2) + 1;
    else minVotos = Math.floor(parseInt(v.votos_sim) + parseInt(v.votos_nao) > 0
      ? (parseInt(v.votos_sim) + parseInt(v.votos_nao)) / 2 + 0.01 : 1);

    if (quorum === 'maioria_simples') {
      resultado = parseInt(v.votos_sim) > parseInt(v.votos_nao) ? 'aprovada' : parseInt(v.votos_nao) > parseInt(v.votos_sim) ? 'rejeitada' : 'empate';
    } else {
      resultado = parseInt(v.votos_sim) >= minVotos ? 'aprovada' : 'rejeitada';
    }

    const updated = await pool.query(`
      UPDATE votacoes SET status = 'encerrada', resultado = $1, encerrada_em = NOW() WHERE id = $2 RETURNING *`,
      [resultado, id]
    );

    // Atualiza matéria
    if (v.materia_id) {
      await pool.query('UPDATE materias SET status = $1 WHERE id = $2', [resultado, v.materia_id]);
    }

    // Busca votos individuais para ata
    const votos = await pool.query(`
      SELECT vr.nome, vr.partido_id, pt.sigla as partido, vt.voto
      FROM votos vt
      JOIN vereadores vr ON vt.vereador_id = vr.id
      LEFT JOIN partidos pt ON vr.partido_id = pt.id
      WHERE vt.votacao_id = $1
      ORDER BY vr.nome`, [id]
    );

    req.app.get('io')?.to(`sessao_${v.sessao_id}`).emit('votacao:encerrada', {
      votacao: updated.rows[0],
      resultado,
      votos: votos.rows,
    });

    await registrarLog(v.sessao_id, 'votacao_encerrada',
      `Votação encerrada: ${v.titulo} — ${resultado.toUpperCase()} (${v.votos_sim}×${v.votos_nao})`,
      req.usuario.id
    );

    res.json({ votacao: updated.rows[0], resultado, votos: votos.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao encerrar votação' });
  }
}

async function cancelar(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE votacoes SET status = \'cancelada\' WHERE id = $1', [id]);
    res.json({ mensagem: 'Votação cancelada' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function buscarAtiva(req, res) {
  try {
    const result = await pool.query(`
      SELECT v.*, m.numero as materia_numero, m.ementa as materia_ementa
      FROM votacoes v
      LEFT JOIN materias m ON v.materia_id = m.id
      WHERE v.sessao_id = $1 AND v.status = 'aberta'
      LIMIT 1`, [req.params.sessaoId]
    );
    const votacao = result.rows[0] || null;

    if (votacao) {
      const votos = await pool.query(`
        SELECT vt.voto, vr.id, vr.nome, pt.sigla as partido
        FROM votos vt
        JOIN vereadores vr ON vt.vereador_id = vr.id
        LEFT JOIN partidos pt ON vr.partido_id = pt.id
        WHERE vt.votacao_id = $1`, [votacao.id]
      );
      votacao.votos_registrados = votos.rows;
    }

    res.json(votacao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function historico(req, res) {
  try {
    const where = req.query.sessao_id ? 'WHERE v.sessao_id = $1' : '';
    const params = req.query.sessao_id ? [req.query.sessao_id] : [];
    const result = await pool.query(`
      SELECT v.*, s.numero as sessao_numero, s.data_sessao, m.numero as materia_numero
      FROM votacoes v
      LEFT JOIN sessoes s ON v.sessao_id = s.id
      LEFT JOIN materias m ON v.materia_id = m.id
      ${where}
      ORDER BY v.iniciada_em DESC
      LIMIT 100`, params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function detalheVotacao(req, res) {
  try {
    const votacao = await pool.query(`
      SELECT v.*, m.numero as materia_numero, m.ementa, s.numero as sessao_numero, s.data_sessao
      FROM votacoes v
      LEFT JOIN materias m ON v.materia_id = m.id
      LEFT JOIN sessoes s ON v.sessao_id = s.id
      WHERE v.id = $1`, [req.params.id]
    );
    const votos = await pool.query(`
      SELECT vt.voto, vt.votado_em, vr.nome, pt.sigla as partido, vr.cargo
      FROM votos vt
      JOIN vereadores vr ON vt.vereador_id = vr.id
      LEFT JOIN partidos pt ON vr.partido_id = pt.id
      WHERE vt.votacao_id = $1
      ORDER BY vr.nome`, [req.params.id]
    );
    res.json({ votacao: votacao.rows[0], votos: votos.rows });
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

module.exports = { iniciar, votar, encerrar, cancelar, buscarAtiva, historico, detalheVotacao };
