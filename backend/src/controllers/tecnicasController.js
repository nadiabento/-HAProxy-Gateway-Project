const { Tecnica } = require("../models");

exports.listar = async (req, res, next) => {
  try {
    const where = req.query.todas === "true" ? {} : { ativa: true };
    res.json(await Tecnica.findAll({ where, order: [["nome", "ASC"]] }));
  } catch (e) { next(e); }
};

exports.obter = async (req, res, next) => {
  try {
    const t = await Tecnica.findByPk(req.params.id);
    if (!t) return res.status(404).json({ erro: "Técnica não encontrada" });
    res.json(t);
  } catch (e) { next(e); }
};

exports.criar = async (req, res, next) => {
  try {
    const { nome, categoria } = req.body;
    res.status(201).json(await Tecnica.create({ nome, categoria }));
  } catch (e) { next(e); }
};

exports.atualizar = async (req, res, next) => {
  try {
    const t = await Tecnica.findByPk(req.params.id);
    if (!t) return res.status(404).json({ erro: "Técnica não encontrada" });
    const { nome, categoria, ativa } = req.body;
    await t.update({
      ...(nome !== undefined && { nome }),
      ...(categoria !== undefined && { categoria }),
      ...(ativa !== undefined && { ativa }),
    });
    res.json(t);
  } catch (e) { next(e); }
};

// Não se apaga: desativa, para manter as consultas antigas intactas.
exports.desativar = async (req, res, next) => {
  try {
    const t = await Tecnica.findByPk(req.params.id);
    if (!t) return res.status(404).json({ erro: "Técnica não encontrada" });
    await t.update({ ativa: false });
    res.status(204).end();
  } catch (e) { next(e); }
};