<?php
require 'db.php';
session_start();

$page = $_GET['page'] ?? 'home';
$action = $_GET['action'] ?? null;

// ============================================
// OPERAÇÕES DE PACIENTES
// ============================================
if ($page === 'pacientes') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'criar') {
        $nome = $_POST['nome'] ?? '';
        $data_nascimento = $_POST['data_nascimento'] ?? '';
        $contacto = $_POST['contacto'] ?? '';
        
        $stmt = $pdo->prepare("INSERT INTO pacientes (nome, data_nascimento, contacto) VALUES (?, ?, ?)");
        $stmt->execute([$nome, $data_nascimento, $contacto]);
        
        $_SESSION['mensagem'] = "Paciente criado com sucesso!";
        header('Location: ?page=pacientes');
        exit;
    }
    
    if ($action === 'apagar') {
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM pacientes WHERE id = ?");
        $stmt->execute([$id]);
        $_SESSION['mensagem'] = "Paciente apagado!";
        header('Location: ?page=pacientes');
        exit;
    }
    
    // Listar pacientes
    $stmt = $pdo->query("SELECT * FROM pacientes ORDER BY created_at DESC");
    $pacientes = $stmt->fetchAll();
}
// ============================================
// OPERAÇÕES DE HISTÓRICO (REGISTOS)
// ============================================
if ($page === 'historico') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'criar') {
        $nome_paciente = $_POST['nome_paciente'] ?? '';
        $lesao = $_POST['lesao'] ?? '';
        $descricao = $_POST['descricao'] ?? '';
        
        $stmt = $pdo->prepare("INSERT INTO registos (nome_paciente, lesao, descricao) VALUES (?, ?, ?)");
        $stmt->execute([$nome_paciente, $lesao, $descricao]);
        
        $_SESSION['mensagem'] = "Registo de tratamento guardado com sucesso!";
        header('Location: ?page=historico');
        exit;
    }
    
    if ($action === 'apagar') {
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM registos WHERE id = ?");
        $stmt->execute([$id]);
        $_SESSION['mensagem'] = "Registo de tratamento apagado!";
        header('Location: ?page=historico');
        exit;
    }
    
    // Listar todos os registos de tratamento
    $stmt = $pdo->query("SELECT * FROM registos ORDER BY criado_em DESC");
    $registos = $stmt->fetchAll();

    // Buscar os nomes dos pacientes para colocar no dropdown do formulário
    $stmtPacientes = $pdo->query("SELECT nome FROM pacientes ORDER BY nome ASC");
    $pacientes_lista = $stmtPacientes->fetchAll();
}

// ============================================
// OPERAÇÕES DE RELATÓRIOS
// ============================================
if ($page === 'relatorios') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'criar') {
        $nome_paciente = $_POST['nome_paciente'] ?? '';
        $data_sessao = $_POST['data_sessao'] ?? '';
        $observacoes = $_POST['observacoes'] ?? '';
        
        $stmt = $pdo->prepare("INSERT INTO relatorios (nome_paciente, data_sessao, observacoes) VALUES (?, ?, ?)");
        $stmt->execute([$nome_paciente, $data_sessao, $observacoes]);
        
        $_SESSION['mensagem'] = "Relatório guardado com sucesso!";
        header('Location: ?page=relatorios');
        exit;
    }
    
    if ($action === 'apagar') {
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM relatorios WHERE id = ?");
        $stmt->execute([$id]);
        $_SESSION['mensagem'] = "Relatório apagado!";
        header('Location: ?page=relatorios');
        exit;
    }
    
    // Buscar os relatórios
    $stmt = $pdo->query("SELECT * FROM relatorios ORDER BY data_sessao DESC");
    $relatorios = $stmt->fetchAll();

    // Buscar os nomes dos pacientes para o dropdown
    $stmtPacientes = $pdo->query("SELECT nome FROM pacientes ORDER BY nome ASC");
    $pacientes_lista = $stmtPacientes->fetchAll();
}

