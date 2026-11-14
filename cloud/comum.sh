#!/usr/bin/env bash
# Funções partilhadas pelo deploy.sh e pelas demos da nuvem (António).
# Não se corre sozinho: os outros scripts fazem ". cloud/comum.sh".

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="$RAIZ/cloud/.env.cloud"

if [ ! -f "$CONF" ]; then
  echo "ERRO: falta cloud/.env.cloud" >&2
  echo "      cp cloud/.env.cloud.example cloud/.env.cloud   e preenche os valores" >&2
  exit 1
fi
# o sed tira os fins de linha do Windows (\r)
set -a; . <(sed 's/\r$//' "$CONF"); set +a

: "${SERVIDOR1:?Preenche SERVIDOR1 em cloud/.env.cloud}"
: "${SSH_USER:?Preenche SSH_USER em cloud/.env.cloud}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-}"
SERVIDOR2="${SERVIDOR2:-}"
SERVIDOR_BD="${SERVIDOR_BD:-$SERVIDOR1}"
SERVIDOR1_IP="${SERVIDOR1_IP:-$SERVIDOR1}"
SERVIDOR2_IP="${SERVIDOR2_IP:-$SERVIDOR2}"
SERVIDOR_BD_IP="${SERVIDOR_BD_IP:-$SERVIDOR_BD}"
ENTRADA="${ENTRADA:-$SERVIDOR1}"
PASTA="${PASTA_REMOTA:-clinica}"
DADOS="${PASTA_DADOS:-dados}"
DOCKER="${DOCKER:-docker}"
SUDO=""; case "$DOCKER" in sudo*) SUDO="sudo" ;; esac

# unico = tudo no SERVIDOR1; distribuido = app no SERVIDOR1 e no SERVIDOR2
if [ -z "$SERVIDOR2" ] || [ "$SERVIDOR2" = "$SERVIDOR1" ]; then
  MODO=unico; SERVIDOR2=""
else
  MODO=distribuido
fi

# corre um comando numa máquina por SSH
remoto() {
  local h="$1"; shift
  ssh -p "$SSH_PORT" ${SSH_KEY:+-i "$SSH_KEY"} \
    -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new \
    "$SSH_USER@$h" "$@"
}

# lista das máquinas diferentes (sem repetir)
maquinas() {
  printf '%s\n' "$SERVIDOR_BD" "$SERVIDOR2" "$SERVIDOR1" | awk 'NF && !v[$0]++'
}

# ficheiros compose de cada máquina, conforme o papel dela
ficheiros_compose() {
  local h="$1" f=""
  local bd=0 app1=0 app2=0
  [ "$h" = "$SERVIDOR_BD" ] && bd=1
  [ "$h" = "$SERVIDOR1" ] && app1=1
  [ -n "$SERVIDOR2" ] && [ "$h" = "$SERVIDOR2" ] && app2=1

  # o primeiro ficheiro tem de estar em compose/ (os caminhos relativos partem daí)
  [ $bd = 1 ] && f="$f -f compose/db.yml"
  if [ $app1 = 1 ] || [ $app2 = 1 ]; then f="$f -f compose/backend.yml -f compose/frontend.yml"; fi
  [ $app1 = 1 ] && f="$f -f compose/haproxy.yml"
  [ $bd = 1 ] && f="$f -f cloud/db/compose.cloud.db.yml"
  if [ $app1 = 1 ] || [ $app2 = 1 ]; then f="$f -f cloud/compose.cloud.backend.yml"; fi
  [ $app1 = 1 ] && f="$f -f cloud/compose.cloud.haproxy.yml"
  [ $app1 = 1 ] && [ "$MODO" = unico ] && f="$f -f cloud/compose.cloud.replica.yml"
  echo "$f"
}

# docker compose numa máquina, dentro da pasta do projeto
compose_remoto() {
  local h="$1"; shift
  remoto "$h" "cd ~/$PASTA && $DOCKER compose -p clinica --env-file .env $(ficheiros_compose "$h") $*"
}

titulo() { echo; echo "== $*"; }

# Faz $1 pedidos ao portal, um a cada $2 s. Escreve por pedido: tempo, código HTTP, servidor
correr_pedidos() {
  local n="$1" intervalo="$2" alvo="$ENTRADA"
  [ "${DEMO_VIA_SSH:-nao}" = sim ] && alvo=127.0.0.1
  local script
  script=$(cat <<EOS
for i in \$(seq 1 $n); do
  r=\$(curl -s -o /dev/null -D - --max-time 2 -w 'CODIGO %{http_code}\n' "http://$alvo/" 2>/dev/null | tr -d '\r')
  s=\$(printf '%s\n' "\$r" | awk -F': ' 'tolower(\$1)=="x-servidor"{print \$2}')
  c=\$(printf '%s\n' "\$r" | awk '/^CODIGO /{print \$2}')
  echo "\$(date +%s.%N) \${c:-000} \${s:--}"
  sleep $intervalo
done
EOS
)
  if [ "${DEMO_VIA_SSH:-nao}" = sim ]; then
    remoto "$SERVIDOR1" bash -s <<< "$script"
  else
    bash -c "$script"
  fi
}
