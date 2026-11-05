'use strict';
const bcrypt = require('bcrypt');
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, SequelizeInstance) => {
    // 1. Verificar se o Administrador já existe pelo email
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT id FROM dados_pessoais WHERE email = 'admin@prc.pt' LIMIT 1;`,
      { type: QueryTypes.SELECT }
    );

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('O Administrador já se encontra registado na base de dados.');
      return;
    }

    // 2. Garantir que o Perfil 'Administrador' existe
    let perfilRows = await queryInterface.sequelize.query(
      `SELECT id FROM perfil WHERE tipo_perfil = 'Administrador' LIMIT 1;`,
      { type: QueryTypes.SELECT }
    );

    let adminPerfilId;
    if (perfilRows && perfilRows.length > 0) {
      adminPerfilId = perfilRows[0].id;
    } else {
      await queryInterface.bulkInsert('perfil', [{ tipo_perfil: 'Administrador' }], {});
      const newPerfilRows = await queryInterface.sequelize.query(
        `SELECT id FROM perfil WHERE tipo_perfil = 'Administrador' LIMIT 1;`,
        { type: QueryTypes.SELECT }
      );
      adminPerfilId = newPerfilRows[0].id;
    }

    // 3. Criar a conta na tabela utilizador
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await queryInterface.bulkInsert('utilizador', [{
      password_hash: passwordHash,
      estado: 'ativo'
    }], {});

    // Obter o ID do utilizador recém-criado
    const userRows = await queryInterface.sequelize.query(
      `SELECT id FROM utilizador ORDER BY id DESC LIMIT 1;`,
      { type: QueryTypes.SELECT }
    );
    const utilizadorId = userRows[0].id;

    // 4. Criar os dados_pessoais do Administrador
    await queryInterface.bulkInsert('dados_pessoais', [{
      utilizador_id: utilizadorId,
      nome: 'Admin Principal',
      email: 'admin@prc.pt',
      contacto: '910000000',
      data_nascimento: '1980-01-01',
      morada: 'Sede da Clínica PRC'
    }], {});

    // 5. Ligar o Utilizador ao Perfil na tabela perfil_utilizador
    await queryInterface.bulkInsert('perfil_utilizador', [{
      utilizador_id: utilizadorId,
      perfil_id: adminPerfilId
    }], {});

    console.log('Administrador principal criado com sucesso!');
  },

  down: async (queryInterface, SequelizeInstance) => {
    await queryInterface.bulkDelete('perfil_utilizador', null, {});
    await queryInterface.bulkDelete('dados_pessoais', null, {});
    await queryInterface.bulkDelete('utilizador', null, {});
    await queryInterface.bulkDelete('perfil', null, {});
  }
};