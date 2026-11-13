const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const client = require("prom-client");
const sequelize = require("./config/database");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

// ---- Observabilidade (Nadia) ----
// Métricas por defeito do Node (CPU, memória, etc.) para o Prometheus
client.collectDefaultMetrics();

// Conta os pedidos HTTP por método, rota e código de estado
const pedidos = new client.Counter({
  name: "http_requests_total",
  help: "Total de pedidos HTTP",
  labelNames: ["metodo", "rota", "estado"],
});
app.use((req, res, next) => {
  res.on("finish", () => {
    const rota = req.route ? req.baseUrl + req.route.path : "outra";
    pedidos.inc({ metodo: req.method, rota, estado: res.statusCode });
  });
  next();
});

// Liveness: o processo está vivo (não depende da BD)
app.get("/healthz", (req, res) => res.status(200).json({ status: "vivo" }));

// Readiness: só está pronto se a BD responder (503 se não)
app.get("/readyz", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "pronto", db: "up" });
  } catch (e) {
    res.status(503).json({ status: "nao-pronto", db: "down" });
  }
});

// Métricas no formato Prometheus
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// ---- rotas (cada dono acrescenta a sua linha quando o ficheiro existir) ----
app.use("/api", require("./routes/health")); // Jessica (versão provisória da Nadia)
app.use("/api/auth", require("./routes/auth")); // Nadia
app.use("/api/utilizadores", require("./routes/utilizadores"));
// app.use('/api/fisioterapeutas', require('./routes/fisioterapeutas'));  // Nadia
app.use("/api/pacientes", require("./routes/pacientes")); // Jessica
app.use("/api/consultas", require("./routes/consultas")); // Jessica
app.use("/api/tecnicas", require("./routes/tecnicas")); // Jessica

// qualquer /api desconhecido dá 404 em JSON
app.use("/api", (req, res) =>
  res.status(404).json({ erro: "Rota não encontrada" }),
);

app.use(errorHandler);
module.exports = app;