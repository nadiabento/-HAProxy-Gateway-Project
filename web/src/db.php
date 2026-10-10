<?php
$host   = getenv('DB_HOST') ?: 'db';
$dbname = getenv('DB_NAME') ?: 'clinica';
$user   = getenv('DB_USER') ?: 'clinica';
$pass   = getenv('DB_PASSWORD');
if ($pass === false) {
    throw new RuntimeException('DB_PASSWORD não definida');
}

$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_TIMEOUT => 2,
]);