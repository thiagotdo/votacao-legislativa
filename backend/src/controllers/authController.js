const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email.toLowerCase().trim()]
    );
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    // Busca vereador vinculado
    const verRes = await pool.query(
      'SELECT v.id, v.nome, v.cargo, p.sigla as partido FROM vereadores v LEFT JOIN partidos p ON v.partido_id = p.id WHERE v.usuario_id = $1',
      [usuario.id]
    );
    const vereador = verRes.rows[0] || null;

    const payload = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      vereadorId: vereador?.id || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({
      token,
      usuario: { ...payload, vereador },
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

async function perfil(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, perfil, criado_em FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

async function alterarSenha(req, res) {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const result = await pool.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
    const ok = await bcrypt.compare(senhaAtual, result.rows[0].senha_hash);
    if (!ok) return res.status(400).json({ erro: 'Senha atual incorreta' });
    const hash = await bcrypt.hash(novaSenha, 12);
    await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, req.usuario.id]);
    res.json({ mensagem: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

module.exports = { login, perfil, alterarSenha };
