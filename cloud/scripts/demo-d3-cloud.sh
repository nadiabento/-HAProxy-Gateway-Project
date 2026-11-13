#!/usr/bin/env bash
# D3 na nuvem: um servidor web cai e o portal continua a responder.
# Desliga o frontend do 2.º servidor durante uns segundos, com pedidos a correr.
set -euo pipefail
. "$(dirname "$0")/../comum.sh"

# qual o contentor a desligar
if [ "$MODO" = unico ]; then
  ALVO_HOST="$SERVIDOR1"; ALVO_CONT="clinica-frontend-2"
else
  ALVO_HOST="$SERVIDOR2"; ALVO_CONT="clinica-frontend"
fi
LOG="$(mktemp)"; trap 'rm -f "$LOG"' EXIT

titulo "D3 - Servidor web em baixo (desligar $ALVO_CONT em $ALVO_HOST)"
correr_pedidos 200 0.1 > "$LOG" &
PEDIDOS=$!

sleep 3
echo "  >> a desligar $ALVO_CONT ..."
remoto "$ALVO_HOST" "$DOCKER stop $ALVO_CONT" >/dev/null
T_PARAR=$(date +%s.%N)
sleep 8
echo "  >> a ligar $ALVO_CONT outra vez ..."
remoto "$ALVO_HOST" "$DOCKER start $ALVO_CONT" >/dev/null
T_LIGAR=$(date +%s.%N)
echo "  >> à espera que o HAProxy o volte a pôr UP ..."
wait "$PEDIDOS" || true

titulo "Resultado"
awk -v p="$T_PARAR" -v l="$T_LIGAR" '
  { total++; if ($2 != 200) erros++
    if ($1 >= p && $1 <= l) { durante[$3]++; nd++ }
    if ($1 > l + 5) depois[$3]++ }
  END {
    printf "  pedidos: %d | com erro: %d\n", total, erros+0
    printf "  enquanto %s esteve desligado (%d pedidos):\n", "'"$ALVO_CONT"'", nd
    for (s in durante) printf "    %-12s %d\n", s, durante[s]
    printf "  depois de voltar:\n"
    for (s in depois) printf "    %-12s %d\n", s, depois[s]
  }' "$LOG"

ERROS=$(awk '$2!=200' "$LOG" | wc -l)
VOLTOU=$(awk -v l="$T_LIGAR" '$1 > l && $3=="servidor2"' "$LOG" | wc -l)
if [ "$ERROS" -le 2 ] && [ "$VOLTOU" -gt 0 ]; then
  echo "D3 OK: o portal continuou a responder e o servidor2 voltou ao balanceamento."
else
  echo "D3: $ERROS erro(s); servidor2 voltou: $([ "$VOLTOU" -gt 0 ] && echo sim || echo ainda não)."
  [ "$ERROS" -le 2 ] || exit 1
fi
