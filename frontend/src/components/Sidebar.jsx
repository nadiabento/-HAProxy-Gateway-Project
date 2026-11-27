import { useEffect, useState } from 'react';
import axios from 'axios';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, LogOut, Briefcase } from 'lucide-react';
import logo from '../assets/logo-prc.jpg';
import ConfirmModal from './ConfirmModal';
import ContaModal from './ContaModal';
import { iniciais, nomeCargo } from '../utils/conta';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado para controlar se a janela de aviso está visível (true) ou escondida (false)
  const [mostrarAviso, setMostrarAviso] = useState(false);

  // Utilizador com sessão iniciada (nome e cargo aparecem no fundo da sidebar)
  const [conta, setConta] = useState(null);
  const [contaAberta, setContaAberta] = useState(false);

  useEffect(() => {
    axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((r) => setConta(r.data))
      .catch((e) => console.error('Erro ao carregar a conta:', e));
  }, []);

  const getLinkClass = (path) => {
    return location.pathname === path ? 'menu-link ativo' : 'menu-link inativo';
  };

  // Função disparada ao clicar no botão de terminar sessão
  const handleTerminarSessao = (e) => {
    e.preventDefault(); 
    setMostrarAviso(true); 
  };

  // Função disparada se o utilizador clicar em "Sim, terminar"
  const confirmarSaida = () => {
    setMostrarAviso(false);
    localStorage.removeItem('token'); // Adicionado para limpar a sessão!
    navigate('/'); 
  };

  // 1. ADICIONADO: Lógica para verificar se é o administrador
  const token = localStorage.getItem('token');
  let isAdmin = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.email === 'admin@prc.pt') {
        isAdmin = true;
      }
    } catch (e) {
      console.error("Erro ao validar token no Sidebar");
    }
  }

  return (
    <div className="layout">

      {/* Sidebar Flutuante */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="Clínica PRC" />
        </div>

        <nav>
          <p className="sidebar-section-label">Menu Principal</p>
          <Link to="/dashboard" className={getLinkClass('/dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/pacientes" className={getLinkClass('/pacientes')}>
            <Users size={20} /> Pacientes
          </Link>
          <Link to="/consultas" className={getLinkClass('/consultas')}>
            <Calendar size={20} /> Consultas
          </Link>

          {/* Só o administrador vê o link de Funcionários */}
          {isAdmin && (
            <Link to="/funcionarios" className={getLinkClass('/funcionarios')}>
              <Briefcase size={20} /> Funcionários
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-section-label">Conta</p>
          <button type="button" className="user-card" onClick={() => setContaAberta(true)} title="Gerir a minha conta">
            <div className="avatar">{iniciais(conta?.nome)}</div>
            <div className="user-card-info">
              <span className="user-card-nome">{conta?.nome || 'A carregar…'}</span>
              <span className="user-card-cargo">{nomeCargo(conta?.perfis)}</span>
            </div>
          </button>

          {/* Abre o modal de confirmação em vez de mudar de página */}
          <a href="#" onClick={handleTerminarSessao} className="menu-link menu-logout">
            <LogOut size={20} /> Terminar Sessão
          </a>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Modal "A minha conta" */}
      {contaAberta && (
        <ContaModal onFechar={() => setContaAberta(false)} onAtualizado={setConta} />
      )}

      {/* Modal de referência do design system */}
      <ConfirmModal
        open={mostrarAviso}
        icon={LogOut}
        title="Terminar Sessão"
        message="Tens a certeza que pretendes sair da tua conta do PRC?"
        confirmLabel="Sim, terminar"
        variant="danger"
        onConfirm={confirmarSaida}
        onCancel={() => setMostrarAviso(false)}
      />
    </div>
  );
}