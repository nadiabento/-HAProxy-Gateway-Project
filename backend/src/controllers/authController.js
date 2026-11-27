// Importação de bibliotecas para encriptação (bcrypt) e gestão de tokens (JWT)
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Importação dos modelos Sequelize inicializados no index.js
const { Utilizador, DadosPessoais, Perfil } = require("../models");

// Leitura das variáveis de ambiente com valores de contingência (fallback)
const JWT_SECRET = process.env.JWT_SECRET || "chave_secreta_padrao_ha_gateway";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

module.exports = {
  /* POST /api/auth/login
   * Valida as credenciais do utilizador, o estado da conta e emite o token JWT.
   */
  async login(req, res) {
    try {
      // 1. Extração dos dados do corpo do pedido HTTP
      const { email, password } = req.body;

      // 2. Validação defensiva de entrada: rejeita pedidos sem credenciais completas
      if (!email || !password) {
        return res.status(400).json({
          erro: "Email e password são obrigatórios.",
        });
      }

      // 3. Procura o utilizador a partir do email (tabela dados_pessoais)
      // NOTA CRÍTICA: O modelo Utilizador tem um defaultScope que oculta a passwordHash.
      // É obrigatório usar .unscoped() para que o hash seja retornado da base de dados para validação.
      const utilizador = await Utilizador.unscoped().findOne({
        include: [
          {
            model: DadosPessoais,
            as: "dadosPessoais",
            // Sanitização simples: garante comparação insensível a maiúsculas e sem espaços
            where: { email: email.toLowerCase().trim() },
          },
          {
            model: Perfil,
            as: "perfis",
            // Omite os atributos da tabela associativa/pivot (PerfilUtilizador) do resultado final
            through: { attributes: [] },
          },
        ],
      });

      // 4. Se o utilizador não existir na base de dados, devolve erro 401 (Unauthorized)
      // Mensagem genérica para evitar enumeração de utilizadores (boa prática de segurança)
      if (!utilizador) {
        return res.status(401).json({ erro: "Credenciais inválidas." });
      }

      // 5. Verificação do ciclo de vida da conta
      if (utilizador.estado === "pendente") {
        return res.status(403).json({
          erro: "Conta pendente de ativação. Verifique o seu email para definir a palavra-passe.",
        });
      }

      if (utilizador.estado === "inativo") {
        return res.status(403).json({
          erro: "A sua conta encontra-se desativada. Contacte o suporte.",
        });
      }

      if (!utilizador.passwordHash) {
        return res.status(401).json({
          erro: "Conta sem palavra-passe configurada.",
        });
      }

      // 6. Comparação segura do texto limpo com o hash armazenado usando bcrypt (resiste a timing attacks)
      const passwordValida = await bcrypt.compare(
        password,
        utilizador.passwordHash,
      );
      if (!passwordValida) {
        return res.status(401).json({ erro: "Credenciais inválidas." });
      }

      // 7. Extração dos perfis atribuídos para um array simples (ex: ['rececionista', 'administrador'])
      const perfis = (utilizador.perfis || []).map((p) => p.tipoPerfil);

      // 8. Criação e assinatura do token JWT com payload de identificação e autorização
      const token = jwt.sign(
        {
          id: utilizador.id,
          email: utilizador.dadosPessoais.email,
          perfis,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      // 9. Resposta de sucesso (HTTP 200) devolvendo o token e metadados úteis para o frontend
      return res.status(200).json({
        mensagem: "Autenticação bem-sucedida.",
        token,
        utilizador: {
          id: utilizador.id,
          nome: utilizador.dadosPessoais.nome,
          email: utilizador.dadosPessoais.email,
          estado: utilizador.estado,
          perfis,
        },
      });
    } catch (erro) {
      // Registo de erros internos na consola para diagnóstico e resposta 500 ao cliente
      console.error("Erro no authController.login:", erro);
      return res.status(500).json({
        erro: "Erro interno ao processar a autenticação.",
      });
    }
  },

  /* GET /api/auth/me
   * Retorna os dados cadastrais do utilizador autenticado a partir do token decifrado.
   */
  async me(req, res) {
    try {
      // O ID do utilizador é injetado no req.user pelo middleware verificarToken
      const utilizador = await Utilizador.findByPk(req.user.id, {
        include: [
          { model: DadosPessoais, as: "dadosPessoais" },
          { model: Perfil, as: "perfis", through: { attributes: [] } },
        ],
      });

      if (!utilizador) {
        return res.status(404).json({ erro: "Utilizador não encontrado." });
      }

      // Devolve os dados sem expor informações sensíveis de hashing
      return res.status(200).json({
        id: utilizador.id,
        nome: utilizador.dadosPessoais?.nome,
        email: utilizador.dadosPessoais?.email,
        contacto: utilizador.dadosPessoais?.contacto,
        morada: utilizador.dadosPessoais?.morada,
        dataNascimento: utilizador.dadosPessoais?.dataNascimento,
        estado: utilizador.estado,
        perfis: (utilizador.perfis || []).map((p) => p.tipoPerfil),
      });
    } catch (erro) {
      console.error("Erro no authController.me:", erro);
      return res.status(500).json({
        erro: "Erro ao obter dados do utilizador autenticado.",
      });
    }
  },
  /* PUT /api/auth/me
   * O próprio utilizador altera os seus dados pessoais (não mexe no cargo nem na palavra-passe).
   */
  async atualizarMe(req, res) {
    try {
      const dp = await DadosPessoais.findOne({ where: { utilizadorId: req.user.id } });
      if (!dp) return res.status(404).json({ erro: "Utilizador não encontrado." });

      const { nome, email, contacto, morada } = req.body;
      const dataNasc = req.body.dataNascimento !== undefined ? req.body.dataNascimento : req.body.data_nascimento;

      if (nome !== undefined && !String(nome).trim()) {
        return res.status(400).json({ erro: "O nome não pode ficar vazio." });
      }

      await dp.update({
        ...(nome !== undefined && { nome: String(nome).trim() }),
        ...(email !== undefined && { email: String(email).toLowerCase().trim() }),
        ...(contacto !== undefined && { contacto }),
        ...(morada !== undefined && { morada }),
        ...(dataNasc !== undefined && { dataNascimento: dataNasc || null }),
      });

      return res.status(200).json({
        mensagem: "Dados atualizados com sucesso.",
        nome: dp.nome,
        email: dp.email,
        contacto: dp.contacto,
        morada: dp.morada,
        dataNascimento: dp.dataNascimento,
      });
    } catch (erro) {
      if (erro.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ erro: "Já existe outro utilizador com esse e-mail." });
      }
      if (erro.name === "SequelizeValidationError") {
        return res.status(400).json({ erro: "Dados inválidos (confirme o e-mail)." });
      }
      console.error("Erro no authController.atualizarMe:", erro);
      return res.status(500).json({ erro: "Erro ao atualizar os dados." });
    }
  },

  /* PUT /api/auth/me/password
   * Muda a palavra-passe do próprio utilizador. Exige a palavra-passe atual.
   */
  async mudarPassword(req, res) {
    try {
      const { passwordAtual, passwordNova } = req.body;
      if (!passwordAtual || !passwordNova) {
        return res.status(400).json({ erro: "Indique a palavra-passe atual e a nova." });
      }
      if (String(passwordNova).length < 6) {
        return res.status(400).json({ erro: "A nova palavra-passe tem de ter pelo menos 6 caracteres." });
      }

      // .unscoped() para trazer o hash (o defaultScope esconde-o)
      const utilizador = await Utilizador.unscoped().findByPk(req.user.id);
      if (!utilizador) return res.status(404).json({ erro: "Utilizador não encontrado." });

      const valida = await bcrypt.compare(passwordAtual, utilizador.passwordHash);
      if (!valida) return res.status(400).json({ erro: "A palavra-passe atual está errada." });

      utilizador.passwordHash = await bcrypt.hash(passwordNova, 10);
      await utilizador.save();
      return res.status(200).json({ mensagem: "Palavra-passe alterada com sucesso." });
    } catch (erro) {
      console.error("Erro no authController.mudarPassword:", erro);
      return res.status(500).json({ erro: "Erro ao alterar a palavra-passe." });
    }
  },
};