const {
  Consulta, ConsultaTecnica, Paciente, Fisioterapeuta, DadosPessoais, Tecnica,
} = require("../models");
const { soFisioterapeuta, meuFisioterapeutaId } = require("../utils/escopoFisioterapeuta");

const STAFF = ["administrador", "rececionista", "fisioterapeuta"];
const eStaff = (req) => (req.user.perfis || []).some((p) => STAFF.includes(p));

const incluir = [
  { model: Paciente, as: "paciente", include: [{ model: DadosPessoais, as: "dadosPessoais" }] },
  { model: Fisioterapeuta, as: "fisioterapeuta", include: [{ model: DadosPessoais, as: "dadosPessoais" }] },
  { model: Tecnica, as: "tecnicas" },
];

// id do paciente que corresponde ao utilizador autenticado
async function meuPacienteId(req) {
  const p = await Paciente.findOne({
    include: [{ model: DadosPessoais, as: "dadosPessoais", where: { utilizadorId: req.user.id } }],
  });
  return p ? p.id : null;
}

// Devolve a consulta se a pessoa a puder ver; senão responde e devolve null.
async function carregar(req, res) {
  const c = await Consulta.findByPk(req.params.id, { include: incluir });
  if (!c) { res.status(404).json({ erro: "Consulta não encontrada" }); return null; }
  if (!eStaff(req) && c.pacienteId !== (await meuPacienteId(req))) {
    res.status(403).json({ erro: "Só pode ver as suas consultas" });
    return null;
  }
  // O fisioterapeuta só vê as consultas que são suas
  if (soFisioterapeuta(req) && c.fisioterapeutaId !== (await meuFisioterapeutaId(req))) {
    res.status(403).json({ erro: "Só pode ver as suas consultas" });
    return null;
  }
  return c;
}

exports.listar = async (req, res, next) => {
  try {
    const where = {};
    if (!eStaff(req)) where.pacienteId = (await meuPacienteId(req)) ?? -1;
    else if (req.query.pacienteId) where.pacienteId = req.query.pacienteId;
    if (req.query.fisioterapeutaId) where.fisioterapeutaId = req.query.fisioterapeutaId;
    // O fisioterapeuta só vê as suas consultas (ignora qualquer filtro que venha no pedido)
    if (soFisioterapeuta(req)) where.fisioterapeutaId = (await meuFisioterapeutaId(req)) ?? -1;
    if (req.query.estado) where.estado = req.query.estado;
    res.json(await Consulta.findAll({ where, include: incluir, order: [["dataHora", "DESC"]] }));
  } catch (e) { next(e); }
};

exports.obter = async (req, res, next) => {
  try {
    const c = await carregar(req, res);
    if (c) res.json(c);
  } catch (e) { next(e); }
};

exports.criar = async (req, res, next) => {
  try {
    const { pacienteId, fisioterapeutaId, dataHora, duracaoMinutos, estado } = req.body;
    if (isNaN(Date.parse(dataHora))) return res.status(400).json({ erro: "dataHora inválida" });
    const c = await Consulta.create({ pacienteId, fisioterapeutaId, dataHora, duracaoMinutos, estado });
    res.status(201).json(await Consulta.findByPk(c.id, { include: incluir }));
  } catch (e) { next(e); }
};

exports.atualizar = async (req, res, next) => {
  try {
    const c = await Consulta.findByPk(req.params.id);
    if (!c) return res.status(404).json({ erro: "Consulta não encontrada" });

    // O fisioterapeuta só altera as suas consultas, e só a parte clínica e o estado
    const fisio = soFisioterapeuta(req);
    if (fisio && c.fisioterapeutaId !== (await meuFisioterapeutaId(req))) {
      return res.status(403).json({ erro: "Só pode alterar as suas consultas" });
    }
    const campos = fisio
      ? ["estado", "diagnostico", "evolucaoClinica", "observacoes"]
      : ["pacienteId", "fisioterapeutaId", "dataHora", "duracaoMinutos",
         "estado", "diagnostico", "evolucaoClinica", "observacoes"];
    const dados = {};
    for (const k of campos) if (req.body[k] !== undefined) dados[k] = req.body[k];
    await c.update(dados);
    res.json(await Consulta.findByPk(c.id, { include: incluir }));
  } catch (e) { next(e); }
};

// O normal é pôr estado = "cancelada". O DELETE só existe para o administrador.
exports.apagar = async (req, res, next) => {
  try {
    const c = await Consulta.findByPk(req.params.id);
    if (!c) return res.status(404).json({ erro: "Consulta não encontrada" });
    await ConsultaTecnica.destroy({ where: { consultaId: c.id } });
    await c.destroy();
    res.status(204).end();
  } catch (e) { next(e); }
};

// ---- técnicas de uma consulta ----
exports.adicionarTecnica = async (req, res, next) => {
  try {
    const c = await Consulta.findByPk(req.params.id);
    if (!c) return res.status(404).json({ erro: "Consulta não encontrada" });
    if (soFisioterapeuta(req) && c.fisioterapeutaId !== (await meuFisioterapeutaId(req))) {
      return res.status(403).json({ erro: "Só pode alterar as suas consultas" });
    }
    const t = await Tecnica.findByPk(req.body.tecnicaId);
    if (!t) return res.status(404).json({ erro: "Técnica não encontrada" });
    if (!t.ativa) return res.status(400).json({ erro: "Técnica inativa" });
    const { tempoMinutos, parametros } = req.body;
    const ct = await ConsultaTecnica.create({
      consultaId: c.id, tecnicaId: t.id, tempoMinutos, parametros,
    });
    res.status(201).json(ct);
  } catch (e) { next(e); }
};

exports.removerTecnica = async (req, res, next) => {
  try {
    if (soFisioterapeuta(req)) {
      const c = await Consulta.findByPk(req.params.id);
      if (!c) return res.status(404).json({ erro: "Consulta não encontrada" });
      if (c.fisioterapeutaId !== (await meuFisioterapeutaId(req))) {
        return res.status(403).json({ erro: "Só pode alterar as suas consultas" });
      }
    }
    const n = await ConsultaTecnica.destroy({
      where: { consultaId: req.params.id, tecnicaId: req.params.tecnicaId },
    });
    if (!n) return res.status(404).json({ erro: "Ligação não encontrada" });
    res.status(204).end();
  } catch (e) { next(e); }
};