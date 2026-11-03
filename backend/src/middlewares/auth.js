// Importação da biblioteca JWT para validação criptográfica de assinaturas
const jwt = require("jsonwebtoken");

// Chave secreta partilhada para validação do token
const JWT_SECRET = process.env.JWT_SECRET || "chave_secreta_padrao_ha_gateway";

/**
 * Middleware: verificarToken
 * Interceta o pedido e verifica se existe um token JWT válido no cabeçalho Authorization.
 */
function verificarToken(req, res, next) {
  // 1. Procura o cabeçalho "Authorization" no pedido HTTP
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      erro: "Acesso não autorizado: token de autenticação em falta.",
    });
  }

  // 2. O formato padrão esperado é "Bearer <token>"
  const partes = authHeader.split(" ");
  if (partes.length !== 2 || partes[0] !== "Bearer") {
    return res.status(401).json({
      erro: "Formato de token inválido. O cabeçalho deve ser 'Bearer <token>'.",
    });
  }

  const token = partes[1];

  // 3. Validação matemática da assinatura e expiração do token
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Injeta os dados do utilizador ({ id, email, perfis }) no objeto do pedido
    // Fica disponível em todas as rotas e controladores subsequentes
    req.user = payload;

    // Permite que o fluxo prossiga para o próximo middleware ou controlador
    return next();
  } catch (err) {
    // Tratamento diferenciado caso o token apenas tenha expirado
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        erro: "Sessão expirada. Por favor, inicie sessão novamente.",
      });
    }
    // Caso de assinatura forjada, token adulterado ou mal formatado
    return res.status(401).json({
      erro: "Token de autenticação inválido ou corrompido.",
    });
  }
}

/*Middleware de Autorização: autorizarPerfis
 * Recebe uma lista de papéis e verifica se o utilizador autenticado tem pelo menos um deles.
 * Exemplo de uso na rota: autorizarPerfis('administrador', 'rececionista')
 */
function autorizarPerfis(...perfisPermitidos) {
  return (req, res, next) => {
    // 1. Confirma se o utilizador passou previamente pelo middleware de autenticação
    if (!req.user || !req.user.perfis) {
      return res.status(403).json({
        erro: "Acesso proibido: perfil de utilizador não encontrado.",
      });
    }

    // 2. Verifica se algum dos perfis do utilizador consta na lista de permitidos
    const temPermissao = req.user.perfis.some((perfil) =>
      perfisPermitidos.includes(perfil),
    );

    // 3. Se não tiver privilégios suficientes, bloqueia com 403 (Forbidden)
    if (!temPermissao) {
      return res.status(403).json({
        erro: "Acesso negado: não tem permissões para aceder a este recurso.",
      });
    }

    // Utilizador autorizado, avança para o controlador
    return next();
  };
}

module.exports = {
  verificarToken,
  autorizarPerfis,
};
