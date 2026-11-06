const { Sequelize } = require("sequelize");

// Cria a ligação ao MariaDB no Docker
const sequelize = new Sequelize(
  process.env.DB_NAME || "clinica",
  process.env.DB_USER || "clinica",
  process.env.DB_PASSWORD || "mudar_isto",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3307,
    dialect: "mariadb",
    logging: false, // Define como console.log para ver as queries se precisares
  }
);

module.exports = sequelize; // Exporta a INSTÂNCIA