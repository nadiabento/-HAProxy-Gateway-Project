// Corre só na vm1 (RUN_MIGRATIONS=true), antes de a API arrancar.
// sequelize.sync() cria o que falta e nunca apaga nem altera tabelas existentes.
const { sequelize } = require("./models");
const { semear } = require("../seeders/seed");

async function esperarPelaBD(tentativas = 30, esperaMs = 2000) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (e) {
      console.log(
        `[db-init] base de dados indisponível (${i}/${tentativas}): ${e.message}`,
      );
      await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
  throw new Error("base de dados indisponível");
}

async function main() {
  await esperarPelaBD();
  await sequelize.sync();
  console.log("[db-init] tabelas criadas ou já existentes");
  await semear();
  await sequelize.close();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[db-init] erro:", e);
    process.exit(1);
  });