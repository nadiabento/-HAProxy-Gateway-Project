// A tabela de ligação perfil_utilizador não tem ficheiro: o belongsToMany
// cria-a sozinho no sequelize.sync().
const sequelize = require("../config/sequelize");

const Utilizador = require("./Utilizador")(sequelize);
const Perfil = require("./Perfil")(sequelize);
const DadosPessoais = require("./DadosPessoais")(sequelize);
const Paciente = require("./Paciente")(sequelize);
const Fisioterapeuta = require("./Fisioterapeuta")(sequelize);
const Rececionista = require("./Rececionista")(sequelize);
const Administrador = require("./Administrador")(sequelize);
const Consulta = require("./Consulta")(sequelize);
const Tecnica = require("./Tecnica")(sequelize);
const ConsultaTecnica = require("./ConsultaTecnica")(sequelize);

// dados_pessoais.utilizador_id (1:1)
Utilizador.hasOne(DadosPessoais, {
  foreignKey: "utilizadorId",
  as: "dadosPessoais",
  onDelete: "RESTRICT",
});
DadosPessoais.belongsTo(Utilizador, {
  foreignKey: "utilizadorId",
  as: "utilizador",
});

// paciente, fisioterapeuta e rececionista apontam para dados_pessoais (1:1)
for (const [Modelo, alias] of [
  [Paciente, "paciente"],
  [Fisioterapeuta, "fisioterapeuta"],
  [Rececionista, "rececionista"],
  [Administrador, "administrador"],
]) {
  DadosPessoais.hasOne(Modelo, {
    foreignKey: "dadosPessoaisId",
    as: alias,
    onDelete: "RESTRICT",
  });
  Modelo.belongsTo(DadosPessoais, {
    foreignKey: "dadosPessoaisId",
    as: "dadosPessoais",
  });
}

// N:M utilizador <-> perfil (tabela perfil_utilizador, automática)
Utilizador.belongsToMany(Perfil, {
  through: "perfil_utilizador",
  foreignKey: "utilizadorId",
  otherKey: "perfilId",
  as: "perfis",
  timestamps: false,
});
Perfil.belongsToMany(Utilizador, {
  through: "perfil_utilizador",
  foreignKey: "perfilId",
  otherKey: "utilizadorId",
  as: "utilizadores",
  timestamps: false,
});

// consulta (o histórico clínico não se apaga em cascata)
Paciente.hasMany(Consulta, {
  foreignKey: "pacienteId",
  as: "consultas",
  onDelete: "RESTRICT",
});
Consulta.belongsTo(Paciente, { foreignKey: "pacienteId", as: "paciente" });
Fisioterapeuta.hasMany(Consulta, {
  foreignKey: "fisioterapeutaId",
  as: "consultas",
  onDelete: "RESTRICT",
});
Consulta.belongsTo(Fisioterapeuta, {
  foreignKey: "fisioterapeutaId",
  as: "fisioterapeuta",
});

// N:M consulta <-> tecnica (com tempo e parâmetros em ConsultaTecnica)
Consulta.belongsToMany(Tecnica, {
  through: ConsultaTecnica,
  foreignKey: "consultaId",
  otherKey: "tecnicaId",
  as: "tecnicas",
});
Tecnica.belongsToMany(Consulta, {
  through: ConsultaTecnica,
  foreignKey: "tecnicaId",
  otherKey: "consultaId",
  as: "consultas",
});

module.exports = {
  sequelize,
  Utilizador,
  Perfil,
  DadosPessoais,
  Paciente,
  Fisioterapeuta,
  Rececionista,
  Administrador,
  Consulta,
  Tecnica,
  ConsultaTecnica,
};