import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NovoPacienteModal from '../components/NovoPacienteModal';
import MarcarConsultaModal from '../components/MarcarConsultaModal';
import { CalendarDays, CalendarClock, Users, Briefcase, Plus, UserPlus, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------
// Dashboard: responde a "o que tenho para hoje?".
// Cada perfil vê o que lhe interessa:
//   - administrador: tudo (incluindo o total de funcionários)
//   - rececionista: agenda de todos + atalhos para marcar
//   - fisioterapeuta: só as suas consultas
// ---------------------------------------------------------------

const API = 'http://localhost:3000/api';

const lerSessao = () => {
  try {
    const payload = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
    const perfis = (payload.perfis || []).map((p) => String(p).toLowerCase());
    const admin = perfis.includes('administrador') || payload.email === 'admin@prc.pt';
    return {
      id: payload.id,
      admin,
      rececionista: perfis.includes('rececionista'),
      fisioterapeuta: perfis.includes('fisioterapeuta') && !admin,
    };
  } catch {
    return { id: null, admin: false, rececionista: false, fisioterapeuta: false };
  }
};

const mesmoDia = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatarHora = (d) => d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
const formatarDia = (d) => {
  const hoje = new Date();
  const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  if (mesmoDia(d, hoje)) return 'Hoje';
  if (mesmoDia(d, amanha)) return 'Amanhã';
  return d.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit' });
};

const CLASSE_ESTADO = { agendada: 'badge-primary', realizada: 'badge-success', cancelada: 'badge-danger' };

function CartaoNumero({ icon: Icon, titulo, valor, cor, fundo }) {
  return (
    <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', backgroundColor: fundo, color: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} />
      </div>
      <div>
        <p className="field-label" style={{ color: 'var(--color-text-muted)' }}>{titulo}</p>
        <p style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-strong)', lineHeight: 1.2 }}>{valor}</p>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const navigate = useNavigate();
  const [sessao] = useState(lerSessao);
  const [consultas, setConsultas] = useState([]);
  const [totalPacientes, setTotalPacientes] = useState(null);
  const [totalFuncionarios, setTotalFuncionarios] = useState(null);
  const [modal, setModal] = useState(null); // 'paciente' | 'consulta' | null
  const [recarregar, setRecarregar] = useState(0); // muda para voltar a pedir os dados

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    // Cada pedido é independente: se um falhar (ex.: sem permissão), os outros continuam
    axios.get(`${API}/consultas`, { headers })
      .then((r) => setConsultas(Array.isArray(r.data) ? r.data : []))
      .catch((e) => console.error('Erro ao carregar consultas:', e));

    axios.get(`${API}/pacientes`, { headers })
      .then((r) => setTotalPacientes(Array.isArray(r.data) ? r.data.length : 0))
      .catch(() => setTotalPacientes('-'));

    // A lista de funcionários só está disponível para o administrador
    if (sessao.admin) {
      axios.get(`${API}/utilizadores`, { headers })
        .then((r) => setTotalFuncionarios(Array.isArray(r.data) ? r.data.length : 0))
        .catch(() => setTotalFuncionarios('-'));
    }
  }, [sessao.admin, recarregar]);

  // O fisioterapeuta só vê as suas consultas
  const minhas = sessao.fisioterapeuta
    ? consultas.filter((c) => c.fisioterapeuta?.dadosPessoais?.utilizadorId === sessao.id)
    : consultas;

  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const daquiA7 = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth(), inicioHoje.getDate() + 7);
  const comData = minhas.map((c) => ({ ...c, data: new Date(c.dataHora) }));

  const ativas = comData.filter((c) => c.estado !== 'cancelada');
  const consultasHoje = ativas.filter((c) => mesmoDia(c.data, agora));
  const proximos7 = ativas.filter((c) => c.data >= inicioHoje && c.data < daquiA7);
  const proximas = comData
    .filter((c) => c.data >= inicioHoje && c.estado === 'agendada')
    .sort((a, b) => a.data - b.data)
    .slice(0, 6);

  // Resumo de todas as consultas (de qualquer mês)
  const resumo = {
    agendada: comData.filter((c) => c.estado === 'agendada').length,
    realizada: comData.filter((c) => c.estado === 'realizada').length,
    cancelada: comData.filter((c) => c.estado === 'cancelada').length,
  };
  const totalMes = comData.length;

  const podeMarcar = sessao.admin || sessao.rececionista;

  return (
    <div>
      <div className="page-header" style={{ alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <p className="page-subtitle">
            {sessao.fisioterapeuta ? 'As tuas consultas de hoje e dos próximos dias.' : 'Bem-vindo ao painel de controlo do Portal de Reabilitação Clínica.'}
          </p>
        </div>
        {podeMarcar && (
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-secondary" onClick={() => setModal('paciente')}>
              <UserPlus size={18} /> Novo Paciente
            </button>
            <button className="btn btn-primary" onClick={() => setModal('consulta')}>
              <Plus size={18} /> Marcar Consulta
            </button>
          </div>
        )}
      </div>

      {/* 1. Cartões de números */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        <CartaoNumero icon={CalendarClock} titulo="Consultas hoje" valor={consultasHoje.length} cor="var(--color-primary)" fundo="var(--color-primary-soft-strong)" />
        <CartaoNumero icon={CalendarDays} titulo="Próximos 7 dias" valor={proximos7.length} cor="var(--color-primary)" fundo="var(--color-primary-soft-strong)" />
        <CartaoNumero icon={Users} titulo="Pacientes" valor={totalPacientes ?? '…'} cor="var(--color-success)" fundo="var(--color-success-soft)" />
        {sessao.admin && (
          <CartaoNumero icon={Briefcase} titulo="Funcionários" valor={totalFuncionarios ?? '…'} cor="var(--color-text-secondary)" fundo="var(--color-border-subtle)" />
        )}
      </div>

      <div className="dash-grid">
        {/* 2. Próximas consultas */}
        <div className="card" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-5) var(--space-6)' }}>
            <h3 className="modal-title" style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>Próximas consultas</h3>
            <button className="btn-icon" style={{ width: 'auto', padding: '0 var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', gap: 4 }} onClick={() => navigate('/consultas')}>
              Ver todas <ChevronRight size={16} />
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Dia</th>
                <th>Hora</th>
                <th>Paciente</th>
                {!sessao.fisioterapeuta && <th>Fisioterapeuta</th>}
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {proximas.length === 0 ? (
                <tr><td colSpan="5" className="empty">Não há consultas agendadas.</td></tr>
              ) : (
                proximas.map((c) => (
                  <tr
                    key={c.id}
                    className="linha-clicavel"
                    title="Abrir detalhes da consulta"
                    onClick={() => navigate('/consultas', { state: { abrirConsultaId: c.id } })}
                  >
                    <td style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-strong)' }}>{formatarDia(c.data)}</td>
                    <td>{formatarHora(c.data)}</td>
                    <td>{c.paciente?.dadosPessoais?.nome || '-'}</td>
                    {!sessao.fisioterapeuta && <td>{c.fisioterapeuta?.dadosPessoais?.nome || '-'}</td>}
                    <td><span className={`badge ${CLASSE_ESTADO[c.estado] || 'badge-neutral'}`}>{c.estado}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Resumo das consultas por estado */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 className="modal-title" style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-1)' }}>Resumo das consultas</h3>
          <p className="modal-text" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-5)' }}>
            {totalMes} {totalMes === 1 ? 'consulta' : 'consultas'} no total
          </p>

          {/* Barra empilhada */}
          <div style={{ display: 'flex', height: 12, borderRadius: 'var(--radius-full)', overflow: 'hidden', backgroundColor: 'var(--color-border-subtle)', gap: totalMes ? 2 : 0 }}>
            {[
              ['agendada', 'var(--color-primary)'],
              ['realizada', 'var(--color-success)'],
              ['cancelada', 'var(--color-danger)'],
            ].map(([estado, cor]) => resumo[estado] > 0 && (
              <div key={estado} style={{ width: `${(resumo[estado] / totalMes) * 100}%`, backgroundColor: cor }} />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            {[
              ['Agendadas', resumo.agendada, 'var(--color-primary)'],
              ['Realizadas', resumo.realizada, 'var(--color-success)'],
              ['Canceladas', resumo.cancelada, 'var(--color-danger)'],
            ].map(([nome, n, cor]) => (
              <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: cor }} />
                <span style={{ flex: 1, color: 'var(--color-text)' }}>{nome}</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-strong)' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Os atalhos abrem os modais aqui mesmo: ao cancelar, continua-se no Dashboard */}
      {modal === 'paciente' && (
        <NovoPacienteModal onFechar={() => setModal(null)} onCriado={() => setRecarregar((n) => n + 1)} />
      )}
      {modal === 'consulta' && (
        <MarcarConsultaModal onFechar={() => setModal(null)} onCriada={() => setRecarregar((n) => n + 1)} />
      )}
    </div>
  );
}