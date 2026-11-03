#!/usr/bin/env bash
# Cópia de segurança da base de dados (instância 1). Guarda as últimas 7.
# Uso:    bash cloud/db/backup.sh
# Cron (todos os dias às 03:00):  0 3 * * * bash /home/ubuntu/Ha-gateway-Project/cloud/db/backup.sh
set -euo pipefail
umask 077 # a cópia tem hashes de palavras-passe: só o dono lê

CONTAINER="${DB_CONTAINER:-clinica-db}"
DESTINO="${BACKUP_DIR:-/mnt/dados/backups}"
GUARDAR="${BACKUP_KEEP:-7}"

mkdir -p "$DESTINO"
FICHEIRO="$DESTINO/clinica-$(date +%Y%m%d-%H%M%S).sql.gz"

if ! docker exec "$CONTAINER" sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb-dump -uroot --single-transaction --routines --databases "$MARIADB_DATABASE"' | gzip > "$FICHEIRO"; then
  echo "ERRO: a cópia falhou" >&2
  rm -f "$FICHEIRO"
  exit 1
fi

# um ficheiro minúsculo indica uma cópia vazia ou truncada
if [ "$(stat -c %s "$FICHEIRO")" -lt 500 ]; then
  echo "ERRO: cópia inválida ($FICHEIRO)" >&2
  rm -f "$FICHEIRO"
  exit 1
fi

# apaga as mais antigas, ficando só com as últimas $GUARDAR
ls -1t "$DESTINO"/clinica-*.sql.gz | tail -n +$((GUARDAR + 1)) | xargs -r rm --
echo "Cópia criada: $FICHEIRO"