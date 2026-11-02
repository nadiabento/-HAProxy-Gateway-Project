const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Rececionista",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      dadosPessoaisId: { type: T.INTEGER, allowNull: false, unique: true },
    },
    { tableName: "rececionista", underscored: true, timestamps: false },
  );