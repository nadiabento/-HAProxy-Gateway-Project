const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET (Listar): Rececionistas e Fisioterapeutas podem ver
router.get('/', authenticate, authorize('rececionista', 'fisioterapeuta'), pacientesController.listarPacientes);

// POST (Criar): SÓ Rececionistas (e Admin) podem criar
router.post('/', authenticate, authorize('rececionista'), pacientesController.criarPaciente);

// PUT (Editar): Rececionistas e Fisioterapeutas podem editar
router.put('/:id', authenticate, authorize('rececionista', 'fisioterapeuta'), pacientesController.editarPaciente);

// DELETE (Eliminar): SÓ Rececionistas (e Admin) podem apagar
router.delete('/:id', authenticate, authorize('rececionista'), pacientesController.eliminarPaciente);

module.exports = router;