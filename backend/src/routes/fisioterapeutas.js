const router = require("express").Router();
const { verificarToken, autorizarPerfis } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const c = require("../controllers/fisioterapeutasController");

const staff = autorizarPerfis("administrador", "rececionista", "fisioterapeuta");
const admin = autorizarPerfis("administrador");

router.use(verificarToken, staff);
router.get("/", c.listar);
router.get("/:id", c.obter);
router.post("/", admin,
  validate({ nome: { required: true, type: "string" }, email: { required: true, type: "string" } }),
  c.criar);
router.put("/:id", admin, c.atualizar);
router.delete("/:id", admin, c.apagar);

module.exports = router;