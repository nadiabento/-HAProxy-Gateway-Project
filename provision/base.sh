#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Docker (repositório oficial) e Compose
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
usermod -aG docker vagrant
systemctl enable --now docker

# Utilitários e Keepalived (a configuração fica para a Fase 2)
apt-get install -y keepalived curl jq

# O HAProxy tem de poder fazer bind no VIP mesmo na VM que não o tem
echo "net.ipv4.ip_nonlocal_bind=1" > /etc/sysctl.d/99-ha.conf
sysctl --system

# Copia o script de verificação e a configuração desta VM (vm1 ou vm2)
install -m 755 /vagrant/keepalived/check_haproxy.sh /etc/keepalived/check_haproxy.sh
install -m 644 /vagrant/keepalived/keepalived.conf.$(hostname) /etc/keepalived/keepalived.conf

# Arranca o Keepalived e deixa-o ligar no boot
systemctl enable keepalived
systemctl restart keepalived