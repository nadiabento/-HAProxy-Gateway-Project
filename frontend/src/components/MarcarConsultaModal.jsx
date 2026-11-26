import { useEffect, useState } from 'react';
import axios from 'axios';
import Autocomplete from './Autocomplete';
import { DateTimePicker } from './DatePicker';

// ---------------------------------------------------------------
// Modal "Marcar Consulta", usado na página Consultas e no Dashboard.
// Carrega sozinho a lista de pacientes e de fisioterapeutas.
// <MarcarConsultaModal onFechar={() => ...} onCriada={() => ...} />
// ---------------------------------------------------------------

const API = 'http://localhost:3000/api';
const VAZIO = { pacienteId: '', fisioterapeutaId: '', dataHora: '', duracaoMinutos: 45 };

export default function MarcarConsultaModal({ onFechar, onCriada }) {
  const [dados, setDados] = useState(VAZIO);
  const [pacientes, setPacientes] = useState([]);
  const [fisioterapeutas, setFisioterapeutas] = useState([]);
  const [aGuardar, setAGuardar] = useState(false);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    axios.get(`${API}/pacientes`, { headers: headers() })
      .then((r) => setPacientes(r.data || []))
      .catch((e) => console.error('Erro ao carregar pacientes:', e));
    axios.get(`${API}/fisioterapeutas`, { headers: headers() })
      .then((r) => setFisioterapeutas(r.data || []))
      .catch((e) => console.error('Erro ao carregar fisioterapeutas:', e));
  }, []);

  const marcar = async (e) => {
    e.preventDefault();
    setAGuardar(true);
    try {
      await axios.post(`${API}/consultas`, {
        pacienteId: Number(dados.pacienteId),
        fisioterapeutaId: Number(dados.fisioterapeutaId),
        dataHora: new Date(dados.dataHora).toISOString(),
        duracaoMinutos: Number(dados.duracaoMinutos) || 45,
        estado: 'agendada',
      }, { headers: headers() });
      onCriada?.();
      onFechar();
    } catch (error) {
      alert(error.response?.data?.erro || 'Erro ao marcar consulta.');
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title modal-header">Marcar Consulta</h2>
        <form onSubmit={marcar}>
          <div className="field">
            <label>Paciente</label>
            <Autocomplete
              required
              placeholder="Escreva o nome, e-mail ou contacto do paciente..."
              semResultados="Nenhum paciente registado com esse nome."
              mensagemInvalida="Escolha um paciente registado da lista."
              value={dados.pacienteId}
              onChange={(id) => setDados((d) => ({ ...d, pacienteId: id }))}
              opcoes={pacientes.map((p) => ({
                value: p.id,
                label: p.nome || p.dadosPessoais?.nome || 'Sem nome',
                // O e-mail e o contacto ajudam a distinguir pacientes com o mesmo nome
                detalhe: [p.email || p.dadosPessoais?.email, p.contacto || p.dadosPessoais?.contacto].filter(Boolean).join(' · '),
              }))}
            />
          </div>

          <div className="field">
            <label>Fisioterapeuta</label>
            <Autocomplete
              required
              placeholder="Escreva o nome ou a especialidade do fisioterapeuta..."
              semResultados="Nenhum fisioterapeuta encontrado."
              mensagemInvalida="Escolha um fisioterapeuta da lista."
              value={dados.fisioterapeutaId}
              onChange={(id) => setDados((d) => ({ ...d, fisioterapeutaId: id }))}
              opcoes={fisioterapeutas.map((f) => ({
                value: f.id,
                label: f.nome || f.dadosPessoais?.nome || 'Sem nome',
                detalhe: [f.especialidade, f.email || f.dadosPessoais?.email].filter(Boolean).join(' · '),
              }))}
            />
          </div>

          <div className="field">
            <label>Data e Hora</label>
            <DateTimePicker
              required
              value={dados.dataHora}
              onChange={(v) => setDados((d) => ({ ...d, dataHora: v }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="field">
            <label>Duração (minutos)</label>
            <input
              className="input"
              type="number"
              min="15"
              step="15"
              required
              value={dados.duracaoMinutos}
              onChange={(e) => setDados((d) => ({ ...d, duracaoMinutos: e.target.value }))}
            />
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={aGuardar}>Confirmar Marcação</button>
          </div>
        </form>
      </div>
    </div>
  );
}