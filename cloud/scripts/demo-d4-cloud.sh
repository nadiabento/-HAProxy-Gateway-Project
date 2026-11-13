#!/usr/bin/env bash
# D4 na nuvem: os dados sobrevivem à destruição do contentor da BD.
# Insere um registo, apaga e recria o contentor da MariaDB e verifica que o registo continua lá.
set -euo pipefail
. "$(dirname "$0")/../comum.sh"

titulo "D4 - Persistência dos dados (BD em $SERVIDOR_BD)"
remoto "$SERVIDOR_BD" "DOCKER='$DOCKER' SUDO='$SUDO' PASTA='$PASTA' bash -s" <<'EOS'
set -euo pipefail
cd ~/"$PASTA"
export COMPOSE_IGNORE_ORPHANS=True
DATA_DIR=$(sed -n 's/^DB_DATA_DIR=//p' .env)
MARK="D4-cloud-$(date +%s)"
sql() { printf '%s\n' "$1" | $SUDO bash cloud/db/sql.sh; }
saude() { $DOCKER inspect -f '{{.State.Health.Status}}' clinica-db 2>/dev/null || echo ausente; }

echo "1) A inserir técnica de teste ($MARK)"
sql "INSERT INTO tecnica (nome, categoria, ativa) VALUES ('$MARK', 'teste D4', 1);" >/dev/null
ANTES=$(sql "SELECT COUNT(*) FROM tecnica;")
ID_ANTES=$($DOCKER inspect -f '{{.Id}}' clinica-db | cut -c1-12)
echo "   técnicas: $ANTES | contentor: $ID_ANTES"

echo "2) A APAGAR o contentor da BD e a criar um novo..."
$DOCKER compose -p clinica --env-file .env -f compose/db.yml -f cloud/db/compose.cloud.db.yml \
  up -d --force-recreate --no-deps db >/dev/null 2>&1
for i in $(seq 1 60); do [ "$(saude)" = healthy ] && break; sleep 2; done
ID_DEPOIS=$($DOCKER inspect -f '{{.Id}}' clinica-db | cut -c1-12)
echo "   estado: $(saude) | contentor novo: $ID_DEPOIS"
echo "   os dados estão em: $DATA_DIR"

echo "3) Verificação"
DEPOIS=$(sql "SELECT COUNT(*) FROM tecnica;")
ACHADO=$(sql "SELECT COUNT(*) FROM tecnica WHERE nome='$MARK';")
echo "   técnicas: $DEPOIS | registo de teste encontrado: $ACHADO"
sql "DELETE FROM tecnica WHERE nome='$MARK';" >/dev/null   # limpa o registo de teste

if [ "$ID_ANTES" != "$ID_DEPOIS" ] && [ "$DEPOIS" = "$ANTES" ] && [ "$ACHADO" = "1" ]; then
  echo "D4 OK: o contentor foi recriado e os dados continuaram lá."
else
  echo "D4 FALHOU"; exit 1
fi
EOS
