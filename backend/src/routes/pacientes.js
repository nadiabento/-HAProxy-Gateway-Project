const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');

router.get('/', pacientesController.listarPacientes);
router.post('/', pacientesController.criarPaciente);
router.put('/:id', pacientesController.editarPaciente);
router.delete('/:id', pacientesController.eliminarPaciente);

module.exports = router;