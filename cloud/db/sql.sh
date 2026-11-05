#!/usr/bin/env bash
# Corre SQL (lido do stdin) dentro do contentor da base de dados.
# Usado pela demo D4 na nuvem: printf 'SELECT 1;' | bash cloud/db/sql.sh
exec docker exec -i "${DB_CONTAINER:-clinica-db}" sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb -uroot -N "$MARIADB_DATABASE"'