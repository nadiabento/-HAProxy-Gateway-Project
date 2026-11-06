import { useState, useEffect } from 'react';
import { Plus, X, User, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function PacientesView() {
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditAberto, setModalEditAberto] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [permissoes, setPermissoes] = useState({ podeAdicionarApagar: false });

  const [formData, setFormData] = useState({ nome: '', email: '', contacto: '', data_nascimento: '', morada: '' });
  const [editData, setEditData] = useState({ id: null, nome: '', email: '', contacto: '', data_nascimento: '', morada: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email === 'admin@prc.pt' || (payload.cargo && payload.cargo.toLowerCase() === 'rececionista')) {
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
      await axios.post('http://localhost:3000/api/pacientes', formData, { headers: { Authorization: `Bearer ${token}` }});
      setFormData({ nome: '', email: '', contacto: '', data_nascimento: '', morada: '' });
      setModalAberto(false);
      carregarPacientes(); 
    } catch (error) { alert('Erro ao criar paciente.'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/pacientes/${editData.id}`, editData, { headers: { Authorization: `Bearer ${token}` }});
      setModalEditAberto(false);
      carregarPacientes();
    } catch (error) { alert('Erro ao guardar.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminar paciente?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/pacientes/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      carregarPacientes();
    } catch (error) { alert("Erro ao eliminar."); }
  };

  const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2>Pacientes</h2>
        {permissoes.podeAdicionarApagar && (
          <button onClick={() => setModalAberto(true)} style={{ display: 'flex', gap: '8px', backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer' }}><Plus size={20} /> Novo Paciente</button>
        )}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px' }}>NOME</th>
              <th style={{ padding: '16px' }}>CONTACTO</th>
              <th style={{ padding: '16px' }}>NASCIMENTO</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map(paciente => (
              <tr key={paciente.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px' }}>{paciente.nome}</td>
                <td style={{ padding: '16px' }}>{paciente.contacto || '-'}</td>
                <td style={{ padding: '16px' }}>{paciente.data_nascimento || '-'}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button onClick={() => { setEditData(paciente); setModalEditAberto(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', marginRight: '16px' }}><Pencil size={18} /></button>
                  {permissoes.podeAdicionarApagar && (
                    <button onClick={() => handleDelete(paciente.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{marginTop: 0}}>Registar Paciente</h2>
            <form onSubmit={handleSubmit}>
              <label>Nome Completo</label><input type="text" required style={inputStyle} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              <label>E-mail</label><input type="email" style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <label>Contacto</label><input type="text" style={inputStyle} value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} />
              <label>Data de Nascimento</label><input type="date" style={inputStyle} value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} />
              <label>Morada</label><input type="text" style={inputStyle} value={formData.morada} onChange={e => setFormData({...formData, morada: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setModalAberto(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#0284c7', color: 'white', border: 'none' }}>Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Paciente */}
      {modalEditAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
            <h2>Editar Paciente</h2>
            <form onSubmit={handleEditSubmit}>
              <label>Nome</label><input type="text" required style={inputStyle} value={editData.nome} onChange={e => setEditData({...editData, nome: e.target.value})} />
              <label>Contacto</label><input type="text" style={inputStyle} value={editData.contacto || ''} onChange={e => setEditData({...editData, contacto: e.target.value})} />
              <label>Morada</label><input type="text" style={inputStyle} value={editData.morada || ''} onChange={e => setEditData({...editData, morada: e.target.value})} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setModalEditAberto(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#0284c7', color: 'white' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}