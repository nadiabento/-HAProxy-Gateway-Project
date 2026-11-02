const { DataTypes: T } = require("sequelize");

// Tabela de ligação com colunas extra. As chaves consulta_id e tecnica_id
// (que formam a chave primária) são acrescentadas sozinhas pelo belongsToMany.
module.exports = (sequelize) =>
  sequelize.define(
    "ConsultaTecnica",
    {
      tempoMinutos: { type: T.INTEGER, allowNull: true, validate: { min: 0 } },
      parametros: { type: T.TEXT, allowNull: true }, // ex.: "80 Hz, intensidade 20 mA"
    },
    { tableName: "consulta_tecnica", underscored: true, timestamps: false },
  );