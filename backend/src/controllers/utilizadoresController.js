const bcrypt = require('bcryptjs');
const { sequelize, Utilizador, DadosPessoais, Rececionista, Fisioterapeuta, Perfil } = require('../models');

exports.criarFuncionario = async (req, res) => {
  // 1. Receber os novos campos
  const { nome, email, password, tipo, contacto, morada, especialidade } = req.body;
  // O modelo DadosPessoais chama ao campo "dataNascimento"; aceitamos os dois nomes
  const dataNasc = req.body.dataNascimento || req.body.data_nascimento || null;
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
      dataNascimento: dataNasc,
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
        {
          model: DadosPessoais,
          as: 'dadosPessoais',
          include: [{ model: Fisioterapeuta, as: 'fisioterapeuta', attributes: ['especialidade'] }]
        },
        { model: Perfil, as: 'perfis', attributes: ['tipoPerfil'] }
      ]
    });

    const lista = utilizadores
      .map(u => {
        const dp = u.dadosPessoais;
        return {
          id: u.id,
          estado: u.estado,
          nome: dp ? dp.nome : 'Sem nome',
          email: dp ? dp.email : 'Sem e-mail',
          contacto: dp ? dp.contacto : '',
          morada: dp ? dp.morada : '',
          data_nascimento: dp ? dp.dataNascimento : '',
          especialidade: dp && dp.fisioterapeuta ? dp.fisioterapeuta.especialidade : '',
          tipo: (u.perfis && u.perfis.length > 0) ? u.perfis[0].tipoPerfil : 'Sem Perfil'
        };
      })
      .filter(u => u.tipo.toLowerCase() !== 'paciente');

    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar.' });
  }
};

// Edita tudo o que se preenche ao criar, menos a palavra-passe:
// nome, e-mail, contacto, data de nascimento, morada, cargo e especialidade.
exports.editarFuncionario = async (req, res) => {
  const { id } = req.params;
  const { nome, email, contacto, morada, tipo, especialidade } = req.body;
  const dataNasc = req.body.dataNascimento !== undefined ? req.body.dataNascimento : req.body.data_nascimento;
  const transaction = await sequelize.transaction();

  try {
    const utilizador = await Utilizador.findByPk(id, {
      include: [{ model: Perfil, as: 'perfis' }],
      transaction
    });
    const dp = await DadosPessoais.findOne({ where: { utilizadorId: id }, transaction });
    if (!utilizador || !dp) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Não encontrado.' });
    }

    // 1. Dados pessoais (só mexe nos campos que vierem no pedido)
    await dp.update({
      ...(nome !== undefined && { nome }),
      ...(email !== undefined && { email }),
      ...(contacto !== undefined && { contacto }),
      ...(morada !== undefined && { morada }),
      ...(dataNasc !== undefined && { dataNascimento: dataNasc || null }),
    }, { transaction });

    // 2. Cargo e especialidade
    const tipoAtual = (utilizador.perfis && utilizador.perfis[0] ? utilizador.perfis[0].tipoPerfil : '').toLowerCase();
    const tipoNovo = tipo ? tipo.toLowerCase() : tipoAtual;

    if (tipoAtual === 'administrador') {
      // O administrador não muda de cargo
    } else if (tipoNovo !== tipoAtual && ['fisioterapeuta', 'rececionista'].includes(tipoNovo)) {
      if (tipoAtual === 'fisioterapeuta') {
        const fisio = await Fisioterapeuta.findOne({ where: { dadosPessoaisId: dp.id }, transaction });
        if (fisio) {
          try {
            await fisio.destroy({ transaction });
          } catch (e) {
            // Tem consultas associadas: não pode deixar de ser fisioterapeuta
            await transaction.rollback();
            return res.status(409).json({ error: 'Este fisioterapeuta tem consultas associadas e não pode mudar de cargo.' });
          }
        }
      } else {
        await Rececionista.destroy({ where: { dadosPessoaisId: dp.id }, transaction });
      }

      if (tipoNovo === 'fisioterapeuta') {
        await Fisioterapeuta.create({ dadosPessoaisId: dp.id, especialidade: especialidade || null }, { transaction });
      } else {
        await Rececionista.create({ dadosPessoaisId: dp.id }, { transaction });
      }

      const nomePerfil = tipoNovo === 'rececionista' ? 'Rececionista' : 'Fisioterapeuta';
      const [perfil] = await Perfil.findOrCreate({
        where: { tipoPerfil: nomePerfil },
        defaults: { tipoPerfil: nomePerfil },
        transaction
      });
      await utilizador.setPerfis([perfil], { transaction });
    } else if (tipoNovo === 'fisioterapeuta' && especialidade !== undefined) {
      await Fisioterapeuta.update({ especialidade: especialidade || null }, { where: { dadosPessoaisId: dp.id }, transaction });
    }

    await transaction.commit();
    res.status(200).json({ message: 'Atualizado com sucesso!' });
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Já existe outro utilizador com esse e-mail.' });
    }
    console.error('Erro ao editar:', error);
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