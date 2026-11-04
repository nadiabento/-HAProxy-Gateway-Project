const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Administrador",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      dadosPessoaisId: { type: T.INTEGER, allowNull: false, unique: true },
    },
    { tableName: "administrador", underscored: true, timestamps: false },
  );