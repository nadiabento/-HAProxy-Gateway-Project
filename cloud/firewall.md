# Firewall

## Portas

| Porta | Serviço             | Acesso                              |
| ----- | ------------------- | ----------------------------------- |
| 22    | SSH                 | administradores                     |
| 80    | HAProxy (portal)    | todos                               |
| 8404  | HAProxy (stats)     | com utilizador e palavra-passe      |
| 8080  | Frontend            | só o HAProxy                        |
| 3000  | Backend             | só a própria máquina                |
| 3306  | MariaDB             | só os servidores da aplicação       |

As portas publicadas pelo Docker passam ao lado da firewall do host, por isso o `deploy.sh`
liga as portas 8080 e 3306 só ao IP onde são precisas (ou a `127.0.0.1`).

## Aplicar (em cada máquina)

```bash
sudo PRIV_NET=10.0.0.0/24 bash cloud/security/nftables.sh   # rede interna entre as máquinas
sudo bash cloud/security/fail2ban.sh
```
