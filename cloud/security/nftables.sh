#!/usr/bin/env bash
# Firewall do host com nftables. Corre em cada VM, como root:  sudo ./nftables.sh vm1|vm2|vm3
# Regra geral: bloqueia tudo o que entra e só deixa passar o que está listado.
set -euo pipefail

VM="${1:?Uso: nftables.sh vm1|vm2|vm3}"

# As 3 VMs falam livremente entre si (VRRP, Redis, réplicas, API -> BD, HAProxy -> frontend)
PARES="${PARES:-192.168.56.11, 192.168.56.12, 192.168.56.13}"
# PC do administrador (rede host-only do VirtualBox)
ADMIN="${ADMIN:-192.168.56.1}"

# Portas de contentores abertas a qualquer cliente, e só ao PC do administrador
case "$VM" in
  vm1|vm2) PUBLICAS="80, 81";  SO_ADMIN="8404, 8405" ;;  # HAProxy e as suas estatísticas
  vm3)     PUBLICAS="";        SO_ADMIN="3306" ;;        # MariaDB (ex.: DBeaver)
  *) echo "VM desconhecida: $VM"; exit 1 ;;
esac

# Regras opcionais (só se houver portas)
REGRA_PUBLICAS=""
[ -n "$PUBLICAS" ] && REGRA_PUBLICAS="ct status dnat ct original proto-dst { $PUBLICAS } accept"
REGRA_ADMIN="ct status dnat ip saddr $ADMIN ct original proto-dst { $SO_ADMIN } accept"

# Só mexe na tabela "filtro" (não apaga as regras do Docker)
cat > /etc/nftables.conf <<EOF
#!/usr/sbin/nft -f
table inet filtro
delete table inet filtro

table inet filtro {
  # Tráfego destinado à própria VM (SSH, VRRP, etc.)
  chain entrada {
    type filter hook input priority 0; policy drop;   # por defeito, bloqueia

    iif lo accept                                     # tráfego interno da máquina
    ct state established,related accept               # respostas a ligações já abertas
    ct state invalid drop                             # pacotes inválidos
    ip protocol icmp accept                           # ping
    iifname "docker0" accept                          # contentores a falar com a VM
    iifname "br-*" accept                             # idem (redes criadas pelo Compose)
    ip saddr { $PARES } accept                        # as outras VMs (inclui o VRRP)
    tcp dport 22 accept                               # SSH (Fail2ban protege)
  }

  # Tráfego para as portas publicadas pelos contentores (o Docker faz DNAT)
  chain encaminhar {
    type filter hook forward priority -10; policy accept;

    ct state established,related accept
    ct status dnat ip saddr { $PARES } accept         # as VMs falam com os contentores umas das outras
    $REGRA_PUBLICAS
    $REGRA_ADMIN
    ct status dnat drop                               # qualquer outra porta publicada fica bloqueada
  }
}
EOF

nft -c -f /etc/nftables.conf      # verifica a sintaxe antes de aplicar
nft -f /etc/nftables.conf         # aplica
systemctl enable nftables         # volta a aplicar no arranque
echo "Firewall aplicada em $VM."