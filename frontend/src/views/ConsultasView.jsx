import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import axios from 'axios';

export default function ConsultasView() {
  const [consultas, setConsultas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [fisioterapeutas, setFisioterapeutas] = useState([]);

  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [consultaAApagar, setConsultaAApagar] = useState(null);

  const [permissoes, setPermissoes] = useState({
    eRececionista: false,
    eStaff: false,
    eAdmin: false,
  });

  const [formData, setFormData] = useState({
    pacienteId: '',
    fisioterapeutaId: '',
    dataHora: '',
    duracaoMinutos: 45,
  });

  const [editClinico, setEditClinico] = useState({
    estado: 'agendada',
    diagnostico: '',
    evolucaoClinica: '',
    observacoes: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    let rececionista = false;
    let staff = false;
    let admin = false;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const perfis = (payload.perfis || []).map((p) => p.toLowerCase());
        const cargo = payload.cargo ? payload.cargo.toLowerCase() : '';

        rececionista = perfis.includes('rececionista') || cargo === 'rececionista';
        admin = perfis.includes('administrador') || payload.email === 'admin@prc.pt';
        staff =
          rececionista ||
          admin ||
          perfis.includes('fisioterapeuta') ||
          cargo === 'fisioterapeuta';

        setPermissoes({ eRececionista: rececionista, eStaff: staff, eAdmin: admin });
      } catch (error) {}
    }

    carregarConsultas();
    if (rececionista || staff) {
      carregarListasAuxiliares();
    }
  }, []);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const carregarConsultas = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/consultas', {
        headers: getHeaders(),
      });
      setConsultas(res.data);
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    }
  };

  const carregarListasAuxiliares = async () => {
    try {
      const [resPac, resFisio] = await Promise.all([
        axios.get('http://localhost:3000/api/pacientes', { headers: getHeaders() }),
        axios.get('http://localhost:3000/api/fisioterapeutas', { headers: getHeaders() }),
      ]);
      setPacientes(resPac.data || []);
      setFisioterapeutas(resFisio.data || []);
    } catch (error) {
      console.error('Erro ao carregar pacientes/fisioterapeutas:', error);
    }
  };

  const handleCriarConsulta = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:3000/api/consultas',
        {
          pacienteId: Number(formData.pacienteId),
          fisioterapeutaId: Number(formData.fisioterapeutaId),
          dataHora: new Date(formData.dataHora).toISOString(),
          duracaoMinutos: Number(formData.duracaoMinutos) || 45,
          estado: 'agendada',
        },
        { headers: getHeaders() }
      );
      setFormData({ pacienteId: '', fisioterapeutaId: '', dataHora: '', duracaoMinutos: 45 });
      setModalCriarAberto(false);
      carregarConsultas();
    } catch (error) {
      alert(error.response?.data?.erro || 'Erro ao marcar consulta.');
    }
  };

  const abrirDetalhes = (consulta) => {
    setConsultaSelecionada(consulta);
    setEditClinico({
      estado: consulta.estado || 'agendada',
      diagnostico: consulta.diagnostico || '',
      evolucaoClinica: consulta.evolucaoClinica || '',
      observacoes: consulta.observacoes || '',
    });
  };

  const handleGuardarDetalhes = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3000/api/consultas/${consultaSelecionada.id}`,
        editClinico,
        { headers: getHeaders() }
      );
      setConsultaSelecionada(null);
      carregarConsultas();
    } catch (error) {
      alert(error.response?.data?.erro || 'Erro ao atualizar consulta.');
    }
  };

  const handleApagar = async () => {
    const id = consultaAApagar?.id;
    setConsultaAApagar(null);
    if (!id) return;
    try {
      await axios.delete(`http://localhost:3000/api/consultas/${id}`, {
        headers: getHeaders(),
      });
      carregarConsultas();
    } catch (error) {
      alert('Erro ao eliminar consulta.');
    }
  };

  const formatarDataHora = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const badgeEstado = (estado) => {
    const classes = {
      agendada: 'badge-primary',
      realizada: 'badge-success',
      cancelada: 'badge-danger',
    };
    return (
      <span className={`badge ${classes[estado] || 'badge-neutral'}`}>
        {estado || 'agendada'}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Consultas</h2>
        {permissoes.eRececionista && (
          <button className="btn btn-primary" onClick={() => setModalCriarAberto(true)}>
            <Plus size={20} /> Marcar Consulta
          </button>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Paciente</th>
              <th>Fisioterapeuta</th>
              <th>Duração</th>
              <th>Estado</th>
              <th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {consultas.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">Nenhuma consulta registada.</td>
              </tr>
            ) : (
              consultas.map((c) => (
                <tr key={c.id}>
                  <td>{formatarDataHora(c.dataHora)}</td>
                  <td>{c.paciente?.dadosPessoais?.nome || '-'}</td>
                  <td>{c.fisioterapeuta?.dadosPessoais?.nome || '-'}</td>
                  <td>{c.duracaoMinutos ? `${c.duracaoMinutos} min` : '45 min'}</td>
                  <td>{badgeEstado(c.estado)}</td>
                  <td className="actions">
                    <button className="btn-icon" onClick={() => abrirDetalhes(c)} title="Ver / Editar Consulta">
                      <Eye size={18} />
                    </button>
                    {permissoes.eAdmin && (
                      <button className="btn-icon danger" onClick={() => setConsultaAApagar(c)} title="Eliminar Consulta">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Marcar Consulta (Apenas Rececionista) */}
      {modalCriarAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title modal-header">Marcar Consulta</h2>
            <form onSubmit={handleCriarConsulta}>
              <div className="field">
                <label>Paciente</label>
                <select
                  className="input"
                  required
                  value={formData.pacienteId}
                  onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
                >
                  <option value="">Selecione um paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome || p.dadosPessoais?.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Fisioterapeuta</label>
                <select
                  className="input"
                  required
                  value={formData.fisioterapeutaId}
                  onChange={(e) => setFormData({ ...formData, fisioterapeutaId: e.target.value })}
                >
                  <option value="">Selecione um fisioterapeuta...</option>
                  {fisioterapeutas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome || f.dadosPessoais?.nome} {f.especialidade ? `(${f.especialidade})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Data e Hora</label>
                <input
                  className="input"
                  type="datetime-local"
                  required
                  value={formData.dataHora}
                  onChange={(e) => setFormData({ ...formData, dataHora: e.target.value })}
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
                  value={formData.duracaoMinutos}
                  onChange={(e) => setFormData({ ...formData, duracaoMinutos: e.target.value })}
                />
              </div>

              <div className="btn-row">
                <button type="button" className="btn btn-secondary" onClick={() => setModalCriarAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Marcação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes / Registo Clínico */}
      {consultaSelecionada && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Detalhes da Consulta</h2>
              <p className="modal-text">
                <strong>Paciente:</strong> {consultaSelecionada.paciente?.dadosPessoais?.nome} |{' '}
                <strong>Fisioterapeuta:</strong> {consultaSelecionada.fisioterapeuta?.dadosPessoais?.nome}
              </p>
            </div>

            <form onSubmit={handleGuardarDetalhes}>
              <div className="field">
                <label>Estado</label>
                <select
                  className="input"
                  disabled={!permissoes.eStaff}
                  value={editClinico.estado}
                  onChange={(e) => setEditClinico({ ...editClinico, estado: e.target.value })}
                >
                  <option value="agendada">Agendada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className="field">
                <label>Diagnóstico</label>
                <textarea
                  className="input"
                  rows="2"
                  disabled={!permissoes.eStaff}
                  value={editClinico.diagnostico}
                  onChange={(e) => setEditClinico({ ...editClinico, diagnostico: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Evolução Clínica</label>
                <textarea
                  className="input"
                  rows="2"
                  disabled={!permissoes.eStaff}
                  value={editClinico.evolucaoClinica}
                  onChange={(e) => setEditClinico({ ...editClinico, evolucaoClinica: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Observações</label>
                <textarea
                  className="input"
                  rows="2"
                  disabled={!permissoes.eStaff}
                  value={editClinico.observacoes}
                  onChange={(e) => setEditClinico({ ...editClinico, observacoes: e.target.value })}
                />
              </div>

              <div className="btn-row">
                <button type="button" className="btn btn-secondary" onClick={() => setConsultaSelecionada(null)}>
                  Fechar
                </button>
                {permissoes.eStaff && (
                  <button type="submit" className="btn btn-primary">
                    Guardar Alterações
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de eliminação */}
      <ConfirmModal
        open={!!consultaAApagar}
        icon={Trash2}
        title="Eliminar Consulta"
        message="Tens a certeza que pretendes eliminar esta consulta permanentemente? Esta ação não pode ser desfeita."
        confirmLabel="Sim, eliminar"
        variant="danger"
        onConfirm={handleApagar}
        onCancel={() => setConsultaAApagar(null)}
      />
    </div>
  );
}