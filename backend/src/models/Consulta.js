const { DataTypes: T } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Consulta",
    {
      id: { type: T.INTEGER, autoIncrement: true, primaryKey: true },
      pacienteId: { type: T.INTEGER, allowNull: false },
      fisioterapeutaId: { type: T.INTEGER, allowNull: false },
      dataHora: { type: T.DATE, allowNull: false },
      duracaoMinutos: { type: T.INTEGER, allowNull: false, defaultValue: 30 },
      estado: {
        type: T.ENUM("agendada", "realizada", "cancelada"),
        allowNull: false,
        defaultValue: "agendada",
      },
      // ficam vazios até a consulta ser realizada
      diagnostico: { type: T.TEXT, allowNull: true },
      evolucaoClinica: { type: T.TEXT, allowNull: true },
      observacoes: { type: T.TEXT, allowNull: true },
    },
    { tableName: "consulta", underscored: true, timestamps: false },
  );