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

  return (
    <div>
      <p style={{ color: '#7f8c8d' }}>Bem-vindo ao painel de controlo do Portal de Reabilitação Clínica.</p>

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1 }}>
          <h3>Total de Pacientes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>{totais.pacientes}</p>
        </div>
        <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1 }}>
          <h3>Total de Funcionários</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>{totais.funcionarios}</p>
        </div>
      </div>
    </div>
  );
}