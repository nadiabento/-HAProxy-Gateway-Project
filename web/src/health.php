<?php
header('Content-Type: application/json');
http_response_code(200);

try {
    require 'db.php';
    
    // Testar conexão à BD
    $stmt = $pdo->query("SELECT 1");
    
    echo json_encode([
        'status' => 'ok',
        'hostname' => gethostname(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Throwable $e) {
    error_log('health: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(['status' => 'error']);
}
?>