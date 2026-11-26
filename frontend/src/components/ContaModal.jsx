import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserRound, KeyRound, X } from 'lucide-react';
import DatePicker from './DatePicker';
import { iniciais, nomeCargo } from '../utils/conta';

// ---------------------------------------------------------------
// Modal "A minha conta": o utilizador vê e altera os seus dados
// e muda a palavra-passe. Abre ao clicar no nome, na sidebar.
// <ContaModal onFechar={() => ...} onAtualizado={(dados) => ...} />
// ---------------------------------------------------------------

const API = 'http://localhost:3000/api/auth';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

function Aviso({ tipo, children }) {
  if (!children) return null;
  const cores = tipo === 'erro'
    ? { bg: 'var(--color-danger-soft)', fg: 'var(--color-danger-hover)' }
    : { bg: 'var(--color-success-soft)', fg: 'var(--color-success)' };
  return (
    <p style={{ backgroundColor: cores.bg, color: cores.fg, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>
      {children}
    </p>
  );
}

export default function ContaModal({ onFechar, onAtualizado }) {
  const [separador, setSeparador] = useState('dados');
  const [conta, setConta] = useState(null);
  const [dados, setDados] = useState({ nome: '', email: '', contacto: '', morada: '', data_nascimento: '' });
  const [pass, setPass] = useState({ atual: '', nova: '', confirmar: '' });
  const [aviso, setAviso] = useState({ tipo: '', texto: '' });
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    axios.get(`${API}/me`, { headers: headers() })
      .then((r) => {
        setConta(r.data);
        setDados({
          nome: r.data.nome || '',
          email: r.data.email || '',
          contacto: r.data.contacto || '',
          morada: r.data.morada || '',
          data_nascimento: r.data.dataNascimento ? String(r.data.dataNascimento).split('T')[0] : '',
        });
      })
      .catch(() => setAviso({ tipo: 'erro', texto: 'Não foi possível carregar os teus dados.' }));
  }, []);

  const mudarSeparador = (s) => { setSeparador(s); setAviso({ tipo: '', texto: '' }); };

  const guardarDados = async (e) => {
    e.preventDefault();
    setAGuardar(true);
    try {
      const r = await axios.put(`${API}/me`, { ...dados, dataNascimento: dados.data_nascimento }, { headers: headers() });
      const atualizada = { ...conta, ...r.data };
      setConta(atualizada);
      setAviso({ tipo: 'ok', texto: 'Dados guardados.' });
      onAtualizado?.(atualizada);
    } catch (error) {
      setAviso({ tipo: 'erro', texto: error.response?.data?.erro || 'Erro ao guardar os dados.' });
    } finally {
      setAGuardar(false);
    }
  };

  const guardarPassword = async (e) => {
    e.preventDefault();
    if (pass.nova !== pass.confirmar) {
      setAviso({ tipo: 'erro', texto: 'A confirmação não é igual à nova palavra-passe.' });
      return;
    }
    setAGuardar(true);
    try {
      await axios.put(`${API}/me/password`, { passwordAtual: pass.atual, passwordNova: pass.nova }, { headers: headers() });
      setPass({ atual: '', nova: '', confirmar: '' });
      setAviso({ tipo: 'ok', texto: 'Palavra-passe alterada.' });
    } catch (error) {
      setAviso({ tipo: 'erro', texto: error.response?.data?.erro || 'Erro ao alterar a palavra-passe.' });
    } finally {
      setAGuardar(false);
    }
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho com avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div className="avatar avatar-lg">{iniciais(dados.nome || conta?.nome)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="modal-title" style={{ margin: 0 }}>A minha conta</h2>
            <p className="modal-text" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
              {conta ? `${conta.nome} · ${nomeCargo(conta.perfis)}` : 'A carregar…'}
            </p>
          </div>
          <button type="button" className="btn-icon" style={{ color: 'var(--color-text-muted)' }} onClick={onFechar} aria-label="Fechar"><X size={20} /></button>
        </div>

        {/* Separadores */}
        <div className="tabs">
          <button type="button" className={`tab${separador === 'dados' ? ' ativo' : ''}`} onClick={() => mudarSeparador('dados')}>
            <UserRound size={16} /> Dados pessoais
          </button>
          <button type="button" className={`tab${separador === 'password' ? ' ativo' : ''}`} onClick={() => mudarSeparador('password')}>
            <KeyRound size={16} /> Palavra-passe
          </button>
        </div>

        <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>

        {separador === 'dados' ? (
          <form onSubmit={guardarDados}>
            <div className="field"><label>Nome Completo</label><input className="input" type="text" required value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} /></div>
            <div className="field"><label>E-mail</label><input className="input" type="email" required value={dados.email} onChange={(e) => setDados({ ...dados, email: e.target.value })} /></div>
            <div className="field-grid">
              <div className="field"><label>Contacto</label><input className="input" type="text" value={dados.contacto} onChange={(e) => setDados({ ...dados, contacto: e.target.value })} /></div>
              <div className="field"><label>Data de Nascimento</label><DatePicker value={dados.data_nascimento} onChange={(v) => setDados({ ...dados, data_nascimento: v })} max={hoje} anoSugerido={1990} /></div>
            </div>
            <div className="field"><label>Morada</label><input className="input" type="text" value={dados.morada} onChange={(e) => setDados({ ...dados, morada: e.target.value })} /></div>
            <div className="btn-row">
              <button type="button" className="btn btn-secondary" onClick={onFechar}>Fechar</button>
              <button type="submit" className="btn btn-primary" disabled={aGuardar || !conta}>Guardar</button>
            </div>
          </form>
        ) : (
          <form onSubmit={guardarPassword}>
            <div className="field"><label>Palavra-passe atual</label><input className="input" type="password" autoComplete="current-password" required value={pass.atual} onChange={(e) => setPass({ ...pass, atual: e.target.value })} /></div>
            <div className="field"><label>Nova palavra-passe</label><input className="input" type="password" autoComplete="new-password" minLength={6} required value={pass.nova} onChange={(e) => setPass({ ...pass, nova: e.target.value })} /></div>
            <div className="field"><label>Confirmar nova palavra-passe</label><input className="input" type="password" autoComplete="new-password" minLength={6} required value={pass.confirmar} onChange={(e) => setPass({ ...pass, confirmar: e.target.value })} /></div>
            <div className="btn-row">
              <button type="button" className="btn btn-secondary" onClick={onFechar}>Fechar</button>
              <button type="submit" className="btn btn-primary" disabled={aGuardar}>Alterar palavra-passe</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}