#!/bin/sh
# Devolve 0 (ok) se o contentor "haproxy" estiver a correr, 1 (falha) se não.
# O Keepalived usa isto para decidir se esta VM pode ter o VIP.
[ "$(docker inspect -f '{{.State.Running}}' haproxy 2>/dev/null)" = "true" ] || exit 1
exit 0