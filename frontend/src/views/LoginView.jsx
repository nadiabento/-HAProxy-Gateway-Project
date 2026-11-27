import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <-- 1. Importar o hook de navegação
import logo from '../assets/logo-prc.jpg';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // <-- 2. Inicializar o navigate

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Faz o pedido ao backend
      const response = await axios.post('/api/auth/login', {
        email: email,
        password: password
      });

      // 3. Guarda o token de segurança no navegador
      localStorage.setItem('token', response.data.token);
      
      // 4. Redireciona para o dashboard!
      navigate('/dashboard');

    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      alert(error.response?.data?.message || 'Erro ao tentar iniciar sessão. Verifica as credenciais.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-app)',
      padding: 'var(--space-4)',
      boxSizing: 'border-box',
    }}>

      <div className="modal" style={{ maxWidth: '420px', maxHeight: 'none', padding: 'var(--space-10)', textAlign: 'center' }}>

        <img
          src={logo}
          alt="Logótipo PRC"
          style={{ width: '260px', maxWidth: '100%', marginBottom: 'var(--space-5)', borderRadius: 'var(--radius-sm)' }}
        />

        <h2 className="modal-title" style={{ fontSize: 'var(--font-size-xl)' }}>Bem-vindo</h2>
        <p className="modal-text" style={{ marginBottom: 'var(--space-8)' }}>Inicie sessão para aceder ao sistema</p>

        <form onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              className="input"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@clinica.pt"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Palavra-passe</label>
            <input
              className="input"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 'var(--space-2)' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}