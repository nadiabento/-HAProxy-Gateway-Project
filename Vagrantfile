Vagrant.configure("2") do |config|
  config.vm.box = "bento/ubuntu-22.04"

  {
    "vm1" => "192.168.56.11",
    "vm2" => "192.168.56.12"
  }.each do |name, ip|
    config.vm.define name do |node|
      node.vm.hostname = name
      node.vm.network "private_network", ip: ip
      node.vm.provider "virtualbox" do |vb|
        vb.name   = "ha-#{name}"
        vb.memory = 2048
        vb.cpus   = 2
      end
      node.vm.provision "shell", path: "provision/base.sh"
    end
  end
end
