const bcrypt = require("bcrypt");
const { sequelize, Utilizador, DadosPessoais, Fisioterapeuta } = require("../models");

const incluir = [{ model: DadosPessoais, as: "dadosPessoais" }];

exports.listar = async (req, res, next) => {
  try {
    res.json(await Fisioterapeuta.findAll({ include: incluir }));
  } catch (e) { next(e); }
};

exports.obter = async (req, res, next) => {
  try {
    const f = await Fisioterapeuta.findByPk(req.params.id, { include: incluir });
    if (!f) return res.status(404).json({ erro: "Fisioterapeuta não encontrado" });
    res.json(f);
  } catch (e) { next(e); }
};

exports.criar = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { nome, email, contacto, dataNascimento, morada, especialidade, password } = req.body;
    const u = await Utilizador.create(
      { passwordHash: password ? await bcrypt.hash(password, 10) : null,
        estado: password ? "ativo" : "pendente" },
      { transaction: t },
    );
    const dp = await DadosPessoais.create(
      { utilizadorId: u.id, nome, email: email.toLowerCase().trim(), contacto, dataNascimento, morada },
      { transaction: t },
    );
    const f = await Fisioterapeuta.create({ dadosPessoaisId: dp.id, especialidade }, { transaction: t });
    await sequelize.query(
      "INSERT INTO perfil_utilizador (utilizador_id, perfil_id) SELECT ?, id FROM perfil WHERE tipo_perfil = 'fisioterapeuta'",
      { replacements: [u.id], transaction: t },
    );
    await t.commit();
    res.status(201).json(await Fisioterapeuta.findByPk(f.id, { include: incluir }));
  } catch (e) { await t.rollback(); next(e); }
};

exports.atualizar = async (req, res, next) => {
  try {
    const f = await Fisioterapeuta.findByPk(req.params.id, { include: incluir });
    if (!f) return res.status(404).json({ erro: "Fisioterapeuta não encontrado" });
    const { nome, email, contacto, dataNascimento, morada, especialidade } = req.body;
    await f.dadosPessoais.update({
      ...(nome !== undefined && { nome }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(contacto !== undefined && { contacto }),
      ...(dataNascimento !== undefined && { dataNascimento }),
      ...(morada !== undefined && { morada }),
    });
    if (especialidade !== undefined) await f.update({ especialidade });
    res.json(f);
  } catch (e) { next(e); }
};

// Com consultas associadas, a FK bloqueia e o errorHandler devolve 409.
exports.apagar = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const f = await Fisioterapeuta.findByPk(req.params.id, { include: incluir, transaction: t });
    if (!f) { await t.rollback(); return res.status(404).json({ erro: "Fisioterapeuta não encontrado" }); }
    const uid = f.dadosPessoais.utilizadorId;
    await sequelize.query("DELETE FROM perfil_utilizador WHERE utilizador_id = ?", { replacements: [uid], transaction: t });
    await f.destroy({ transaction: t });
    await f.dadosPessoais.destroy({ transaction: t });
    await Utilizador.destroy({ where: { id: uid }, transaction: t });
    await t.commit();
    res.status(204).end();
  } catch (e) { await t.rollback(); next(e); }
};