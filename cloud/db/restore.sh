#!/usr/bin/env bash
# Repõe uma cópia de segurança (SUBSTITUI os dados atuais).
# Uso: bash cloud/db/restore.sh /mnt/dados/backups/clinica-AAAAMMDD-HHMMSS.sql.gz
set -euo pipefail

FICHEIRO="${1:?Indica o ficheiro .sql.gz da cópia}"
CONTAINER="${DB_CONTAINER:-clinica-db}"
[ -f "$FICHEIRO" ] || { echo "Não existe: $FICHEIRO" >&2; exit 1; }

read -r -p "Isto SUBSTITUI os dados atuais da base de dados. Continuar? (escreve sim) " RESPOSTA
[ "$RESPOSTA" = "sim" ] || { echo "Cancelado."; exit 1; }

gunzip -c "$FICHEIRO" | docker exec -i "$CONTAINER" sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb -uroot'
echo "Cópia reposta a partir de $FICHEIRO"