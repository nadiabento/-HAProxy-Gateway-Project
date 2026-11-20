# Ha-gateway-Project

Portal com IP virtual (VIP), balanceamento de carga e aplicação web em duas VMs.
Se uma VM falhar, a outra assume o VIP e o portal continua a responder.

Portal de uma clínica de fisioterapia em alta disponibilidade, com 3 máquinas virtuais, balanceamento de carga, IP virtual com failover automático, base de dados com réplica, sessões em Redis e segurança ao nível do anfitrião.

## Arquitetura

| Máquina | IP            | Função                                                                    |
| ------- | ------------- | ------------------------------------------------------------------------- |
| vm1     | 192.168.56.11 | Keepalived MASTER (tem o VIP), HAProxy, frontend, API, Redis primário     |
| vm2     | 192.168.56.12 | Keepalived BACKUP, HAProxy, frontend, API, Redis réplica, MariaDB réplica |
| vm3     | 192.168.56.13 | MariaDB primária                                                          |
| VIP     | 192.168.56.10 | IP virtual gerido por VRRP (interface `eth1`)                             |

- **Entrada:** o cliente acede ao VIP. O Keepalived mantém-no na vm1 e passa-o para a vm2 se a vm1 falhar (corte medido na demo D1: 0,32 s, com limite de 2 s).
- **Balanceamento:** 2 HAProxy por VM (4 no total), em round-robin entre o frontend da vm1 e o da vm2, com health check em `/api/health`.
- **Aplicação:** frontend (NGINX + React) e API (Node.js + Express) em cada VM. O NGINX encaminha `/api` para `http://backend:3000`.
- **Dados:** MariaDB primária na vm3, com réplica assíncrona na vm2 (promovível a primária se a vm3 cair). Redis para sessões e cache, com primário na vm1 e réplica na vm2.
- **Control Plane:** a máquina que cria as VMs (Vagrant) e onde correm Prometheus, Grafana e Loki. O Promtail em cada VM envia os logs para o Loki.
- **Segurança:** nftables e Fail2ban nas VMs (scripts em `cloud/security/`).
- **Nuvem (extensão):** Cloudflare com um `cloudflared` por VM. Na nuvem não há VIP nem Keepalived.

## Base de dados

MariaDB `clinica`, gerida com Sequelize. Tabelas: `utilizador`, `dados_pessoais`, `perfil`, `perfil_utilizador`, `paciente`, `fisioterapeuta`, `rececionista`, `administrador`, `consulta`, `tecnica`, `consulta_tecnica`.

Ao arrancar, o backend cria as tabelas (se não existirem) e carrega os dados iniciais (`backend/seeders/seed.js`). O esquema completo está em `docs/psd/modelo-dados.md`.

## Estrutura do repositório

```
├── Vagrantfile              3 VMs (vm1, vm2, vm3)
├── start.sh                 arranque completo com um comando
├── .env.example             modelo das variáveis de ambiente
├── provision/base.sh        provisionamento base (Docker, Keepalived, kernel)
├── keepalived/              configuração VRRP e check_haproxy.sh
├── haproxy/haproxy.cfg      configuração dos HAProxy
├── compose/                 docker compose (backend, frontend, haproxy, db, monitoring)
├── extensions/e3-redis-sessions/   Redis primário e réplica
├── db/                      imagem e configuração da MariaDB
├── backend/                 API Node.js (Express, Sequelize)
├── frontend/                React + NGINX
├── monitoring/              Prometheus
├── scripts/                 demos D1 a D4
├── cloud/                   extensão de nuvem (Cloudflare, firewall, segurança)
└── docs/                    arquitetura, API, ecrãs, modelo de dados, integração
```

## Pré-requisitos

- Windows com VirtualBox e Vagrant.
- Git Bash (os scripts `.sh` correm no Git Bash, não no PowerShell).
- Pelo menos 8 GB de RAM livres (cada VM usa 2 GB e 2 CPUs).
- Docker Desktop no Control Plane, só para a monitorização.

## Configuração

Copiar `.env.example` para `.env` e preencher todos os valores marcados com `mudar` (palavras-passe da BD, do Redis e do Keepalived, e os segredos JWT e de sessão). O `.env` não vai para o Git.

## Arranque

No Git Bash, na raiz do projeto:

```bash
./start.sh
```

O script cria as VMs (`vagrant up`), sobe a base de dados na vm3 e depois o backend, o frontend, os HAProxy e o Redis nas vm1 e vm2. A primeira vez demora vários minutos porque constrói as imagens.

Os ficheiros compose são sempre usados com `--env-file .env`. O `VM_NAME` e as migrações (`RUN_MIGRATIONS`, só na vm1) são passados a cada VM pelo `start.sh`.

