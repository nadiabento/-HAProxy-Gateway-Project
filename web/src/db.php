<?php
// Valores retirados do seu ficheiro .env
$host = 'db'; 
$dbname = 'clinica';
$user = 'clinica';
$pass = 'Clinica123';

// Estabelece a ligação e cria a variável $pdo
$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
?>