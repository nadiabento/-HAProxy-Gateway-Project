// Usado só pelo sequelize-cli (npm run migrate). Lê as mesmas variáveis do .env.
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mariadb",
};
module.exports = { development: base, production: base };
