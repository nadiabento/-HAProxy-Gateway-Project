#!/usr/bin/env bash
# D4: insere dados, reinicia a MariaDB e verifica que continuam lá.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

CONTAINER="${DB_CONTAINER:-clinica-db}"
MARK="D4-$(date +%s)"
sql() { docker exec -e MYSQL_PWD="$DB_PASSWORD" "$CONTAINER" mariadb -u"$DB_USER" "$DB_NAME" -N -e "$1"; }

echo "1) A inserir registo de teste ($MARK)"
sql "INSERT INTO registos (nome_paciente, lesao, descricao) VALUES ('$MARK', 'teste', 'D4')"
ANTES=$(sql "SELECT COUNT(*) FROM registos")
echo "   registos: $ANTES"

echo "2) A reiniciar a MariaDB..."
docker restart "$CONTAINER" >/dev/null
for i in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER")" = "healthy" ] && break
  sleep 1
done

echo "3) Verificação"
DEPOIS=$(sql "SELECT COUNT(*) FROM registos")
ACHADO=$(sql "SELECT COUNT(*) FROM registos WHERE nome_paciente='$MARK'")
echo "   registos: $DEPOIS | teste encontrado: $ACHADO"

if [ "$DEPOIS" = "$ANTES" ] && [ "$ACHADO" = "1" ]; then
  echo "D4 OK: os dados sobreviveram ao restart."
else
  echo "D4 FALHOU"; exit 1
fi