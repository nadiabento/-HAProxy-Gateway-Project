const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Fisioterapeuta",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      dadosPessoaisId: { type: T.INTEGER, allowNull: false, unique: true },
      especialidade: { type: T.STRING(100), allowNull: true },
    },
    { tableName: "fisioterapeuta", underscored: true, timestamps: false },
  );