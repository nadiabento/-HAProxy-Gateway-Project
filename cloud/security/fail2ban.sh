#!/usr/bin/env bash
# Fail2ban (E2): bloqueia IPs que falham o login SSH várias vezes. Corre como root.
set -euo pipefail

# IPs que nunca são bloqueados (a própria máquina e a rede privada)
IGNORAR="${IGNORAR:-127.0.0.1/8 192.168.56.0/24}"

apt-get install -y fail2ban

# Configuração local (não mexe no ficheiro original do pacote)
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
ignoreip = $IGNORAR
bantime  = 10m          # tempo de bloqueio
findtime = 10m          # janela em que as falhas são contadas
maxretry = 5            # 5 falhas seguidas = bloqueio

[sshd]
enabled = true
backend = systemd       # lê os logs do SSH no journal do sistema
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo "Fail2ban aplicado."