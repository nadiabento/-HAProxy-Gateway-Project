// dados iniciais. Os perfis inserem-se sempre (sem repetir);
// os dados de demonstração só entram numa base vazia.
const bcrypt = require("bcryptjs");
const {
  Utilizador,
  Perfil,
  DadosPessoais,
  Paciente,
  Fisioterapeuta,
  Rececionista,
  Consulta,
  Tecnica,
} = require("../src/models");

const SENHA_DE_TESTE = "clinica123"; // só para desenvolvimento
const TIPOS_PERFIL = ["paciente", "fisioterapeuta", "rececionista", "administrador"];
const DIA = 24 * 60 * 60 * 1000;

async function semear() {
  for (const tipoPerfil of TIPOS_PERFIL) {
    await Perfil.findOrCreate({ where: { tipoPerfil } });
  }

  if ((await DadosPessoais.count()) > 0) {
    console.log("[seed] já existem dados, só os perfis foram verificados");
    return;
  }

  const perfis = Object.fromEntries(
    (await Perfil.findAll()).map((p) => [p.tipoPerfil, p]),
  );
  const hash = await bcrypt.hash(SENHA_DE_TESTE, 10);

  // utilizador + dados pessoais + perfis. ativo=false deixa a conta "pendente" (sem palavra-passe)
  async function criarPessoa({ tipos, ativo = true, ...dados }) {
    const utilizador = await Utilizador.create({
      passwordHash: ativo ? hash : null,
      estado: ativo ? "ativo" : "pendente",
    });
    const pessoa = await DadosPessoais.create({
      utilizadorId: utilizador.id,
      ...dados,
    });
    await utilizador.setPerfis(tipos.map((t) => perfis[t]));
    return pessoa;
  }

  // equipa
  const dAna = await criarPessoa({
    nome: "Ana Costa",
    email: "ana.costa@clinica.pt",
    contacto: "911111111",
    tipos: ["fisioterapeuta", "administrador"],
  });
  const dRui = await criarPessoa({
    nome: "Rui Ferreira",
    email: "rui.ferreira@clinica.pt",
    contacto: "922222222",
    tipos: ["fisioterapeuta"],
  });
  const dSofia = await criarPessoa({
    nome: "Sofia Lima",
    email: "sofia.lima@clinica.pt",
    contacto: "933333333",
    tipos: ["fisioterapeuta"],
  });
  const dMarta = await criarPessoa({
    nome: "Marta Reis",
    email: "marta.reis@clinica.pt",
    contacto: "944444444",
    tipos: ["rececionista"],
  });

  // pacientes (o Manel ainda não ativou a conta)
  const dJoao = await criarPessoa({
    nome: "João Silva",
    email: "joao.silva@exemplo.pt",
    contacto: "919999999",
    dataNascimento: "1985-05-15",
    morada: "Viana do Castelo",
    tipos: ["paciente"],
  });
  const dMaria = await criarPessoa({
    nome: "Maria Santos",
    email: "maria.santos@exemplo.pt",
    contacto: "919888888",
    dataNascimento: "1990-03-20",
    morada: "Braga",
    tipos: ["paciente"],
  });
  const dManel = await criarPessoa({
    nome: "Manel Sousa",
    email: "manel.sousa@exemplo.pt",
    contacto: "919777777",
    dataNascimento: "1978-11-02",
    morada: "Ponte de Lima",
    ativo: false,
    tipos: ["paciente"],
  });

  // tabelas de perfil
  const ana = await Fisioterapeuta.create({
    dadosPessoaisId: dAna.id,
    especialidade: "Desporto",
  });
  const rui = await Fisioterapeuta.create({
    dadosPessoaisId: dRui.id,
    especialidade: "Ortopedia",
  });
  const sofia = await Fisioterapeuta.create({
    dadosPessoaisId: dSofia.id,
    especialidade: "Reabilitação",
  });
  await Rececionista.create({ dadosPessoaisId: dMarta.id });
  const joao = await Paciente.create({ dadosPessoaisId: dJoao.id });
  const maria = await Paciente.create({ dadosPessoaisId: dMaria.id });
  const manel = await Paciente.create({ dadosPessoaisId: dManel.id });

  // quem acompanha quem (N:M)
  await ana.setPacientes([joao, manel]);
  await rui.setPacientes([maria]);
  await sofia.setPacientes([joao]);

  // catálogo de técnicas
  const [tens, ultrassom, vacuo, eletro] = await Tecnica.bulkCreate(
    [
      { nome: "Corrente TENS", categoria: "Eletroterapia" },
      { nome: "Ultrassom Terapêutico", categoria: "Eletroterapia" },
      { nome: "Vacuoterapia", categoria: "Terapia manual" },
      { nome: "Eletroestimulação", categoria: "Eletroterapia" },
    ],
    { returning: true },
  );

  // consultas
  const agora = Date.now();
  const c1 = await Consulta.create({
    pacienteId: joao.id,
    fisioterapeutaId: ana.id,
    dataHora: new Date(agora - 2 * DIA),
    duracaoMinutos: 45,
    estado: "realizada",
    diagnostico: "Entorse de tornozelo grau II",
    evolucaoClinica: "Redução do edema e mobilidade em melhoria.",
    observacoes: "Manter gelo 3 vezes por dia.",
  });
  await c1.addTecnicas(ultrassom, {
    through: { tempoMinutos: 8, parametros: "1 MHz, 1 W/cm2" },
  });
  await c1.addTecnicas(tens, {
    through: { tempoMinutos: 20, parametros: "80 Hz, intensidade 20 mA" },
  });

  const c2 = await Consulta.create({
    pacienteId: maria.id,
    fisioterapeutaId: rui.id,
    dataHora: new Date(agora - 1 * DIA),
    duracaoMinutos: 30,
    estado: "realizada",
    diagnostico: "Lombalgia crónica",
    evolucaoClinica: "Dor reduzida de 7 para 5.",
  });
  await c2.addTecnicas(eletro, {
    through: { tempoMinutos: 15, parametros: "50 Hz, 300 µs" },
  });

  // marcações futuras (sem dados clínicos ainda)
  await Consulta.create({
    pacienteId: joao.id,
    fisioterapeutaId: sofia.id,
    dataHora: new Date(agora + 1 * DIA),
    duracaoMinutos: 30,
  });
  await Consulta.create({
    pacienteId: manel.id,
    fisioterapeutaId: ana.id,
    dataHora: new Date(agora + 2 * DIA),
    duracaoMinutos: 30,
  });

  console.log(
    `[seed] dados de teste criados (palavra-passe de todos: ${SENHA_DE_TESTE})`,
  );
}

module.exports = { semear };