import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DashboardView() {
  const [totais, setTotais] = useState({
    pacientes: 0,
    funcionarios: 0,
  });

  useEffect(() => {
    const carregarTotais = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [resPacientes, resFuncionarios] = await Promise.all([
          axios.get('http://localhost:3000/api/pacientes', { headers }),
          axios.get('http://localhost:3000/api/utilizadores', { headers }),
        ]);

        setTotais({
          pacientes: Array.isArray(resPacientes.data) ? resPacientes.data.length : 0,
          funcionarios: Array.isArray(resFuncionarios.data) ? resFuncionarios.data.length : 0,
        });
      } catch (error) {
        console.error('Erro ao carregar totais do dashboard:', error);
      }
    };

    carregarTotais();
  }, []);

  const cartao = {
    padding: 'var(--space-6)',
    flex: 1,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Bem-vindo ao painel de controlo do Portal de Reabilitação Clínica.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
        <div className="card" style={cartao}>
          <h3 className="field-label" style={{ color: 'var(--color-text-muted)' }}>Total de Pacientes</h3>
          <p style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', marginTop: 'var(--space-2)' }}>{totais.pacientes}</p>
        </div>
        <div className="card" style={cartao}>
          <h3 className="field-label" style={{ color: 'var(--color-text-muted)' }}>Total de Funcionários</h3>
          <p style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)', marginTop: 'var(--space-2)' }}>{totais.funcionarios}</p>
        </div>
      </div>
    </div>
  );
}