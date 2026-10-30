# Ha-gateway-Project

Portal com IP virtual (VIP), balanceamento de carga e aplicação web em duas VMs.
Se uma VM falhar, a outra assume o VIP e o portal continua a responder.

## Arquitetura (resumo)

| Peça                  | Função                                                |
| --------------------- | ----------------------------------------------------- |
| VM1 (`192.168.56.11`) | VM principal (MASTER), tem o VIP em condições normais |
| VM2 (`192.168.56.12`) | VM em espera (BACKUP), assume o VIP se a VM1 falhar   |
| VIP (`192.168.56.10`) | IP partilhado que os clientes usam                    |
| Keepalived            | Gere o VIP entre as duas VMs (protocolo VRRP)         |
| HAProxy               | Balanceador de carga (contentor `haproxy`)            |

## Requisitos

- VirtualBox
- Vagrant
- Git Bash (para correr os scripts `.sh` no Windows)

## Como arrancar

```bash
vagrant up vm1 vm2
```

O `provision/base.sh` instala o Docker e o Keepalived e copia a configuração
certa para cada VM (`keepalived/keepalived.conf.vm1` ou `.vm2`).

## Como funciona o failover

- A VM com maior prioridade fica com o VIP (VM1 = 120, VM2 = 100).
- As VMs avisam-se uma à outra a cada 0,5 s.
- Se a VM1 desaparecer, a VM2 deixa de ouvir os avisos e assume o VIP.
- O script `keepalived/check_haproxy.sh` verifica se o contentor `haproxy`
  está a correr. Se não estiver, a VM perde prioridade e a outra fica com o VIP.
- Quando a VM1 volta, recupera o VIP.

## Demo D1 - Failover do VIP

Corre no Git Bash, na raiz do projeto:

```bash
bash scripts/demo-d1-failover.sh
```

O script faz pedidos ao VIP, desliga a VM1 e mostra quanto tempo o VIP esteve
em baixo. Resultado obtido: **0,32 s** (limite: 2 s).

Para repor a VM1 depois da demo:

```bash
vagrant up vm1
```

## Estrutura

```
Vagrantfile                    # define as duas VMs
provision/base.sh              # instala Docker e Keepalived em cada VM
keepalived/                    # configuração do VIP e verificação do HAProxy
scripts/demo-d1-failover.sh    # demo de failover
```
