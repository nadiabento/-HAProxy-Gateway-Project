# Demos

Correr no Git Bash, na raiz do projeto, com tudo a correr (`start.sh` no PC ou `cloud/deploy.sh` no servidor).
Durante as demos pode-se ver o estado dos servidores em `http://<portal>:8404/stats`.

## D1 - Failover do VIP

```bash
bash scripts/demo-d1-failover.sh
```

Faz pedidos ao VIP, desliga a VM1 e mede quanto tempo o VIP esteve em baixo.
Resultado obtido: **0,32 s** (limite: 2 s). Para repor: `vagrant up vm1`.

## D2 - Balanceamento de carga

```bash
bash scripts/demo-d2-load.sh            # PC
bash cloud/scripts/demo-d2-cloud.sh     # servidor
```

Faz vários pedidos e conta que servidor respondeu a cada um. Os pedidos têm de ficar repartidos pelos dois.
Resultado obtido: _a preencher_

## D3 - Servidor web em baixo

```bash
bash scripts/demo-d3-web-down.sh        # PC
bash cloud/scripts/demo-d3-cloud.sh     # servidor
```

Desliga o frontend de um servidor durante uns segundos, com pedidos a correr.
O HAProxy passa tudo para o outro servidor e o portal continua a responder.
Resultado obtido: _a preencher_

## D4 - Persistência dos dados (RNF-04)

**Objetivo:** provar que os dados guardados na base de dados sobrevivem ao reinício do contentor.

```bash
bash scripts/demo-d4-persist.sh         # PC
bash cloud/scripts/demo-d4-cloud.sh     # servidor
```

**O que o script faz:**
1. Insere um registo (uma técnica de teste) através da API.
2. Reinicia o contentor da MariaDB e espera que fique `healthy` (no servidor, apaga e recria o contentor).
3. Confirma que o registo continua na base de dados.

**Resultado esperado:** o script termina com `D4 OK: os dados sobreviveram ao restart da MariaDB.`

![Demo D4: persistência dos dados](d4-persistencia.png)