const base = {
  username: process.env.DB_USER || "clinica",
  password: process.env.DB_PASSWORD || "mudar_isto",
  database: process.env.DB_NAME || "clinica",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  dialect: "mariadb",
};
module.exports = {
  development: base,
  production: base
};