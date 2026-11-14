#!/usr/bin/env bash
# deploy.sh: põe o projeto a correr no servidor da universidade com um só comando (António).
#
# Uso (Git Bash, na raiz do projeto): bash cloud/deploy.sh [estado|parar|logs serviço]
set -euo pipefail
. "$(dirname "$0")/comum.sh"

ACAO="${1:-subir}"

# ---------- verificações ----------
verificar_config() {
  local v
  for v in DB_NAME DB_USER DB_PASSWORD DB_ROOT_PASSWORD JWT_SECRET STATS_PASSWORD; do
    if [ -z "${!v:-}" ] || [ "${!v}" = "mudar" ]; then
      echo "ERRO: $v está vazio ou ainda é 'mudar' em cloud/.env.cloud" >&2; exit 1
    fi
  done
  # os *_IP entram em regras de portas do Docker: têm de ser IPs, não nomes
  for v in SERVIDOR1_IP SERVIDOR2_IP SERVIDOR_BD_IP; do
    if [ -n "${!v}" ] && ! [[ "${!v}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "ERRO: $v='${!v}' tem de ser um IP (ex.: 10.0.0.5). Preenche-o em cloud/.env.cloud" >&2; exit 1
    fi
  done
}

verificar_maquina() {
  local h="$1"
  printf '  %-22s ' "$h"
  if ! remoto "$h" true 2>/dev/null; then
    echo "SEM SSH"; echo "  -> confirma IP, utilizador e VPN; testa: ssh -p $SSH_PORT $SSH_USER@$h" >&2; exit 1
  fi
  if ! remoto "$h" "$DOCKER compose version >/dev/null 2>&1"; then
    echo "SEM DOCKER"
    echo "  -> no servidor: curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker \$USER" >&2
    echo "     (ou põe DOCKER=\"sudo docker\" em cloud/.env.cloud)" >&2
    exit 1
  fi
  echo "ok ($(remoto "$h" "$DOCKER compose version --short"))"
}

# ---------- .env de cada máquina ----------
# __HOME__ é trocado pela pasta pessoal no próprio servidor
gerar_env() {
  local h="$1"
  local db_host db_publicar frontend_bind app2_addr vm migrar
  local app_noutra=0
  if [ "$h" = "$SERVIDOR_BD" ]; then db_host=db; else db_host="$SERVIDOR_BD_IP"; fi
  # a BD só fica visível na rede se houver app noutra máquina
  [ "$SERVIDOR1" != "$SERVIDOR_BD" ] && app_noutra=1
  [ -n "$SERVIDOR2" ] && [ "$SERVIDOR2" != "$SERVIDOR_BD" ] && app_noutra=1
  if [ "$h" = "$SERVIDOR_BD" ] && [ $app_noutra = 1 ]; then
    db_publicar="$SERVIDOR_BD_IP:3306"
  else
    db_publicar="127.0.0.1:3306"
  fi
  # o frontend do servidor 2 tem de ser visível para o HAProxy do servidor 1
  if [ -n "$SERVIDOR2" ] && [ "$h" = "$SERVIDOR2" ]; then frontend_bind="$SERVIDOR2_IP"; else frontend_bind="127.0.0.1"; fi
  if [ "$MODO" = unico ]; then app2_addr="frontend2:80"; else app2_addr="$SERVIDOR2_IP:8080"; fi
  if [ "$h" = "$SERVIDOR1" ]; then vm=servidor1; migrar=true
  elif [ "$h" = "$SERVIDOR2" ]; then vm=servidor2; migrar=false
  else vm=bd; migrar=false; fi

  cat <<EOF
# Gerado por cloud/deploy.sh em $(date '+%Y-%m-%d %H:%M'). Não editar à mão no servidor.
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD
DB_HOST=$db_host
DB_PORT=3306
DB_PUBLISH_PORT=$db_publicar
DB_DATA_DIR=__HOME__/$DADOS/mariadb
BACKUP_DIR=__HOME__/$DADOS/backups
VM_NAME=$vm
RUN_MIGRATIONS=$migrar
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-8h}
SESSION_SECRET=${SESSION_SECRET:-$JWT_SECRET}
FRONTEND_BIND=$frontend_bind
APP1_ADDR=frontend:80
APP2_ADDR=$app2_addr
STATS_USER=${STATS_USER:-admin}
STATS_PASSWORD=$STATS_PASSWORD
EOF
}

# ---------- passos ----------
enviar_codigo() {
  local h="$1"
  # substitui a pasta do código; os dados da BD estão noutra pasta (~/$DADOS) e não são tocados
  tar -C "$RAIZ" -czf - \
    --exclude=./.git --exclude=node_modules --exclude=./.vagrant --exclude=./frontend/dist \
    --exclude=./.env --exclude=./.env.dev --exclude=./cloud/.env.cloud . \
  | remoto "$h" "rm -rf ~/$PASTA && mkdir -p ~/$PASTA ~/$DADOS/mariadb ~/$DADOS/backups && tar -xzf - -C ~/$PASTA"
  gerar_env "$h" | remoto "$h" "umask 077; sed \"s|__HOME__|\$HOME|g\" > ~/$PASTA/.env"
}

esperar_bd() {
  local h="$1"
  printf '  à espera da base de dados em %s ' "$h"
  for _ in $(seq 1 60); do
    if [ "$(remoto "$h" "$DOCKER inspect -f '{{.State.Health.Status}}' clinica-db 2>/dev/null" || true)" = healthy ]; then
      echo "ok"; return 0
    fi
    printf '.'; sleep 3
  done
  echo; echo "ERRO: a BD não ficou pronta. Ver: bash cloud/deploy.sh logs db" >&2; exit 1
}

esperar_portal() {
  printf '  à espera do portal no servidor 1 '
  for _ in $(seq 1 60); do
    if remoto "$SERVIDOR1" "curl -fsS --max-time 3 http://127.0.0.1/api/health" >/dev/null 2>&1; then
      echo "ok"; return 0
    fi
    printf '.'; sleep 3
  done
  echo; echo "ERRO: o portal não respondeu. Ver: bash cloud/deploy.sh logs backend" >&2; exit 1
}

instalar_backup() {
  [ "${BACKUP_AUTOMATICO:-nao}" = sim ] || return 0
  local linha="0 3 * * * BACKUP_DIR=\$HOME/$DADOS/backups bash \$HOME/$PASTA/cloud/db/backup.sh >> \$HOME/$DADOS/backups/backup.log 2>&1 # clinica-backup"
  remoto "$SERVIDOR_BD" "(crontab -l 2>/dev/null | grep -v '# clinica-backup'; echo '$linha') | crontab -"
  echo "  cópia de segurança diária às 03:00 em $SERVIDOR_BD (~/$DADOS/backups)"
}

subir() {
  verificar_config
  titulo "Modo: $MODO"
  echo "  servidor 1 (HAProxy + app): $SERVIDOR1"
  [ -n "$SERVIDOR2" ] && echo "  servidor 2 (app):           $SERVIDOR2"
  echo "  base de dados:              $SERVIDOR_BD"

  titulo "1/4 Verificar máquinas"
  for h in $(maquinas); do verificar_maquina "$h"; done

  titulo "2/4 Enviar código e configuração"
  for h in $(maquinas); do echo "  $h"; enviar_codigo "$h"; done

  titulo "3/4 Arrancar contentores (pode demorar na 1.ª vez: constrói as imagens)"
  # ordem: BD, servidor 2, servidor 1 (o HAProxy é o último a entrar)
  if [ "$SERVIDOR_BD" != "$SERVIDOR1" ]; then
    compose_remoto "$SERVIDOR_BD" up -d --build --remove-orphans
    esperar_bd "$SERVIDOR_BD"
  fi
  if [ -n "$SERVIDOR2" ] && [ "$SERVIDOR2" != "$SERVIDOR_BD" ]; then
    compose_remoto "$SERVIDOR2" up -d --build --remove-orphans
  fi
  compose_remoto "$SERVIDOR1" up -d --build --remove-orphans
  # o haproxy.cfg é montado como ficheiro: reiniciar para ler a versão nova
  compose_remoto "$SERVIDOR1" restart haproxy >/dev/null

  titulo "4/4 Verificar"
  esperar_portal
  instalar_backup
  testar_entrada
  echo
  echo "Pronto. Portal: http://$ENTRADA    Estatísticas: http://$ENTRADA:8404/stats (${STATS_USER:-admin})"
}

testar_entrada() {
  if curl -fsS --max-time 5 "http://$ENTRADA/api/health" >/dev/null 2>&1; then
    echo "  a partir deste PC: http://$ENTRADA responde"
  else
    echo "  AVISO: este PC não chega a http://$ENTRADA (VPN da UA ligada? firewall?)."
    echo "         O portal está a correr; as demos podem usar DEMO_VIA_SSH=sim."
  fi
}

estado() {
  for h in $(maquinas); do
    titulo "$h"
    remoto "$h" "$DOCKER ps -a --filter label=com.docker.compose.project=clinica --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" || true
  done
  titulo "Portal"
  remoto "$SERVIDOR1" "curl -sS --max-time 3 http://127.0.0.1/api/health" && echo || echo "  não responde"
  testar_entrada
}

parar() {
  # ordem inversa: primeiro quem recebe pedidos, a BD no fim
  compose_remoto "$SERVIDOR1" down
  if [ -n "$SERVIDOR2" ] && [ "$SERVIDOR2" != "$SERVIDOR_BD" ]; then compose_remoto "$SERVIDOR2" down; fi
  if [ "$SERVIDOR_BD" != "$SERVIDOR1" ]; then compose_remoto "$SERVIDOR_BD" down; fi
  echo "Parado. Os dados da BD continuam em ~/$DADOS/mariadb no servidor da BD."
}

case "$ACAO" in
  subir|up)  subir ;;
  estado)    estado ;;
  parar)     parar ;;
  logs)      compose_remoto "$SERVIDOR1" logs --tail 80 "${2:-}" ;;
  *) echo "Uso: bash cloud/deploy.sh [subir|estado|parar|logs [serviço]]" >&2; exit 1 ;;
esac
