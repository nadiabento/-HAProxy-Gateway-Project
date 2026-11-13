# Deploy no servidor

Põe o projeto a correr no servidor da universidade com um comando. Mais detalhes em `docs/nuvem.md`.

## Requisitos

- No PC: Git Bash
- No servidor: Docker (com Compose 2.24 ou mais recente)

## Como usar

```bash
cp cloud/.env.cloud.example cloud/.env.cloud   # preencher (não vai para o Git)
bash cloud/deploy.sh
```

| Comando                             | O que faz                               |
| ----------------------------------- | --------------------------------------- |
| `bash cloud/deploy.sh`              | Envia o código e arranca tudo           |
| `bash cloud/deploy.sh estado`       | Mostra os contentores de cada máquina   |
| `bash cloud/deploy.sh logs backend` | Últimos logs de um serviço              |
| `bash cloud/deploy.sh parar`        | Pára tudo (os dados da BD ficam)        |

Demos no servidor: `cloud/scripts/demo-d2-cloud.sh`, `demo-d3-cloud.sh` e `demo-d4-cloud.sh`.
