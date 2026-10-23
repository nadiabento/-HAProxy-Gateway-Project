// Nadia: valida o corpo do pedido antes de chegar ao controller.
// Uso: router.post('/', validate({ nome: { required: true, type: 'string' }, idade: { type: 'number' } }), criar)
module.exports = (regras) => (req, res, next) => {
  const faltam = [];
  const tipoErrado = [];
  const corpo = req.body || {};

  for (const [campo, regra] of Object.entries(regras)) {
    const valor = corpo[campo];
    const vazio = valor === undefined || valor === null || valor === "";
    if (vazio) {
      if (regra.required) faltam.push(campo);
      continue;
    }
    if (regra.type && typeof valor !== regra.type)
      tipoErrado.push(`${campo} deve ser ${regra.type}`);
  }

  if (faltam.length || tipoErrado.length) {
    return res
      .status(400)
      .json({ erro: "Dados inválidos", em_falta: faltam, tipos: tipoErrado });
  }
  next();
};
