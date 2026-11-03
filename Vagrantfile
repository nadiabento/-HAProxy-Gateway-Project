# 3 VMs: vm1 e vm2 (aplicação) e vm3 (base de dados)
Vagrant.configure("2") do |config|
  config.vm.box = "bento/ubuntu-22.04"

  # Corrige timeouts de SSH no Windows
  config.ssh.forward_agent = false
  config.vm.boot_timeout = 600

  {
    "vm1" => { ip: "192.168.56.11", port: 2221 }, # MASTER (VIP)
    "vm2" => { ip: "192.168.56.12", port: 2222 }, # BACKUP
    "vm3" => { ip: "192.168.56.13", port: 2223 }  # MariaDB
  }.each do |name, conf|
    config.vm.define name do |node|
      node.vm.hostname = name
      node.vm.network "private_network", ip: conf[:ip]

      # Define portas únicas por VM e permite auto-correção caso alguma esteja ocupada
      node.vm.network "forwarded_port", guest: 22, host: conf[:port], id: "ssh", auto_correct: true

      node.vm.provider "virtualbox" do |vb|
        vb.name   = "ha-#{name}"
        vb.memory = 2048
        vb.cpus   = 2
      end
      node.vm.provision "shell", path: "provision/base.sh"
    end
  end
end