#!/usr/bin/env bash
# Firewall do host com nftables (E2). Corre em cada instância, como root.
# Regra geral: bloqueia tudo o que entra, e só deixa passar o que está listado.
set -euo pipefail

# Rede privada entre as duas instâncias (ajustar ao fornecedor)
PRIV_NET="${PRIV_NET:-10.0.0.0/24}"

nft flush ruleset

nft -f - <<EOF
table inet filtro {
  chain entrada {
    type filter hook input priority 0; policy drop;   # por defeito, bloqueia

    iif lo accept                                     # tráfego interno da própria máquina
    ct state established,related accept               # respostas a ligações já abertas
    ct state invalid drop                             # pacotes inválidos
    ip protocol icmp accept                           # ping

    tcp dport 22 accept                               # SSH
    tcp dport { 80, 443 } accept                      # web (HAProxy / NGINX)
    ip saddr $PRIV_NET accept                         # a outra instância fala livremente connosco
  }
}
EOF

# Guarda as regras para sobreviverem a reinícios
nft list ruleset > /etc/nftables.conf
systemctl enable nftables
echo "Firewall aplicada."