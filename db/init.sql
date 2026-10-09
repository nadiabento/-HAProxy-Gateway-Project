CREATE DATABASE IF NOT EXISTS clinica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinica;

CREATE TABLE IF NOT EXISTS registos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_paciente VARCHAR(150) NOT NULL,
  lesao VARCHAR(150) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  data_nascimento DATE,
  contacto VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_paciente VARCHAR(150) NOT NULL,
    data_sessao DATE NOT NULL,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_paciente VARCHAR(150) NOT NULL,
    titulo_plano VARCHAR(200) NOT NULL,
    descricao_exercicios TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO registos (nome_paciente, lesao, descricao) VALUES 
('João Silva', 'Entorse tornozelo', 'Teste D4'),
('Maria Santos', 'Dor lombar', 'Teste D4');

INSERT INTO pacientes (nome, data_nascimento, contacto) VALUES
('João Silva', '1985-05-15', '919999999'),
('Maria Santos', '1990-03-20', '919888888');

INSERT INTO relatorios (nome_paciente, data_sessao, observacoes) VALUES
('João Silva', '2026-10-05', 'Sessão focada em Pilates e estabilidade do core (core stability). O paciente apresentou melhorias na postura e referiu menos dor lombar durante a execução dos movimentos.'),
('Maria Santos', '2026-10-08', 'Treino funcional focado na mobilidade e membros inferiores. Realizou leg press e exercícios com cabo de forma controlada. Boa tolerância ao esforço, sem queixas articulares.');

INSERT INTO exercicios (nome_paciente, titulo_plano, descricao_exercicios) VALUES
('João Silva', 'Reforço Lombar e Core', '1. Prancha abdominal (3x30 seg)\n2. Exercícios com mini bands para ativação de glúteos (3x15)\n3. Caminhada em passadeira com inclinação (15 min)'),
('Maria Santos', 'Reabilitação e Força Inferior', '1. Hip thrusts (3x12)\n2. Hack squat com peso adaptado (3x10)\n3. Cable squats (3x12)\n4. Corrida leve no final, com monitorização do ritmo (pace) no Strava/Smartwatch.');
