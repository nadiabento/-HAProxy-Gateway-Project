// PROVISÓRIO (Nadia). A Jessica fica com este ficheiro e pode acrescentar mais verificações.
// Devolve sempre 200 com o estado da base de dados, para o HAProxy não tirar a vm2 só porque a BD está na vm1.
const express = require("express");
const sequelize = require("../config/database");

const router = express.Router();

router.get("/health", async (req, res) => {
  let db = "up";
  try {
    await sequelize.authenticate();
  } catch (e) {
    db = "down";
  }
  res
    .status(200)
    .json({ status: "ok", vm: process.env.VM_NAME || "desconhecida", db });
});

module.exports = router;
