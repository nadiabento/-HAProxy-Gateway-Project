const router = require("express").Router();
const { verificarToken, autorizarPerfis } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const c = require("../controllers/consultasController");

const staff = autorizarPerfis("administrador", "rececionista", "fisioterapeuta");
const agendar = autorizarPerfis("administrador", "rececionista");
const clinico = autorizarPerfis("administrador", "fisioterapeuta");

router.use(verificarToken);
router.get("/", c.listar);          // paciente: só as suas
router.get("/:id", c.obter);        // paciente: só se for a sua
router.post("/", agendar,
  validate({
    pacienteId: { required: true, type: "number" },
    fisioterapeutaId: { required: true, type: "number" },
    dataHora: { required: true, type: "string" },
  }),
  c.criar);
router.put("/:id", staff, c.atualizar);
router.delete("/:id", autorizarPerfis("administrador"), c.apagar);

router.post("/:id/tecnicas", clinico,
  validate({ tecnicaId: { required: true, type: "number" } }),
  c.adicionarTecnica);
router.delete("/:id/tecnicas/:tecnicaId", clinico, c.removerTecnica);

module.exports = router;