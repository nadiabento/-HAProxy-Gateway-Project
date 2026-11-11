const bcrypt = require("bcrypt");
const { sequelize, Utilizador, DadosPessoais, Paciente } = require("../models");

const incluir = [{ model: DadosPessoais, as: "dadosPessoais" }];
const STAFF = ["administrador", "rececionista", "fisioterapeuta"];

exports.listar = async (req, res, next) => {
  try {
    res.json(await Paciente.findAll({ include: incluir }));
  } catch (e) { next(e); }
};

exports.obter = async (req, res, next) => {
  try {
    const p = await Paciente.findByPk(req.params.id, { include: incluir });
    if (!p) return res.status(404).json({ erro: "Paciente não encontrado" });
    const eStaff = (req.user.perfis || []).some((x) => STAFF.includes(x));
    if (!eStaff && p.dadosPessoais.utilizadorId !== req.user.id)
      return res.status(403).json({ erro: "Só pode ver os seus próprios dados" });
    res.json(p);
  } catch (e) { next(e); }
};

exports.criar = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { nome, email, contacto, dataNascimento, morada, password } = req.body;
    const u = await Utilizador.create(
      { passwordHash: password ? await bcrypt.hash(password, 10) : null,
        estado: password ? "ativo" : "pendente" },
      { transaction: t },
    );
    const dp = await DadosPessoais.create(
      { utilizadorId: u.id, nome, email: email.toLowerCase().trim(), contacto, dataNascimento, morada },
      { transaction: t },
    );
    const pac = await Paciente.create({ dadosPessoaisId: dp.id }, { transaction: t });
    await sequelize.query(
      "INSERT INTO perfil_utilizador (utilizador_id, perfil_id) SELECT ?, id FROM perfil WHERE tipo_perfil = 'paciente'",
      { replacements: [u.id], transaction: t },
    );
    await t.commit();
    res.status(201).json(await Paciente.findByPk(pac.id, { include: incluir }));
  } catch (e) { await t.rollback(); next(e); }
};

exports.atualizar = async (req, res, next) => {
  try {
    const p = await Paciente.findByPk(req.params.id, { include: incluir });
    if (!p) return res.status(404).json({ erro: "Paciente não encontrado" });
    const { nome, email, contacto, dataNascimento, morada } = req.body;
    await p.dadosPessoais.update({
      ...(nome !== undefined && { nome }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(contacto !== undefined && { contacto }),
      ...(dataNascimento !== undefined && { dataNascimento }),
      ...(morada !== undefined && { morada }),
    });
    res.json(p);
  } catch (e) { next(e); }
};

// Se o paciente tiver consultas, a FK bloqueia e o errorHandler devolve 409.
exports.apagar = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const p = await Paciente.findByPk(req.params.id, { include: incluir, transaction: t });
    if (!p) { await t.rollback(); return res.status(404).json({ erro: "Paciente não encontrado" }); }
    const uid = p.dadosPessoais.utilizadorId;
    await sequelize.query("DELETE FROM perfil_utilizador WHERE utilizador_id = ?", { replacements: [uid], transaction: t });
    await p.destroy({ transaction: t });
    await p.dadosPessoais.destroy({ transaction: t });
    await Utilizador.destroy({ where: { id: uid }, transaction: t });
    await t.commit();
    res.status(204).end();
  } catch (e) { await t.rollback(); next(e); }
};