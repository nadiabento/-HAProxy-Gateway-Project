import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import axios from 'axios';

export default function FuncionariosView() {
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditAberto, setModalEditAberto] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionarioAApagar, setFuncionarioAApagar] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '', email: '', password: '', tipo: 'Fisioterapeuta', contacto: '', data_nascimento: '', morada: '', especialidade: ''
  });

  const [editData, setEditData] = useState({
    id: null, nome: '', email: '', contacto: '', data_nascimento: '', morada: ''
  });

  const carregarFuncionarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/utilizadores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFuncionarios(response.data);
    } catch (error) {}
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email !== 'admin@prc.pt') {
          setAcessoNegado(true);
          return;
        }
      } catch (error) { setAcessoNegado(true); return; }
    } else { setAcessoNegado(true); return; }
    carregarFuncionarios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token'); 
      await axios.post('http://localhost:3000/api/utilizadores', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({ nome: '', email: '', password: '', tipo: 'Fisioterapeuta', contacto: '', data_nascimento: '', morada: '', especialidade: '' });
      setModalAberto(false);
      carregarFuncionarios(); 
    } catch (error) { alert('Erro ao criar funcionário.'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/utilizadores/${editData.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalEditAberto(false);
      carregarFuncionarios();
    } catch (error) { alert('Erro ao guardar.'); }
  };

  const handleDelete = async () => {
    const id = funcionarioAApagar?.id;
    setFuncionarioAApagar(null);
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/utilizadores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      carregarFuncionarios();
    } catch (error) { alert("Erro ao eliminar."); }
  };

  if (acessoNegado) return <div style={{ textAlign: 'center', marginTop: 'var(--space-10)', color: 'var(--color-danger)', fontWeight: 'var(--font-weight-semibold)' }}>Acesso Restrito ao Administrador.</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Funcionários</h2>
        <button className="btn btn-primary" onClick={() => setModalAberto(true)}><Plus size={20} /> Novo Funcionário</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Contacto</th>
              <th>Cargo</th>
              <th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.length === 0 && (
              <tr><td colSpan="5" className="empty">Nenhum funcionário registado.</td></tr>
            )}
            {funcionarios.map(func => (
              <tr key={func.id}>
                <td>{func.nome}</td>
                <td>{func.email}</td>
                <td>{func.contacto || '-'}</td>
                <td><span className="badge badge-primary">{func.tipo}</span></td>
                <td className="actions">
                  {func.tipo !== 'Administrador' && (
                    <>
                      <button className="btn-icon" title="Editar funcionário" onClick={() => { setEditData(func); setModalEditAberto(true); }}><Pencil size={18} /></button>
                      <button className="btn-icon danger" title="Eliminar funcionário" onClick={() => setFuncionarioAApagar(func)}><Trash2 size={18} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title modal-header">Registar Funcionário</h2>
            <form onSubmit={handleSubmit}>
              <div className="field"><label>Nome Completo</label><input className="input" type="text" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
              <div className="field"><label>E-mail</label><input className="input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="field"><label>Contacto</label><input className="input" type="text" value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} /></div>
              <div className="field"><label>Data de Nascimento</label><input className="input" type="date" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} /></div>
              <div className="field"><label>Morada</label><input className="input" type="text" value={formData.morada} onChange={e => setFormData({...formData, morada: e.target.value})} /></div>
              <div className="field"><label>Palavra-passe</label><input className="input" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>

              <div className="field">
                <label>Cargo</label>
                <select className="input" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                  <option value="Fisioterapeuta">Fisioterapeuta</option>
                  <option value="Rececionista">Rececionista</option>
                </select>
              </div>

              {formData.tipo === 'Fisioterapeuta' && (
                <div className="field">
                  <label>Especialidade</label>
                  <input className="input" type="text" placeholder="Ex: Osteopatia" value={formData.especialidade} onChange={e => setFormData({...formData, especialidade: e.target.value})} />
                </div>
              )}

              <div className="btn-row">
                <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar (os campos são os mesmos, sem palavra-passe nem cargo) */}
      {modalEditAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title modal-header">Editar Funcionário</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="field"><label>Nome</label><input className="input" type="text" required value={editData.nome} onChange={e => setEditData({...editData, nome: e.target.value})} /></div>
              <div className="field"><label>Contacto</label><input className="input" type="text" value={editData.contacto || ''} onChange={e => setEditData({...editData, contacto: e.target.value})} /></div>
              <div className="field"><label>Morada</label><input className="input" type="text" value={editData.morada || ''} onChange={e => setEditData({...editData, morada: e.target.value})} /></div>
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
        open={!!funcionarioAApagar}
        icon={Trash2}
        title="Eliminar Funcionário"
        message={`Tens a certeza que pretendes eliminar ${funcionarioAApagar?.nome || 'este funcionário'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setFuncionarioAApagar(null)}
      />
    </div>
  );
}