## Utilização

- **Portal:** `http://192.168.56.10` (o VIP).
- **Login:** as credenciais de teste estão em `backend/seeders/seed.js`.
- **Estatísticas do HAProxy:** `http://192.168.56.11:8404/stats`.
- **Teste do balanceamento:**

```bash
for i in 1 2 3 4; do curl -s http://192.168.56.10/api/health; echo; done
```

As respostas alternam entre `"vm":"vm1"` e `"vm":"vm2"`.

### Portas

| Porta       | Serviço                 | Acesso                                 |
| ----------- | ----------------------- | -------------------------------------- |
| 80 / 81     | haproxy1 / haproxy2     | rede privada e VIP                     |
| 8404 / 8405 | estatísticas do HAProxy | rede privada                           |
| 8080        | frontend (NGINX)        | só pelos HAProxy (bloqueada para fora) |
| 3000        | API                     | só local (`127.0.0.1`) e Prometheus    |
| 6379        | Redis                   | entre as VMs                           |
| 3306        | MariaDB                 | entre as VMs                           |

### Endpoints da API

- `GET /api/health`: estado da VM e da BD (devolve sempre 200, para o HAProxy não retirar uma VM só porque a BD caiu).
- `GET /healthz`: liveness. `GET /readyz`: readiness (503 se a BD não responder). `GET /metrics`: métricas Prometheus.
- `POST /api/auth/login` e `GET /api/auth/me`: autenticação JWT.
- CRUD de utilizadores, pacientes, fisioterapeutas, rececionistas, técnicas e consultas, com controlo de acessos por perfil.

### Acesso de teste sem o VIP

```bash
vagrant ssh vm1 -- -L 8080:localhost:8080 -L 3000:localhost:3000
```

Abrir `http://localhost:8080`.

## Demonstrações

| Demo | Script                        | O que mostra                                                                 |
| ---- | ----------------------------- | ---------------------------------------------------------------------------- |
| D1   | `scripts/demo-d1-failover.sh` | failover do VIP quando a vm1 cai (desliga a vm1; repor com `vagrant up vm1`) |
| D2   | `scripts/demo-d2-load.sh`     | distribuição de carga entre as duas VMs                                      |
| D3   | `scripts/demo-d3-web-down.sh` | o serviço continua com uma VM web em baixo                                   |
| D4   | `scripts/demo-d4-persist.sh`  | os dados persistem depois de reiniciar a BD                                  |

Correr no Git Bash.

## Segurança

- nftables com política restritiva e Fail2ban (`backend=systemd`), em `cloud/security/`. Configurar o `ignoreip` com `10.0.2.2` e `192.168.56.0/24` para não bloquear o Vagrant.
- Palavras-passe com `bcrypt`, autenticação JWT, controlo de acessos por perfil (RBAC) e consultas parametrizadas (sem SQL injection).
- Segredos só no `.env` local.

## Desligar e retomar

Desligar sempre com:

```bash
vagrant halt
```

Não usar `--force`, nem desligar o PC com as VMs ligadas, porque isso pode corromper os discos e deixar o arranque preso. Para retomar, correr `./start.sh`.

## Resolução de problemas

- **`vagrant ssh vmX -c ...` não devolve nada:** a VM pode estar presa a arrancar. Esperar uns minutos ou fazer `vagrant reload vmX`.
- **Contentor com `Conflict... name already in use`:** remover o antigo (`docker rm -f <nome>`) e voltar a correr o `start.sh`.
- **HAProxy a reiniciar sem parar:** ver `docker logs haproxy1`. O `haproxy.cfg` tem de acabar com uma linha em branco.
- **Mudar a palavra-passe da BD:** só tem efeito recriando o volume `clinica_db_data` (apaga os dados).
- **Login falha no browser sem o VIP:** o frontend deve chamar `/api` e não `localhost:3000`.

## Equipa

| Elemento     | Responsabilidade                                  |
| ------------ | ------------------------------------------------- |
| Nadia        | infraestrutura, autenticação, entrada e segurança |
| Pedro        | HAProxy, monitorização e frontend                 |
| Jessica      | base de dados e API clínica                       |
| 4.º elemento | nuvem e documentação                              |

## Estado do projeto

- **Funciona:** 3 VMs, VIP e failover, HAProxy ×4, frontend e API nas vm1 e vm2, MariaDB na vm3, Redis primário, login JWT, balanceamento pelo VIP.
- **Em curso:** réplica da MariaDB na vm2, réplica do Redis, firewall e Fail2ban nas 3 VMs, monitorização (Prometheus, Grafana, Loki) e extensão de nuvem (`cloudflared`).
