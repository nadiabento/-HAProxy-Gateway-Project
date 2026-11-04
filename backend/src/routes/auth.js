// Criação do router modular do Express
const express = require("express");
const router = express.Router();

// Importação do controlador de autenticação e dos middlewares de controlo de acesso
const authController = require("../controllers/authController");
const { verificarToken } = require("../middlewares/auth");

// --- ROTAS PÚBLICAS ---
// Submissão de credenciais para autenticação e obtenção do JWT
router.post("/login", authController.login);

// --- ROTAS PROTEGIDAS ---
// Consulta dos dados do perfil atual (exige que o cliente envie o token Bearer válido)
router.get("/me", verificarToken, authController.me);

// Exportação do router para montagem no app.js principal (ex: app.use("/api/auth", authRoutes))
module.exports = router;
