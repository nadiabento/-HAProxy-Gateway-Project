module.exports = {
  dialect: "mariadb",
  replication: {
    write: {
      host: process.env.DB_HOST || "192.168.56.13",
      port: process.env.DB_PORT || 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    read: [
      {
        host: process.env.DB_REPLICA_HOST || "192.168.56.12",
        port: process.env.DB_REPLICA_PORT || 3306,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      },
    ],
  },
  database: process.env.DB_NAME,
  logging: false,
};
