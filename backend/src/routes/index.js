const express = require('express');
const router = express.Router();
const { autenticar, exigirPerfil } = require('../middleware/auth');
const auth = require('../controllers/authController');
const sessoes = require('../controllers/sessoesController');
const votacoes = require('../controllers/votacoesController');
const presencas = require('../controllers/presencasController');
const dados = require('../controllers/dadosController');

// ─── AUTH ─────────────────────────────────────────────
router.post('/auth/login', auth.login);
router.get('/auth/perfil', autenticar, auth.perfil);
router.put('/auth/senha', autenticar, auth.alterarSenha);

// ─── SESSÕES ──────────────────────────────────────────
router.get('/sessoes', autenticar, sessoes.listar);
router.get('/sessoes/:id', autenticar, sessoes.buscarPorId);
router.post('/sessoes', autenticar, exigirPerfil('presidente','secretario','admin'), sessoes.criar);
router.put('/sessoes/:id/abrir', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), sessoes.abrir);
router.put('/sessoes/:id/suspender', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), sessoes.suspender);
router.put('/sessoes/:id/encerrar', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), sessoes.encerrar);
router.get('/sessoes/:id/log', autenticar, sessoes.logSessao);

// ─── PRESENÇAS ────────────────────────────────────────
router.get('/presencas/:sessaoId', autenticar, presencas.listar);
router.post('/presencas', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), presencas.registrar);
router.post('/presencas/lote', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), presencas.registrarLote);

// ─── PAUTA ────────────────────────────────────────────
router.get('/pauta/:sessaoId', autenticar, dados.listarPauta);
router.post('/pauta', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), dados.adicionarMateria);
router.put('/pauta/:id', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), dados.atualizarMateria);
router.delete('/pauta/:id', autenticar, exigirPerfil('presidente','secretario','admin'), dados.removerMateria);
router.get('/tipos-materia', autenticar, dados.listarTiposMateria);

// ─── VOTAÇÕES ─────────────────────────────────────────
router.post('/votacoes/iniciar', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), votacoes.iniciar);
router.post('/votacoes/:id/votar', autenticar, votacoes.votar);
router.put('/votacoes/:id/encerrar', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), votacoes.encerrar);
router.put('/votacoes/:id/cancelar', autenticar, exigirPerfil('presidente','vice_presidente','secretario','admin'), votacoes.cancelar);
router.get('/votacoes/ativa/:sessaoId', autenticar, votacoes.buscarAtiva);
router.get('/votacoes/historico', autenticar, votacoes.historico);
router.get('/votacoes/:id', autenticar, votacoes.detalheVotacao);

// ─── VEREADORES & PARTIDOS ────────────────────────────
router.get('/vereadores', autenticar, dados.listarVereadores);
router.post('/vereadores', autenticar, exigirPerfil('secretario','admin'), dados.criarVereador);
router.put('/vereadores/:id', autenticar, exigirPerfil('secretario','admin'), dados.atualizarVereador);
router.get('/partidos', autenticar, dados.listarPartidos);

module.exports = router;
