#!/usr/bin/env bash
# start.sh - arranca tudo com um comando (correr no Git Bash)
set -e
cd "$(dirname "$0")"

# 1) Cria e provisiona as 3 VMs
echo "[1/3] A criar as VMs..."
vagrant up

# Sobe os contentores de uma VM (ficheiros compose relativos a /vagrant)
sobe() {
  vm=$1; shift
  args=""
  for f in "$@"; do args="$args -f $f"; done
    vagrant ssh "$vm" -c "cd /vagrant && docker compose --env-file .env $args up -d --build"
}

# 2) Contentores: primeiro a BD (vm3), depois as VMs web
echo "[2/3] A subir os contentores..."
sobe vm3 compose/db.yml
sobe vm1 compose/backend.yml compose/frontend.yml compose/haproxy.yml extensions/e3-redis-sessions/compose.redis.yml
sobe vm2 compose/db-replica.yml compose/backend.yml compose/frontend.yml compose/haproxy.yml extensions/e3-redis-sessions/compose.redis.yml

# 3) Monitorização no Control Plane (só se o ficheiro já tiver conteúdo)
echo "[3/3] Monitorização..."
if [ -s compose/monitoring.yml ]; then
  docker compose -f compose/monitoring.yml up -d
else
  echo "  compose/monitoring.yml vazio, a saltar."
fi

echo "Pronto. Portal: http://192.168.56.10"