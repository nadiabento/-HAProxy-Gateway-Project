// Regras de visibilidade do fisioterapeuta:
// um fisioterapeuta (que não seja também admin ou rececionista) só vê
// as suas consultas e os pacientes que têm consultas com ele.
const { Fisioterapeuta, DadosPessoais } = require("../models");

// true se o utilizador é só fisioterapeuta (o admin e a rececionista veem tudo)
function soFisioterapeuta(req) {
  const perfis = (req.user.perfis || []).map((p) => String(p).toLowerCase());
  return (
    perfis.includes("fisioterapeuta") &&
    !perfis.includes("administrador") &&
    !perfis.includes("rececionista")
  );
}

// id na tabela fisioterapeuta do utilizador autenticado (ou null)
async function meuFisioterapeutaId(req) {
  const f = await Fisioterapeuta.findOne({
    include: [{ model: DadosPessoais, as: "dadosPessoais", where: { utilizadorId: req.user.id }, attributes: [] }],
  });
  return f ? f.id : null;
}

module.exports = { soFisioterapeuta, meuFisioterapeutaId };