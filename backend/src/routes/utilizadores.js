const express = require('express');
const router = express.Router();
const utilizadoresController = require('../controllers/utilizadoresController');
// Importar o middleware
const { verificarToken, autorizarPerfis } = require('../middlewares/auth');

// TODAS as rotas aqui em baixo precisam do token válido (verificarToken)
// E APENAS o 'administrador' pode aceder (autorizarPerfis)
router.get('/', verificarToken, autorizarPerfis('administrador'), utilizadoresController.listarFuncionarios);
router.post('/', verificarToken, autorizarPerfis('administrador'), utilizadoresController.criarFuncionario);
router.put('/:id', verificarToken, autorizarPerfis('administrador'), utilizadoresController.editarFuncionario);
router.delete('/:id', verificarToken, autorizarPerfis('administrador'), utilizadoresController.eliminarFuncionario);

module.exports = router;