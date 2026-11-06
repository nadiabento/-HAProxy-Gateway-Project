const { Paciente } = require('../models');

exports.criarPaciente = async (req, res) => {
  try {
    const { nome, email, contacto, data_nascimento, morada } = req.body;
    // Adaptado para guardar todos os campos (verifica se o teu model Paciente as suporta)
    const novoPaciente = await Paciente.create({ nome, email, contacto, data_nascimento: data_nascimento || null, morada, estado: 'ativo' });
    res.status(201).json({ message: 'Paciente criado!', paciente: novoPaciente });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar paciente.' });
  }
};

exports.listarPacientes = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll();
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar.' });
  }
};

exports.editarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, contacto, data_nascimento, morada } = req.body;
    
    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).json({ error: 'Não encontrado.' });

    await paciente.update({ nome, email, contacto, data_nascimento, morada });
    res.status(200).json({ message: 'Atualizado!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar.' });
  }
};

exports.eliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).json({ error: 'Não encontrado.' });

    await paciente.destroy();
    res.status(200).json({ message: 'Eliminado.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar.' });
  }
};