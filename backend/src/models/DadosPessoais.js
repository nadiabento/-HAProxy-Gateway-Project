const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "DadosPessoais",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      utilizadorId: { type: T.INTEGER, allowNull: false, unique: true },
      nome: {
        type: T.STRING(150),
        allowNull: false,
        validate: { notEmpty: true },
      },
      email: {
        type: T.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      contacto: { type: T.STRING(30), allowNull: true },
      dataNascimento: { type: T.DATEONLY, allowNull: true },
      morada: { type: T.TEXT, allowNull: true },
    },
    { tableName: "dados_pessoais", underscored: true, timestamps: false },
  );