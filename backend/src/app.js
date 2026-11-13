const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

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