// Nadia: arranque do servidor. Espera pela base de dados e fecha com cuidado.
const app = require("./app");
const sequelize = require("./config/database");

const PORT = Number(process.env.API_PORT || 3000);

async function esperarPelaBD(tentativas = 30, esperaMs = 2000) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      await sequelize.authenticate();
      console.log("[api] base de dados disponível");
      return;
    } catch (e) {
      console.log(
        `[api] base de dados indisponível (${i}/${tentativas}): ${e.message}`,
      );
      await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
  // na vm2 a base de dados pode estar noutra máquina: arrancamos na mesma e o /api/health diz db=down
  console.warn(
    "[api] a arrancar sem base de dados; /api/health indica db=down",
  );
}

async function main() {
  await esperarPelaBD();
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[api] a ouvir na porta ${PORT} (${process.env.VM_NAME || "vm?"})`,
    );
  });

  const fechar = (sinal) => {
    console.log(`[api] ${sinal} recebido, a fechar`);
    server.close(async () => {
      await sequelize.close().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => fechar("SIGTERM"));
  process.on("SIGINT", () => fechar("SIGINT"));
}

main().catch((e) => {
  console.error("[api] erro fatal", e);
  process.exit(1);
});
