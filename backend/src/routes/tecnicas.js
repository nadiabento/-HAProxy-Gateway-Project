const router = require("express").Router();
const { verificarToken, autorizarPerfis } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const c = require("../controllers/tecnicasController");

const staff = autorizarPerfis("administrador", "rececionista", "fisioterapeuta");
const gestao = autorizarPerfis("administrador", "fisioterapeuta");

router.use(verificarToken, staff);
router.get("/", c.listar);
router.get("/:id", c.obter);
router.post("/", gestao, validate({ nome: { required: true, type: "string" } }), c.criar);
router.put("/:id", gestao, c.atualizar);
router.delete("/:id", gestao, c.desativar);

module.exports = router;