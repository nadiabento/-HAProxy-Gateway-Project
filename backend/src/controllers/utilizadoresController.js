const bcrypt = require('bcryptjs');
const { sequelize, Utilizador, DadosPessoais, Rececionista, Fisioterapeuta, Perfil } = require('../models');

exports.criarFuncionario = async (req, res) => {
  // 1. Receber os novos campos
  const { nome, email, password, tipo, contacto, data_nascimento, morada, especialidade } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const utilizador = await Utilizador.create({ passwordHash, estado: 'ativo' }, { transaction });

    // 2. Guardar na tabela de Dados Pessoais
    const dadosPessoais = await DadosPessoais.create({
      utilizadorId: utilizador.id,
      nome, 
      email,
      contacto,
      data_nascimento: data_nascimento || null,
      morada
    }, { transaction });

    const tipoFiltro = tipo.toLowerCase();

    // 3. Associar especialidade se for fisioterapeuta
    if (tipoFiltro === 'fisioterapeuta') {
      await Fisioterapeuta.create({ 
        dadosPessoaisId: dadosPessoais.id, 
        especialidade 
      }, { transaction });
    } else if (tipoFiltro === 'rececionista') {
      await Rececionista.create({ dadosPessoaisId: dadosPessoais.id }, { transaction });
    }

    const nomePerfil = tipoFiltro === 'rececionista' ? 'Rececionista' : 'Fisioterapeuta';
    const [perfil] = await Perfil.findOrCreate({
      where: { tipoPerfil: nomePerfil },
      defaults: { tipoPerfil: nomePerfil },
      transaction
    });

    await utilizador.setPerfis([perfil], { transaction });
    await transaction.commit();
    res.status(201).json({ message: 'Funcionário criado com sucesso!' });

  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao criar:", error);
    res.status(500).json({ error: 'Erro interno ao criar funcionário.' });
  }
};

exports.listarFuncionarios = async (req, res) => {
  try {
    const utilizadores = await Utilizador.findAll({
      attributes: ['id', 'estado'],
      include: [
        { model: DadosPessoais, as: 'dadosPessoais' },
        { model: Perfil, as: 'perfis', attributes: ['tipoPerfil'] }
      ]
    });

    const lista = utilizadores.map(u => ({
      id: u.id,
      estado: u.estado,
      nome: u.dadosPessoais ? u.dadosPessoais.nome : 'Sem nome',
      email: u.dadosPessoais ? u.dadosPessoais.email : 'Sem e-mail',
      contacto: u.dadosPessoais ? u.dadosPessoais.contacto : '',
      tipo: (u.perfis && u.perfis.length > 0) ? u.perfis[0].tipoPerfil : 'Sem Perfil'
    }));

    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar.' });
  }
};

exports.editarFuncionario = async (req, res) => {
  const { id } = req.params;
  const { nome, email, contacto, data_nascimento, morada } = req.body;

  try {
    const dp = await DadosPessoais.findOne({ where: { utilizadorId: id } });
    if (!dp) return res.status(404).json({ error: 'Não encontrado.' });

    await dp.update({ nome, email, contacto, data_nascimento, morada });
    res.status(200).json({ message: 'Atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar.' });
  }
};

exports.eliminarFuncionario = async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();

  try {
    const utilizador = await Utilizador.findByPk(id, { transaction });
    if (!utilizador) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Não encontrado.' });
    }

    const dp = await DadosPessoais.findOne({ where: { utilizadorId: id }, transaction });
    if (dp) {
      await Fisioterapeuta.destroy({ where: { dadosPessoaisId: dp.id }, transaction });
      await Rececionista.destroy({ where: { dadosPessoaisId: dp.id }, transaction });
      await dp.destroy({ transaction });
    }
    await utilizador.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: 'Eliminado.' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: 'Erro ao eliminar.' });
  }
};