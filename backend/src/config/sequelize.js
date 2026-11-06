// Instância Sequelize (Jessica). A réplica só é usada se DB_REPLICA_HOST estiver definido.
const { Sequelize } = require("sequelize");

const base = {
  dialect: "mariadb",
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: { underscored: true },
};

const escrita = {
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const sequelize = process.env.DB_REPLICA_HOST
  ? new Sequelize(process.env.DB_NAME, null, null, {
      ...base,
      replication: {
        write: escrita,
        read: [
          {
            host: process.env.DB_REPLICA_HOST,
            port: Number(process.env.DB_REPLICA_PORT || 3306),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
          },
        ],
      },
    })
  : new Sequelize(process.env.DB_NAME, escrita.username, escrita.password, {
      ...base,
      host: escrita.host,
      port: escrita.port,
    });

module.exports = sequelize;