// Nadia: ligação Sequelize ao MariaDB (variáveis vêm do .env).
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "db",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mariadb",
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { underscored: true }, // created_at, updated_at, *_id
  },
);

module.exports = sequelize;
