<?php
session_start();

if (!isset($_SESSION['contador'])) {
    $_SESSION['contador'] = 0;
}

$_SESSION['contador']++;
?>
<!DOCTYPE html>
<html>
<head>
    <title>Teste de Sessão</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .info { background: #f0f0f0; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Teste de Sessão e Redis</h1>
    <div class="info">
        <p><strong>Hostname do Servidor:</strong> <?php echo gethostname(); ?></p>
        <p><strong>Visitas nesta Sessão:</strong> <?php echo $_SESSION['contador']; ?></p>
        <p><strong>Session ID:</strong> <?php echo session_id(); ?></p>
        <p><small>Recarrega a página para incrementar o contador</small></p>
    </div>
    <a href="/">Voltar ao Portal</a>
</body>
</html>