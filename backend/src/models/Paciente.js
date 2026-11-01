const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Paciente",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      dadosPessoaisId: { type: T.INTEGER, allowNull: false, unique: true },
    },
    { tableName: "paciente", underscored: true, timestamps: false },
  );