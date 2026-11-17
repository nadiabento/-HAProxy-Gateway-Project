# API da Clínica (PRC)

Documentação dos endpoints do backend (Node.js + Express + Sequelize). Serve de contrato para o frontend.

- **Base URL:** `/api` (em desenvolvimento: `http://localhost:3000/api`; pelo NGINX/HAProxy: `/api`)
- **Formato:** JSON (`Content-Type: application/json`)
- **Autenticação:** token JWT no cabeçalho `Authorization: Bearer <token>`
- **Nomes dos campos:** `camelCase` (por exemplo `dataHora`, `fisioterapeutaId`)

## Perfis

Os perfis vêm no token e em `utilizador.perfis`, sempre em **minúsculas**:

`administrador` · `rececionista` · `fisioterapeuta` · `paciente`

Uma pessoa pode ter mais de um perfil.

## Contas de teste (seed)

| Perfil | Email | Palavra-passe |
|---|---|---|
| administrador | admin@prc.pt | admin123 |
| rececionista | rececao@prc.pt | rececao123 |
| fisioterapeuta | fisio@prc.pt | fisio123 |
| paciente | paciente@prc.pt | paciente123 |

O seed também cria 4 técnicas: Ultrassons, TENS, Mobilização articular e Cinesiterapia.

## Códigos de erro

Todos os erros vêm em JSON.

| Código | Quando | Corpo |
|---|---|---|
| 400 | Campos em falta ou tipo errado | `{ "erro": "Dados inválidos", "em_falta": ["email"], "tipos": ["pacienteId deve ser number"] }` |
| 400 | Valor inválido (validação do modelo, enum, email) | `{ "erro": "Dados inválidos", "campos": [{ "campo": "email", "mensagem": "..." }] }` |
| 401 | Sem token, token inválido ou expirado | `{ "erro": "..." }` |
| 403 | Perfil sem permissão ou dados de outra pessoa | `{ "erro": "..." }` |
| 404 | Recurso não existe | `{ "erro": "... não encontrado(a)" }` |
| 409 | Valor duplicado (ex.: email) ou referência inexistente / registos ligados | `{ "erro": "..." }` |
| 500 | Erro interno | `{ "erro": "Erro interno" }` |

Nos campos numéricos (`pacienteId`, `fisioterapeutaId`, `tecnicaId`) o valor tem de ser **número** no JSON (`1`, não `"1"`).

---

## Autenticação

### POST /api/auth/login
Público. Corpo: `{ "email": "admin@prc.pt", "password": "admin123" }`

Resposta **200**:
```json
{
  "mensagem": "Autenticação bem-sucedida.",
  "token": "eyJ...",
  "utilizador": { "id": 1, "nome": "Admin Principal", "email": "admin@prc.pt", "estado": "ativo", "perfis": ["administrador"] }
}
```
Erros: 400 (email ou password em falta), 401 (credenciais inválidas), 403 (conta `pendente` ou `inativo`). O token dura 8 horas.

### GET /api/auth/me
Requer token. Devolve `{ id, nome, email, contacto, estado, perfis }` do utilizador autenticado.

### GET /api/health
Público. Devolve sempre 200: `{ "status": "ok", "vm": "vm1", "db": "up" }` (`db` pode ser `down`). `vm` indica que VM respondeu.

---

## Pacientes

Todas as rotas exigem token.

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/api/pacientes` | administrador, rececionista, fisioterapeuta | Lista todos os pacientes |
| GET | `/api/pacientes/:id` | staff, ou o próprio paciente | Obtém um paciente |
| POST | `/api/pacientes` | administrador, rececionista | Cria paciente |
| PUT | `/api/pacientes/:id` | administrador, rececionista | Atualiza dados pessoais |
| DELETE | `/api/pacientes/:id` | administrador | Apaga paciente |

Um paciente que peça `GET /api/pacientes/:id` de outra pessoa recebe **403**.

**Objeto Paciente**
```json
{
  "id": 1,
  "dadosPessoaisId": 4,
  "dadosPessoais": {
    "id": 4, "utilizadorId": 4, "nome": "Paula Paciente", "email": "paciente@prc.pt",
    "contacto": null, "dataNascimento": null, "morada": null
  }
}
```

**POST /api/pacientes** — corpo:

| Campo | Tipo | Obrigatório |
|---|---|---|
| nome | string | sim |
| email | string | sim (único) |
| contacto | string | não |
| dataNascimento | string `AAAA-MM-DD` | não |
| morada | string | não |
| password | string | não |

Se enviares `password`, a conta fica `ativa` e a pessoa já pode fazer login. Sem `password`, fica `pendente` (não consegue entrar). Respostas: **201** (paciente criado), 400, 409 (email já existe).

**PUT /api/pacientes/:id** — corpo com qualquer um de `nome`, `email`, `contacto`, `dataNascimento`, `morada`. Respostas: 200, 400, 404, 409.

**DELETE /api/pacientes/:id** — respostas: **204**, 404, **409** se o paciente tiver consultas (o histórico clínico não se apaga).

---

## Técnicas

Todas as rotas exigem token e perfil `administrador`, `rececionista` ou `fisioterapeuta`. Criar, editar e desativar: `administrador` ou `fisioterapeuta`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/tecnicas` | Lista as técnicas **ativas**, por nome. `?todas=true` inclui as inativas |
| GET | `/api/tecnicas/:id` | Obtém uma técnica |
| POST | `/api/tecnicas` | Cria técnica |
| PUT | `/api/tecnicas/:id` | Atualiza (`nome`, `categoria`, `ativa`) |
| DELETE | `/api/tecnicas/:id` | **Desativa** (`ativa = false`), não apaga |

