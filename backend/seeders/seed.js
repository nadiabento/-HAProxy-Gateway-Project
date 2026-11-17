// Dados iniciais. Pode correr várias vezes: só cria o que falta.
const bcrypt = require("bcrypt");
const {
  sequelize, Perfil, Utilizador, DadosPessoais,
  Paciente, Fisioterapeuta, Rececionista, Administrador, Tecnica,
} = require("../src/models");

const PERFIS = ["administrador", "rececionista", "fisioterapeuta", "paciente"];

async function criarPessoa({ nome, email, password, perfil, Modelo, extra = {} }) {
  const existente = await DadosPessoais.findOne({ where: { email } });
  if (existente) return existente;

  const u = await Utilizador.create({
    passwordHash: await bcrypt.hash(password, 10),
    estado: "ativo",
  });
  const dp = await DadosPessoais.create({ utilizadorId: u.id, nome, email });
  await sequelize.query(
    "INSERT IGNORE INTO perfil_utilizador (utilizador_id, perfil_id) SELECT ?, id FROM perfil WHERE tipo_perfil = ?",
    { replacements: [u.id, perfil] },
  );
  await Modelo.create({ dadosPessoaisId: dp.id, ...extra });
  return dp;
}

async function semear() {
  for (const tipoPerfil of PERFIS) {
    await Perfil.findOrCreate({ where: { tipoPerfil } });
  }

  await criarPessoa({ nome: "Admin Principal", email: "admin@prc.pt", password: "admin123", perfil: "administrador", Modelo: Administrador });
  await criarPessoa({ nome: "Rita Receção", email: "rececao@prc.pt", password: "rececao123", perfil: "rececionista", Modelo: Rececionista });
  await criarPessoa({ nome: "Filipe Fisio", email: "fisio@prc.pt", password: "fisio123", perfil: "fisioterapeuta", Modelo: Fisioterapeuta, extra: { especialidade: "musculoesquelética" } });
  await criarPessoa({ nome: "Paula Paciente", email: "paciente@prc.pt", password: "paciente123", perfil: "paciente", Modelo: Paciente });

  for (const [nome, categoria] of [
    ["Ultrassons", "Eletroterapia"],
    ["TENS", "Eletroterapia"],
    ["Mobilização articular", "Terapia manual"],
    ["Cinesiterapia", "Exercício"],
  ]) {
    await Tecnica.findOrCreate({ where: { nome }, defaults: { categoria } });
  }
  console.log("[seed] dados iniciais prontos");
}

module.exports = { semear };