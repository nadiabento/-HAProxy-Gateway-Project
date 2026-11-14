# Ecrãs

Frontend em React (`frontend/src`). As rotas estão em `App.jsx` e os ecrãs privados usam a barra lateral (`components/Sidebar.jsx`).

## Ecrãs

| Rota            | Ecrã         | Ficheiro                    | Quem vê       |
| --------------- | ------------ | --------------------------- | ------------- |
| `/`             | Login        | `views/LoginView.jsx`       | todos         |
| `/dashboard`    | Painel       | `views/DashboardView.jsx`   | autenticados  |
| `/pacientes`    | Pacientes    | `views/PacientesView.jsx`   | autenticados  |
| `/funcionarios` | Funcionários | `views/FuncionariosView.jsx`| administrador |
| `/perfil`       | Perfil       | `App.jsx`                   | autenticados  |

## Descrição

- **Login:** e-mail e palavra-passe. Chama `POST /api/auth/login` e guarda o token.
- **Painel:** boas-vindas e cartões "Total de Pacientes" e "Consultas Hoje".
- **Pacientes:** tabela (nome, contacto, nascimento) com criar, editar e apagar (`/api/pacientes`).
- **Funcionários:** tabela (nome, e-mail, contacto, cargo) com criar, editar e apagar (`/api/utilizadores`).
- **Terminar sessão:** pede confirmação, apaga o token e volta ao Login.

## Contas de teste

| Perfil         | E-mail          | Palavra-passe |
| -------------- | --------------- | ------------- |
| Administrador  | admin@prc.pt    | admin123      |
| Rececionista   | rececao@prc.pt  | rececao123    |
| Fisioterapeuta | fisio@prc.pt    | fisio123      |
| Paciente       | paciente@prc.pt | paciente123   |

ps: prc = Portal de Reabilitação Clinica