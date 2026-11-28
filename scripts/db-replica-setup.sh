#!/usr/bin/env bash
# Configura a réplica assíncrona da MariaDB. Corre-se na máquina onde está o
# contentor da réplica (clinica-db-replica): vm2 nas VMs, ou o teu PC nos testes locais.
#   VMs:    bash scripts/db-replica-setup.sh
#   Local:  PRIMARY_HOST=clinica-db bash scripts/db-replica-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

PRIMARY_HOST="${PRIMARY_HOST:-${DB_HOST:-db}}"
PRIMARY_PORT="${PRIMARY_PORT:-3306}"
REPL_USER="${REPL_USER:-repl}"
REPL_PASSWORD="${REPL_PASSWORD:-repl_${DB_ROOT_PASSWORD}}"
R="docker exec -i clinica-db-replica"

primario() { $R mariadb -h"$PRIMARY_HOST" -P"$PRIMARY_PORT" -uroot -p"$DB_ROOT_PASSWORD" "$@"; }
replica()  { $R mariadb -uroot -p"$DB_ROOT_PASSWORD" "$@"; }

echo "1) Utilizador de replicação no primário ($PRIMARY_HOST:$PRIMARY_PORT)"
primario -e "CREATE USER IF NOT EXISTS '$REPL_USER'@'%' IDENTIFIED BY '$REPL_PASSWORD'; GRANT REPLICATION SLAVE ON *.* TO '$REPL_USER'@'%'; FLUSH PRIVILEGES;"

echo "2) A configurar a ligação da réplica ao primário"
replica -e "STOP SLAVE; RESET SLAVE ALL; CHANGE MASTER TO MASTER_HOST='$PRIMARY_HOST', MASTER_PORT=$PRIMARY_PORT, MASTER_USER='$REPL_USER', MASTER_PASSWORD='$REPL_PASSWORD';"

echo "3) Cópia inicial da base de dados $DB_NAME"
$R sh -c "mariadb-dump -h'$PRIMARY_HOST' -P$PRIMARY_PORT -uroot -p'$DB_ROOT_PASSWORD' --single-transaction --master-data=1 --databases $DB_NAME | mariadb -uroot -p'$DB_ROOT_PASSWORD'"

echo "4) A iniciar a replicação"
replica -e "START SLAVE;"
sleep 3
replica -e "SHOW SLAVE STATUS\G" | grep -E "Slave_IO_Running:|Slave_SQL_Running:|Seconds_Behind_Master|Last_IO_Error|Last_SQL_Error"
