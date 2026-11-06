import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Briefcase } from 'lucide-react';
import logo from '../assets/logo-prc.jpg';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado para controlar se a janela de aviso está visível (true) ou escondida (false)
  const [mostrarAviso, setMostrarAviso] = useState(false);

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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f6f8', padding: '24px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Sidebar Flutuante */}
      <div style={{ width: '260px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', padding: '24px', display: 'flex', flexDirection: 'column', marginRight: '24px' }}>
        
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <img src={logo} alt="Clínica PRC" style={{ width: '180px' }} />
        </div>

        <nav style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', marginLeft: '16px' }}>
            Menu Principal
          </p>
          <Link to="/dashboard" className={getLinkClass('/dashboard')}>
            <LayoutDashboard size={20} style={{ marginRight: '12px' }} /> Dashboard
          </Link>
          <Link to="/pacientes" className={getLinkClass('/pacientes')}>
            <Users size={20} style={{ marginRight: '12px' }} /> Pacientes
          </Link>    
          
          {/* 2. ADICIONADO: Condição que oculta o link se não for admin */}
          {isAdmin && (
            <Link to="/funcionarios" className={getLinkClass('/funcionarios')}>
              <Briefcase size={20} style={{ marginRight: '12px' }} /> Funcionários
            </Link>
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', marginLeft: '16px' }}>
            Conta
          </p>
          <Link to="/perfil" className={getLinkClass('/perfil')}>
            <Settings size={20} style={{ marginRight: '12px' }} /> Definições
          </Link>
          
          {/* O Link virou uma âncora que chama o modal em vez de mudar de página */}
          <a href="#" onClick={handleTerminarSessao} className="menu-link menu-logout" style={{ marginTop: '8px' }}>
            <LogOut size={20} style={{ marginRight: '12px' }} /> Terminar Sessão
          </a>
        </div>

      </div>

      {/* Área Principal */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', padding: '40px', overflowY: 'auto' }}>
        <Outlet /> 
      </div>

      {/* JANELA DE AVISO (MODAL) - Só aparece se mostrarAviso for true */}
      {mostrarAviso && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '32px', borderRadius: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '380px', textAlign: 'center'
          }}>
            <div style={{ backgroundColor: '#ffe4e6', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
              <LogOut size={28} color="#e11d48" />
            </div>
            
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#0f172a' }}>Terminar Sessão</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>
              Tens a certeza que pretendes sair da tua conta do PRC?
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setMostrarAviso(false)} style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1',
                backgroundColor: 'white', color: '#475569', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                Cancelar
              </button>
              <button onClick={confirmarSaida} style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                backgroundColor: '#e11d48', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                Sim, terminar
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}