import { useState } from 'react';
import axios from 'axios';
import DatePicker from './DatePicker';

// ---------------------------------------------------------------
// Modal "Registar Paciente", usado na página Pacientes e no Dashboard.
// <NovoPacienteModal onFechar={() => ...} onCriado={() => ...} />
// ---------------------------------------------------------------

const VAZIO = { nome: '', email: '', contacto: '', data_nascimento: '', morada: '' };

// Campos do paciente (também usados no modal "Editar Paciente")
export function CamposPaciente({ dados, setDados }) {
  const hoje = new Date().toISOString().split('T')[0];
  return (
    <>
      <div className="field"><label>Nome Completo</label><input className="input" type="text" required value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} /></div>
      <div className="field"><label>E-mail</label><input className="input" type="email" required value={dados.email} onChange={e => setDados({ ...dados, email: e.target.value })} /></div>
      <div className="field-grid">
        <div className="field"><label>Contacto</label><input className="input" type="text" value={dados.contacto} onChange={e => setDados({ ...dados, contacto: e.target.value })} /></div>
        <div className="field"><label>Data de Nascimento</label><DatePicker value={dados.data_nascimento} onChange={v => setDados({ ...dados, data_nascimento: v })} max={hoje} anoSugerido={1980} /></div>
      </div>
      <div className="field"><label>Morada</label><input className="input" type="text" value={dados.morada} onChange={e => setDados({ ...dados, morada: e.target.value })} /></div>
    </>
  );
}

export default function NovoPacienteModal({ onFechar, onCriado }) {
  const [dados, setDados] = useState(VAZIO);
  const [aGuardar, setAGuardar] = useState(false);

  const criar = async (e) => {
    e.preventDefault();
    setAGuardar(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/pacientes', {
        ...dados,
        dataNascimento: dados.data_nascimento,
      }, { headers: { Authorization: `Bearer ${token}` } });
      onCriado?.();
      onFechar();
    } catch (error) {
      alert(error.response?.data?.erro || 'Erro ao criar paciente.');
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title modal-header">Registar Paciente</h2>
        <form onSubmit={criar}>
          <CamposPaciente dados={dados} setDados={setDados} />
          <div className="btn-row">
            <button type="button" className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={aGuardar}>Criar</button>
          </div>
        </form>
      </div>
    </div>
  );
}