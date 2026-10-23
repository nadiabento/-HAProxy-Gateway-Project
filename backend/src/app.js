// Nadia: app Express. Os routers ligam-se aqui, um por linha.
const express = require("express");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.disable("x-powered-by");
app.use(express.json());

// ---- rotas (cada dono acrescenta a sua linha quando o ficheiro existir) ----
app.use("/api", require("./routes/health")); // Jessica (versão provisória da Nadia)
// app.use('/api/auth', require('./routes/auth'));                        // Nadia
// app.use('/api/fisioterapeutas', require('./routes/fisioterapeutas'));  // Nadia
// app.use('/api/ausencias', require('./routes/ausencias'));              // Nadia
// app.use('/api/substituicoes', require('./routes/substituicoes'));      // Nadia
// app.use('/api/pacientes', require('./routes/pacientes'));              // Jessica
// app.use('/api/tratamentos', require('./routes/tratamentos'));          // Jessica
// app.use('/api/relatorios', require('./routes/relatorios'));            // Jessica
// app.use('/api/planos', require('./routes/planos'));                    // Jessica
// app.use('/api/exercicios', require('./routes/exercicios'));            // Jessica

// qualquer /api desconhecido dá 404 em JSON
app.use("/api", (req, res) =>
  res.status(404).json({ erro: "Rota não encontrada" }),
);

app.use(errorHandler);
module.exports = app;
