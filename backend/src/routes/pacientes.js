const router = require("express").Router();
const { verificarToken, autorizarPerfis } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const c = require("../controllers/pacienteController");

const staff = autorizarPerfis("administrador", "rececionista", "fisioterapeuta");
const recepcao = autorizarPerfis("administrador", "rececionista");

router.use(verificarToken);
router.get("/", staff, c.listar);
router.get("/:id", c.obter); // o paciente só vê o seu (verificado no controller)
router.post("/", recepcao,
  validate({ nome: { required: true, type: "string" }, email: { required: true, type: "string" } }),
  c.criar);
router.put("/:id", recepcao, c.atualizar);
router.delete("/:id", autorizarPerfis("administrador"), c.apagar);

module.exports = router;