#!/usr/bin/env bash
# D1 - Failover do VIP
# Faz pedidos ao VIP, desliga a VM1 e mede quanto tempo o VIP esteve em baixo.

VIP="${VIP:-192.168.56.10}"       # IP virtual (pode ser alterado por variável)
LOG="$(mktemp)"                   # ficheiro temporário com o registo

# Em segundo plano: pede o VIP a cada 0,2 s e regista "up" ou "down"
( while true; do
    if curl -s -o /dev/null --max-time 0.3 "http://$VIP/"; then
      echo "$(date +%s.%N) up" >> "$LOG"
    else
      echo "$(date +%s.%N) down" >> "$LOG"
    fi
    sleep 0.2
  done ) &
LOOP=$!

sleep 3                           # deixa correr um pouco com tudo normal
echo ">> A desligar a VM1 (MASTER)..."
vagrant halt vm1                  # simula a falha da VM master
sleep 5                           # dá tempo à VM2 para assumir o VIP
kill "$LOOP" 2>/dev/null          # pára os pedidos

# Calcula o tempo entre o primeiro "down" e o "up" seguinte
awk '
  $2=="down" && !d { d=1; t0=$1 }
  $2=="up"   && d  { printf "Corte de %.2f s (limite: 2 s)\n", $1-t0; d=0; got=1 }
  END { if (d) print "VIP nunca recuperou"; else if (!got) print "Sem corte detetado" }
' "$LOG"

echo ">> Para repor: vagrant up vm1"