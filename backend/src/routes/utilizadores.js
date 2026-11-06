const express = require('express');
const router = express.Router();
const utilizadoresController = require('../controllers/utilizadoresController');

// Rota para listar (GET)
router.get('/', utilizadoresController.listarFuncionarios);

// Rota para criar (POST) que já tinhas
router.post('/', utilizadoresController.criarFuncionario);
router.delete('/:id', utilizadoresController.eliminarFuncionario);
router.put('/:id', utilizadoresController.editarFuncionario);

module.exports = router;