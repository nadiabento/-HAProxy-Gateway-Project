# Nuvem

Passagem do projeto do PC para o servidor da universidade.
Primeiro tem de funcionar no PC (`start.sh`); depois corre no servidor com um comando:

```bash
cp cloud/.env.cloud.example cloud/.env.cloud   # preencher
bash cloud/deploy.sh
```

## Dados do servidor

| Pergunta                         | Resposta      |
| -------------------------------- | ------------- |
| Quantas máquinas?                | _a preencher_ |
| Endereço e utilizador SSH        | _a preencher_ |
| Acesso (direto, VPN, rede da UA) | _a preencher_ |
| Docker instalado? sudo?          | _a preencher_ |
| Portas abertas para fora         | _a preencher_ |

## Máquinas

O `deploy.sh` adapta-se ao número de máquinas indicado no `cloud/.env.cloud`:

| Máquinas | O que corre                                                   |
| -------- | ------------------------------------------------------------- |
| 1        | BD, HAProxy e duas cópias da aplicação na mesma máquina       |
| 2        | Servidor 1: BD, HAProxy e aplicação. Servidor 2: aplicação    |
| 3        | Igual ao PC: dois servidores de aplicação e um para a BD      |

## O que muda em relação ao PC

| PC                         | Servidor                                         |
| -------------------------- | ------------------------------------------------ |
| `start.sh`                 | `cloud/deploy.sh` (envia o código por SSH)       |
| `.env` igual nas VMs       | `.env` gerado para cada máquina                  |
| `haproxy/haproxy.cfg`      | `cloud/haproxy.cloud.cfg`                        |
| Dados num volume do Docker | Dados em `~/dados/mariadb` no servidor           |
| Portas 3306 e 8080 abertas | Só visíveis onde são precisas                    |
| VIP com Keepalived         | Não usado (a confirmar com a professora)         |

Os ficheiros dos colegas não mudam: o deploy junta-lhes os ficheiros de `cloud/`
(`docker compose -f compose/... -f cloud/...`).

## Cópias de segurança

O deploy instala uma cópia diária às 03:00 (guarda as últimas 7). No servidor:

```bash
BACKUP_DIR=~/dados/backups bash cloud/db/backup.sh       # cópia manual
bash cloud/db/restore.sh ~/dados/backups/clinica-....sql.gz
```

## Decisões

- Terraform não é usado: o servidor é dado pela universidade, não há API para o criar.
- Cloudflare: só faz sentido se houver domínio próprio (a confirmar; ver `cloud/cloudflare.md`).
- O D1 (failover do VIP) é demonstrado no PC, a não ser que o servidor permita um VIP (a confirmar).
