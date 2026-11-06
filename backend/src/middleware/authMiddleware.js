const jwt = require('jsonwebtoken');

// Verifica se o token existe e é válido
const authenticate = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Separa a string por espaços. O split(' ')[1] apanha o token quer haja 'Bearer' antes ou não.
    const parts = authHeader.split(' ');
    if (parts.length === 2) {
      token = parts[1];
    } else {
      token = authHeader; // Se enviaste só o token sem o prefixo Bearer
    }
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token em falta ou mal formatado no cabeçalho.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao_ha_gateway');
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// Verifica se o utilizador tem o cargo necessário
const authorize = (...roles) => (req, res, next) => {
  // O authController guarda os perfis num array chamado 'perfis'
  const userRoles = req.user.perfis || [];
  
  // Converte os perfis para lowercase para facilitar a comparação
  const hasRole = userRoles.some(role => roles.includes(role.toLowerCase()));

  // Se o utilizador não tiver a role e não for o admin principal, bloqueia o acesso
  if (!hasRole && req.user.email !== 'admin@prc.pt') {
    return res.status(403).json({ error: 'Acesso não autorizado.' });
  }
  
  next();
};

module.exports = { authenticate, authorize };