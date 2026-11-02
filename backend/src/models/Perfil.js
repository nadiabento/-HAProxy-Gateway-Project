const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Perfil",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      // paciente | fisioterapeuta | rececionista | administrador (inseridos pelo seeder)
      tipoPerfil: { type: T.STRING(30), allowNull: false, unique: true },
    },
    { tableName: "perfil", underscored: true, timestamps: false },
  );