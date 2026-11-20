import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function ConsultasView() {
  const [consultas, setConsultas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [fisioterapeutas, setFisioterapeutas] = useState([]);

  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);

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

  const handleApagar = async (id) => {
    if (!window.confirm('Eliminar esta consulta permanentemente?')) return;
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
    const cores = {
      agendada: { bg: '#e0f2fe', color: '#0369a1' },
      realizada: { bg: '#dcfce7', color: '#15803d' },
      cancelada: { bg: '#fee2e2', color: '#b91c1c' },
    };
    const estilo = cores[estado] || { bg: '#f1f5f9', color: '#475569' };
    return (
      <span
        style={{
          backgroundColor: estilo.bg,
          color: estilo.color,
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'capitalize',
        }}
      >
        {estado || 'agendada'}
      </span>
    );
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    marginBottom: '12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2>Consultas</h2>
        {permissoes.eRececionista && (
          <button
            onClick={() => setModalCriarAberto(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <Plus size={20} /> Marcar Consulta
          </button>
        )}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px' }}>DATA / HORA</th>
              <th style={{ padding: '16px' }}>PACIENTE</th>
              <th style={{ padding: '16px' }}>FISIOTERAPEUTA</th>
              <th style={{ padding: '16px' }}>DURAÇÃO</th>
              <th style={{ padding: '16px' }}>ESTADO</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {consultas.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Nenhuma consulta registada.
                </td>
              </tr>
            ) : (
              consultas.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px' }}>{formatarDataHora(c.dataHora)}</td>
                  <td style={{ padding: '16px' }}>{c.paciente?.dadosPessoais?.nome || '-'}</td>
                  <td style={{ padding: '16px' }}>{c.fisioterapeuta?.dadosPessoais?.nome || '-'}</td>
                  <td style={{ padding: '16px' }}>{c.duracaoMinutos ? `${c.duracaoMinutos} min` : '45 min'}</td>
                  <td style={{ padding: '16px' }}>{badgeEstado(c.estado)}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => abrirDetalhes(c)}
                      title="Ver / Editar Consulta"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', marginRight: '12px' }}
                    >
                      <Eye size={18} />
                    </button>
                    {permissoes.eAdmin && (
                      <button
                        onClick={() => handleApagar(c.id)}
                        title="Eliminar Consulta"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>Marcar Consulta</h2>
            <form onSubmit={handleCriarConsulta}>
              <label>Paciente</label>
              <select
                required
                style={inputStyle}
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

              <label>Fisioterapeuta</label>
              <select
                required
                style={inputStyle}
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

              <label>Data e Hora</label>
              <input
                type="datetime-local"
                required
                style={inputStyle}
                value={formData.dataHora}
                onChange={(e) => setFormData({ ...formData, dataHora: e.target.value })}
              />

              <label>Duração (minutos)</label>
              <input
                type="number"
                min="15"
                step="15"
                required
                style={inputStyle}
                value={formData.duracaoMinutos}
                onChange={(e) => setFormData({ ...formData, duracaoMinutos: e.target.value })}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setModalCriarAberto(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#0284c7', color: 'white', border: 'none', cursor: 'pointer' }}>
                  Confirmar Marcação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes / Registo Clínico */}
      {consultaSelecionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '520px' }}>
            <h2 style={{ marginTop: 0 }}>Detalhes da Consulta</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '-8px', marginBottom: '16px' }}>
              <strong>Paciente:</strong> {consultaSelecionada.paciente?.dadosPessoais?.nome} |{' '}
              <strong>Fisioterapeuta:</strong> {consultaSelecionada.fisioterapeuta?.dadosPessoais?.nome}
            </p>

            <form onSubmit={handleGuardarDetalhes}>
              <label>Estado</label>
              <select
                disabled={!permissoes.eStaff}
                style={inputStyle}
                value={editClinico.estado}
                onChange={(e) => setEditClinico({ ...editClinico, estado: e.target.value })}
              >
                <option value="agendada">Agendada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>

              <label>Diagnóstico</label>
              <textarea
                rows="2"
                disabled={!permissoes.eStaff}
                style={inputStyle}
                value={editClinico.diagnostico}
                onChange={(e) => setEditClinico({ ...editClinico, diagnostico: e.target.value })}
              />

              <label>Evolução Clínica</label>
              <textarea
                rows="2"
                disabled={!permissoes.eStaff}
                style={inputStyle}
                value={editClinico.evolucaoClinica}
                onChange={(e) => setEditClinico({ ...editClinico, evolucaoClinica: e.target.value })}
              />

              <label>Observações</label>
              <textarea
                rows="2"
                disabled={!permissoes.eStaff}
                style={inputStyle}
                value={editClinico.observacoes}
                onChange={(e) => setEditClinico({ ...editClinico, observacoes: e.target.value })}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setConsultaSelecionada(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                  Fechar
                </button>
                {permissoes.eStaff && (
                  <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#0284c7', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Guardar Alterações
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}