**Objeto Técnica**
```json
{ "id": 1, "nome": "Ultrassons", "categoria": "Eletroterapia", "ativa": true }
```

**POST /api/tecnicas** — corpo: `nome` (string, obrigatório, único), `categoria` (string, opcional). Respostas: 201, 400, 409 (nome repetido).

**DELETE** responde **204**. Uma técnica inativa não pode ser associada a consultas novas, mas continua nas consultas antigas.

---

## Consultas

Todas as rotas exigem token.

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/api/consultas` | todos | Staff vê todas; paciente vê só as suas |
| GET | `/api/consultas/:id` | todos | Paciente só se for a sua (senão 403) |
| POST | `/api/consultas` | administrador, rececionista | Agenda consulta |
| PUT | `/api/consultas/:id` | administrador, rececionista, fisioterapeuta | Atualiza |
| DELETE | `/api/consultas/:id` | administrador | Apaga (o normal é pôr `estado = "cancelada"`) |
| POST | `/api/consultas/:id/tecnicas` | administrador, fisioterapeuta | Associa técnica |
| DELETE | `/api/consultas/:id/tecnicas/:tecnicaId` | administrador, fisioterapeuta | Remove técnica |

**GET /api/consultas** — filtros opcionais na query: `pacienteId`, `fisioterapeutaId`, `estado`. Para um paciente, só o filtro `estado` e `fisioterapeutaId` têm efeito e a lista é sempre limitada às suas consultas. Ordenação: mais recente primeiro.

**Objeto Consulta**
```json
{
  "id": 1,
  "pacienteId": 1,
  "fisioterapeutaId": 1,
  "dataHora": "2026-11-20T10:00:00.000Z",
  "duracaoMinutos": 30,
  "estado": "agendada",
  "diagnostico": null,
  "evolucaoClinica": null,
  "observacoes": null,
  "paciente": { "id": 1, "dadosPessoaisId": 4, "dadosPessoais": { "nome": "Paula Paciente", "email": "paciente@prc.pt" } },
  "fisioterapeuta": { "id": 1, "dadosPessoaisId": 3, "especialidade": "Musculoesquelética", "dadosPessoais": { "nome": "Filipe Fisio", "email": "fisio@prc.pt" } },
  "tecnicas": [
    { "id": 1, "nome": "Ultrassons", "categoria": "Eletroterapia", "ativa": true,
      "ConsultaTecnica": { "consultaId": 1, "tecnicaId": 1, "tempoMinutos": 15, "parametros": "1 MHz" } }
  ]
}
```
(Os objetos `dadosPessoais` trazem também `id`, `utilizadorId`, `contacto`, `dataNascimento` e `morada`; encurtei-os aqui.)

`estado`: `agendada` · `realizada` · `cancelada`. As datas vêm em UTC (`Z`); o frontend converte para a hora local.

**POST /api/consultas** — corpo:

| Campo | Tipo | Obrigatório |
|---|---|---|
| pacienteId | número | sim |
| fisioterapeutaId | número | sim |
| dataHora | string ISO (`2026-11-20T10:00:00`) | sim |
| duracaoMinutos | número | não (por defeito 30) |
| estado | string | não (por defeito `agendada`) |

Respostas: **201**, 400 (campos em falta, `dataHora` inválida ou `estado` inválido), 409 (paciente ou fisioterapeuta não existe).

**PUT /api/consultas/:id** — corpo com qualquer um de `pacienteId`, `fisioterapeutaId`, `dataHora`, `duracaoMinutos`, `estado`, `diagnostico`, `evolucaoClinica`, `observacoes`. Os três últimos ficam vazios até a consulta ser realizada. Respostas: 200, 400, 404, 409.

**DELETE /api/consultas/:id** — **204** ou 404.

### POST /api/consultas/:id/tecnicas
Corpo: `{ "tecnicaId": 1, "tempoMinutos": 15, "parametros": "1 MHz" }` (só `tecnicaId` é obrigatório).

Respostas: **201** com `{ consultaId, tecnicaId, tempoMinutos, parametros }`; 400 (técnica inativa); 404 (consulta ou técnica não existe); 409 (técnica já associada a esta consulta).

### DELETE /api/consultas/:id/tecnicas/:tecnicaId
Respostas: **204** ou 404 (ligação não existe).

---

## Rotas de outros módulos

Os endpoints de **fisioterapeutas**, **rececionistas** e **utilizadores** não estão neste documento (têm outros responsáveis). Quando existirem, acrescentam-se aqui.
