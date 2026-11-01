#!/usr/bin/env bash
# D4: insere um registo, reinicia a MariaDB e verifica que continua lá.
# Correr no Git Bash (ou na VM), a partir da raiz do projeto. Precisa da base de dados criada (db-init).
set -euo pipefail
cd "$(dirname "$0")/.."
# o sed tira os fins de linha do Windows (\r) do .env
set -a; . <(sed 's/\r$//' ./.env); set +a

CONTAINER="${DB_CONTAINER:-clinica-db}"
MARK="D4-$(date +%s)"
sql() { docker exec -e MYSQL_PWD="$DB_PASSWORD" "$CONTAINER" mariadb -u"$DB_USER" "$DB_NAME" -N -e "$1"; }

echo "1) A inserir técnica de teste ($MARK)"
sql "INSERT INTO tecnica (nome, categoria, ativa) VALUES ('$MARK', 'teste D4', 1)"
ANTES=$(sql "SELECT COUNT(*) FROM tecnica")
echo "   técnicas: $ANTES"

echo "2) A reiniciar a MariaDB..."
docker restart "$CONTAINER" >/dev/null
for i in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER")" = "healthy" ] && break
  sleep 1
done
echo "   estado: $(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER")"

echo "3) Verificação"
DEPOIS=$(sql "SELECT COUNT(*) FROM tecnica")
ACHADO=$(sql "SELECT COUNT(*) FROM tecnica WHERE nome='$MARK'")
echo "   técnicas: $DEPOIS | registo de teste encontrado: $ACHADO"

if [ "$DEPOIS" = "$ANTES" ] && [ "$ACHADO" = "1" ]; then
  echo "D4 OK: os dados sobreviveram ao restart da MariaDB."
else
  echo "D4 FALHOU"; exit 1
fi