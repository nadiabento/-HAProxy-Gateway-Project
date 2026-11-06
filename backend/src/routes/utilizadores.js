const express = require('express');
const router = express.Router();
const utilizadoresController = require('../controllers/utilizadoresController');
// Importar o middleware
const { authenticate, authorize } = require('../middleware/authMiddleware');

// TODAS as rotas aqui em baixo precisam do token válido (authenticate)
// E APENAS o 'administrador' pode aceder (authorize)
router.get('/', authenticate, authorize('administrador'), utilizadoresController.listarFuncionarios);
router.post('/', authenticate, authorize('administrador'), utilizadoresController.criarFuncionario);
router.put('/:id', authenticate, authorize('administrador'), utilizadoresController.editarFuncionario);
router.delete('/:id', authenticate, authorize('administrador'), utilizadoresController.eliminarFuncionario);

module.exports = router;