// ============================================
// OPERAÇÕES DE EXERCÍCIOS
// ============================================
if ($page === 'exercicios') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'criar') {
        $nome_paciente = $_POST['nome_paciente'] ?? '';
        $titulo_plano = $_POST['titulo_plano'] ?? '';
        $descricao_exercicios = $_POST['descricao_exercicios'] ?? '';
        
        $stmt = $pdo->prepare("INSERT INTO exercicios (nome_paciente, titulo_plano, descricao_exercicios) VALUES (?, ?, ?)");
        $stmt->execute([$nome_paciente, $titulo_plano, $descricao_exercicios]);
        
        $_SESSION['mensagem'] = "Plano de exercícios guardado com sucesso!";
        header('Location: ?page=exercicios');
        exit;
    }
    
    if ($action === 'apagar') {
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM exercicios WHERE id = ?");
        $stmt->execute([$id]);
        $_SESSION['mensagem'] = "Plano de exercícios apagado!";
        header('Location: ?page=exercicios');
        exit;
    }
    
    // Buscar os planos
    $stmt = $pdo->query("SELECT * FROM exercicios ORDER BY criado_em DESC");
    $exercicios = $stmt->fetchAll();

    // Buscar pacientes para o dropdown
    $stmtPacientes = $pdo->query("SELECT nome FROM pacientes ORDER BY nome ASC");
    $pacientes_lista = $stmtPacientes->fetchAll();
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Portal Clínico - Reabilitação</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        nav { background: #34495e; padding: 10px; }
        nav a { color: white; margin: 0 15px; text-decoration: none; }
        nav a:hover { text-decoration: underline; }
        .container { max-width: 1000px; margin: 20px auto; background: white; padding: 20px; border-radius: 5px; }
        .info-box { background: #e8f4f8; border-left: 4px solid #3498db; padding: 10px; margin: 10px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 10px; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
        th { background: #f9f9f9; font-weight: bold; }
        button, a.btn { background: #3498db; color: white; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer; text-decoration: none; }
        button:hover, a.btn:hover { background: #2980b9; }
        a.btn-danger { background: #e74c3c; }
        a.btn-danger:hover { background: #c0392b; }
        form { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        input[type="text"], input[type="date"], input[type="tel"] { width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px; }
        footer { text-align: center; padding: 20px; color: #7f8c8d; }
        .hostname { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
    <header>
        <h1>🏥 Portal de Histórico Clínico e Reabilitação</h1>
        <p class="hostname">Servidor: <?php echo gethostname(); ?></p>
    </header>
    
    <nav>
        <a href="?page=home">Home</a>
        <a href="?page=pacientes">Pacientes</a>
        <a href="?page=historico">Histórico de Tratamentos</a>
        <a href="?page=relatorios">Relatórios de Sessão</a>
        <a href="?page=exercicios">Planos de Exercícios</a>
        <a href="session.php" target="_blank">Teste Sessão/Redis</a>
    </nav>
    
    <div class="container">
        <div class="info-box">
            <strong>Hostname Atual:</strong> <span class="hostname"><?php echo gethostname(); ?></span>
        </div>
        
        <?php if (isset($_SESSION['mensagem'])): ?>
            <div class="success"><?php echo $_SESSION['mensagem']; unset($_SESSION['mensagem']); ?></div>
        <?php endif; ?>
        
        <?php if ($page === 'home'): ?>
            <h2>Bem-vindo ao Portal</h2>
            <p>Sistema de gestão de histórico clínico com alta disponibilidade.</p>
            <p>Use o menu acima para gerir pacientes e registar tratamentos.</p>
            
        <?php elseif ($page === 'pacientes'): ?>
            <h2>Gestão de Pacientes</h2>
            
            <h3>Criar Novo Paciente</h3>
            <form method="POST" action="?page=pacientes&action=criar">
                <input type="text" name="nome" placeholder="Nome completo" required>
                <input type="date" name="data_nascimento" required>
                <input type="tel" name="contacto" placeholder="Contacto" required>
                <button type="submit">Criar Paciente</button>
            </form>
            
            <h3>Pacientes Registados</h3>
            <?php if (count($pacientes) > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Data Nascimento</th>
                            <th>Contacto</th>
                            <th>Data Criação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($pacientes as $pac): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($pac['nome']); ?></td>
                                <td><?php echo $pac['data_nascimento']; ?></td>
                                <td><?php echo $pac['contacto']; ?></td>
                                <td><?php echo $pac['created_at']; ?></td>
                                <td>
                                    <a class="btn" href="?page=historico&paciente_id=<?php echo $pac['id']; ?>">Ver Histórico</a>
                                    <a class="btn btn-danger" href="?page=pacientes&action=apagar&id=<?php echo $pac['id']; ?>" onclick="return confirm('Tem certeza?')">Apagar</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>Nenhum paciente registado.</p>
            <?php endif; ?>
            
        <?php elseif ($page === 'historico'): ?>
            <h2>Histórico de Tratamentos</h2>
            
            <h3>Adicionar Novo Registo</h3>
            <form method="POST" action="?page=historico&action=criar">
                <!-- Dropdown para selecionar um paciente existente -->
                <select name="nome_paciente" required style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px;">
                    <option value="">Selecione um Paciente...</option>
                    <?php foreach ($pacientes_lista as $p): ?>
                        <option value="<?php echo htmlspecialchars($p['nome']); ?>">
                            <?php echo htmlspecialchars($p['nome']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                
                <input type="text" name="lesao" placeholder="Tipo de Lesão (ex: Entorse, Lombalgia)" required>
                
                <!-- Textarea para a descrição detalhada do tratamento -->
                <textarea name="descricao" placeholder="Descrição do tratamento realizado..." required style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px; resize: vertical; min-height: 80px;"></textarea>
                
                <button type="submit">Guardar Registo</button>
            </form>
            
            <h3>Registos Anteriores</h3>
            <?php if (count($registos) > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>Lesão</th>
                            <th>Descrição</th>
                            <th>Data do Registo</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($registos as $reg): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($reg['nome_paciente']); ?></td>
                                <td><?php echo htmlspecialchars($reg['lesao']); ?></td>
                                <td><?php echo nl2br(htmlspecialchars($reg['descricao'])); ?></td>
                                <td><?php echo $reg['criado_em']; ?></td>
                                <td>
                                    <a class="btn btn-danger" href="?page=historico&action=apagar&id=<?php echo $reg['id']; ?>" onclick="return confirm('Tem certeza que deseja apagar este registo?')">Apagar</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>Nenhum registo de tratamento encontrado.</p>
            <?php endif; ?>
            
       <?php elseif ($page === 'relatorios'): ?>
            <h2>Relatórios de Sessão</h2>
            
            <h3>Criar Novo Relatório</h3>
            <form method="POST" action="?page=relatorios&action=criar">
                <select name="nome_paciente" required style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px;">
                    <option value="">Selecione um Paciente...</option>
                    <?php foreach ($pacientes_lista as $p): ?>
                        <option value="<?php echo htmlspecialchars($p['nome']); ?>">
                            <?php echo htmlspecialchars($p['nome']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                
                <input type="date" name="data_sessao" required style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px;">
                
                <textarea name="observacoes" placeholder="Observações e evolução da sessão..." required style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px; resize: vertical; min-height: 80px;"></textarea>
                
                <button type="submit">Guardar Relatório</button>
            </form>
            
            <h3>Relatórios Guardados</h3>
            <?php if (count($relatorios) > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>Data da Sessão</th>
                            <th>Observações</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($relatorios as $rel): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($rel['nome_paciente']); ?></td>
                                <td><?php echo htmlspecialchars($rel['data_sessao']); ?></td>
                                <td><?php echo nl2br(htmlspecialchars($rel['observacoes'])); ?></td>
                                <td>
                                    <a class="btn btn-danger" href="?page=relatorios&action=apagar&id=<?php echo $rel['id']; ?>" onclick="return confirm('Tem certeza que deseja apagar este relatório?')">Apagar</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>Nenhum relatório registado.</p>
            <?php endif; ?>
            
       <?php elseif ($page === 'exercicios'): ?>
            <h2>Planos de Exercícios Domiciliários</h2>
            
            <h3>Criar Novo Plano</h3>
            <form method="POST" action="?page=exercicios&action=criar">
                <select name="nome_paciente" required style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px;">
                    <option value="">Selecione um Paciente...</option>
                    <?php foreach ($pacientes_lista as $p): ?>
                        <option value="<?php echo htmlspecialchars($p['nome']); ?>">
                            <?php echo htmlspecialchars($p['nome']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                
                <input type="text" name="titulo_plano" placeholder="Título do Plano (ex: Circuito de Força / Mobilidade)" required style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px;">
                
                <textarea name="descricao_exercicios" placeholder="Ex: Core stability, hip thrusts (3x15), uso de mini bands..." required style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px; resize: vertical; min-height: 100px;"></textarea>
                
                <button type="submit">Guardar Plano</button>
            </form>
            
            <h3>Planos Guardados</h3>
            <?php if (count($exercicios) > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>Título do Plano</th>
                            <th>Exercícios</th>
                            <th>Data de Criação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($exercicios as $ex): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($ex['nome_paciente']); ?></td>
                                <td><?php echo htmlspecialchars($ex['titulo_plano']); ?></td>
                                <td><?php echo nl2br(htmlspecialchars($ex['descricao_exercicios'])); ?></td>
                                <td><?php echo $ex['criado_em']; ?></td>
                                <td>
                                    <a class="btn btn-danger" href="?page=exercicios&action=apagar&id=<?php echo $ex['id']; ?>" onclick="return confirm('Tem certeza que deseja apagar este plano?')">Apagar</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>Nenhum plano de exercícios registado.</p>
            <?php endif; ?>
    
    <?php endif; ?> 
    </div> 
    
    <footer>
        <p>Portal de Histórico Clínico © 2026 | Servidor: <?php echo gethostname(); ?></p>
    </footer>
</body>
</html>