#!/usr/bin/env bash
# D2 na nuvem: balanceamento de carga.
# Faz vários pedidos ao portal e conta que servidor respondeu a cada um.
set -euo pipefail
. "$(dirname "$0")/../comum.sh"

N="${1:-20}"
LOG="$(mktemp)"; trap 'rm -f "$LOG"' EXIT

titulo "D2 - Balanceamento de carga ($N pedidos a http://$ENTRADA, modo $MODO)"
correr_pedidos "$N" 0.2 | tee "$LOG" | awk '{printf "  pedido %2d -> %-12s (HTTP %s)\n", NR, $3, $2}'

titulo "Resultado"
awk '{print $3}' "$LOG" | sort | uniq -c | awk '{printf "  %-12s %d pedidos\n", $2, $1}'
SERVIDORES=$(awk '$2==200{print $3}' "$LOG" | sort -u | wc -l)
FALHAS=$(awk '$2!=200' "$LOG" | wc -l)

if [ "$SERVIDORES" -ge 2 ] && [ "$FALHAS" -eq 0 ]; then
  echo "D2 OK: os pedidos foram repartidos por $SERVIDORES servidores (roundrobin), sem erros."
else
  echo "D2 FALHOU: $SERVIDORES servidor(es) a responder, $FALHAS pedido(s) com erro."
  echo "  Ver o estado em http://$ENTRADA:8404/stats"
  exit 1
fi
