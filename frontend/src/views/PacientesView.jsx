import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import axios from 'axios';

export default function PacientesView() {
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditAberto, setModalEditAberto] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [pacienteAApagar, setPacienteAApagar] = useState(null);
  const [permissoes, setPermissoes] = useState({ podeAdicionarApagar: false });

  const [formData, setFormData] = useState({ nome: '', email: '', contacto: '', data_nascimento: '', morada: '' });
  const [editData, setEditData] = useState({ id: null, nome: '', email: '', contacto: '', data_nascimento: '', morada: '' });

 useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const perfis = (payload.perfis || []).map((p) => p.toLowerCase());
        const cargo = payload.cargo ? payload.cargo.toLowerCase() : '';

        if (
          payload.email === 'admin@prc.pt' ||
          perfis.includes('administrador') ||
          perfis.includes('rececionista') ||
          cargo === 'rececionista'
        ) {
          setPermissoes({ podeAdicionarApagar: true });
        }
      } catch (error) {}
    }
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/pacientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPacientes(response.data);
    } catch (error) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/pacientes', {
        ...formData,
        dataNascimento: formData.data_nascimento
      }, { headers: { Authorization: `Bearer ${token}` }});
      setFormData({ nome: '', email: '', contacto: '', data_nascimento: '', morada: '' });
      setModalAberto(false);
      carregarPacientes();
    } catch (error) { alert('Erro ao criar paciente.'); }
  };

  const abrirModalEdicao = (paciente) => {
    const dataBruta = paciente.data_nascimento || paciente.dataNascimento || '';
    const dataFormatada = dataBruta ? String(dataBruta).split('T')[0] : '';
    setEditData({
      id: paciente.id,
      nome: paciente.nome || '',
      email: paciente.email || '',
      contacto: paciente.contacto || '',
      data_nascimento: dataFormatada,
      morada: paciente.morada || ''
    });
    setModalEditAberto(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/pacientes/${editData.id}`, {
        ...editData,
        dataNascimento: editData.data_nascimento
      }, { headers: { Authorization: `Bearer ${token}` }});
      setModalEditAberto(false);
      carregarPacientes();
    } catch (error) { alert('Erro ao guardar.'); }
  };

  const handleDelete = async () => {
    const id = pacienteAApagar?.id;
    setPacienteAApagar(null);
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/pacientes/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      carregarPacientes();
    } catch (error) { alert("Erro ao eliminar."); }
  };

  // Campos do formulário (partilhados pelos modais Registar e Editar)
  const camposPaciente = (dados, setDados) => (
    <>
      <div className="field"><label>Nome Completo</label><input className="input" type="text" required value={dados.nome} onChange={e => setDados({...dados, nome: e.target.value})} /></div>
      <div className="field"><label>E-mail</label><input className="input" type="email" required value={dados.email} onChange={e => setDados({...dados, email: e.target.value})} /></div>
      <div className="field"><label>Contacto</label><input className="input" type="text" value={dados.contacto} onChange={e => setDados({...dados, contacto: e.target.value})} /></div>
      <div className="field"><label>Data de Nascimento</label><input className="input" type="date" value={dados.data_nascimento} onChange={e => setDados({...dados, data_nascimento: e.target.value})} /></div>
      <div className="field"><label>Morada</label><input className="input" type="text" value={dados.morada} onChange={e => setDados({...dados, morada: e.target.value})} /></div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Pacientes</h2>
        {permissoes.podeAdicionarApagar && (
          <button className="btn btn-primary" onClick={() => setModalAberto(true)}><Plus size={20} /> Novo Paciente</button>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Contacto</th>
              <th>Nascimento</th>
              <th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.length === 0 && (
              <tr><td colSpan="4" className="empty">Nenhum paciente registado.</td></tr>
            )}
            {pacientes.map(paciente => {
              const dataNasc = paciente.data_nascimento || paciente.dataNascimento;
              const dataExibicao = dataNasc ? String(dataNasc).split('T')[0] : '-';
              return (
                <tr key={paciente.id}>
                  <td>{paciente.nome}</td>
                  <td>{paciente.contacto || '-'}</td>
                  <td>{dataExibicao}</td>
                  <td className="actions">
                    <button className="btn-icon" title="Editar paciente" onClick={() => abrirModalEdicao(paciente)}><Pencil size={18} /></button>
                    {permissoes.podeAdicionarApagar && (
                      <button className="btn-icon danger" title="Eliminar paciente" onClick={() => setPacienteAApagar(paciente)}><Trash2 size={18} /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Registar Paciente */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title modal-header">Registar Paciente</h2>
            <form onSubmit={handleSubmit}>
              {camposPaciente(formData, setFormData)}
              <div className="btn-row">
                <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Paciente */}
      {modalEditAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title modal-header">Editar Paciente</h2>
            <form onSubmit={handleEditSubmit}>
              {camposPaciente(editData, setEditData)}
              <div className="btn-row">
                <button type="button" className="btn btn-secondary" onClick={() => setModalEditAberto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de eliminação */}
      <ConfirmModal
        open={!!pacienteAApagar}
        icon={Trash2}
        title="Eliminar Paciente"
        message={`Tens a certeza que pretendes eliminar ${pacienteAApagar?.nome || 'este paciente'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setPacienteAApagar(null)}
      />
    </div>
  );
}