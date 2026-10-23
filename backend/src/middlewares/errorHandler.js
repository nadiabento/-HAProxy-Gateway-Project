// Nadia: converte erros em JSON com o código certo e sem detalhes internos.
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.type === "entity.parse.failed")
    return res.status(400).json({ erro: "JSON inválido" });
  if (err.name === "SequelizeValidationError") {
    return res
      .status(400)
      .json({
        erro: "Dados inválidos",
        campos: err.errors.map((e) => ({ campo: e.path, mensagem: e.message })),
      });
  }
  if (err.name === "SequelizeUniqueConstraintError") {
    return res
      .status(409)
      .json({
        erro: "Já existe um registo com esse valor",
        campos: err.errors.map((e) => e.path),
      });
  }
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res
      .status(409)
      .json({
        erro: "Operação bloqueada: há registos ligados ou a referência não existe",
      });
  }
  if (err.status) return res.status(err.status).json({ erro: err.message });

  console.error("[api] erro não tratado:", err);
  res.status(500).json({ erro: "Erro interno" });
};
