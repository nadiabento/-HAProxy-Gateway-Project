const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Tecnica",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      nome: {
        type: T.STRING(150),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      categoria: { type: T.STRING(100), allowNull: true },
      // uma técnica inativa não se oferece em consultas novas, mas mantém-se nas antigas
      ativa: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "tecnica", underscored: true, timestamps: false },
  );