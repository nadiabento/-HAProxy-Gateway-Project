const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Utilizador",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      // NULL até a pessoa ativar a conta pelo link do email
      passwordHash: { type: T.STRING(255), allowNull: true },
      estado: {
        type: T.ENUM("pendente", "ativo", "inativo"),
        allowNull: false,
        defaultValue: "pendente",
      },
      // hash do token de ativação ou recuperação (uso único, com validade)
      resetTokenHash: { type: T.STRING(64), allowNull: true },
      resetTokenExpira: { type: T.DATE, allowNull: true },
    },
    {
      tableName: "utilizador",
      underscored: true,
      timestamps: false,
      // O hash e o token nunca saem nas respostas. Para o login: Utilizador.unscoped()
      defaultScope: {
        attributes: { exclude: ["passwordHash", "resetTokenHash"] },
      },
    },
  );