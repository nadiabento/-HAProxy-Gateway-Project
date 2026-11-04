import { useState } from 'react';
import logo from '../assets/logo-prc.jpg'; 

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); 
    console.log('Tentativa de login com:', email, password);
    alert(`Login simulado para o e-mail: ${email}`);
  };

  return (
    // Fundo da página a ocupar todo o ecrã
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5', 
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' 
    }}>
      
      {/* Cartão branco com sombra para o formulário */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)', 
        width: '100%', 
        maxWidth: '400px', 
        textAlign: 'center' 
      }}>
        
        <img 
          src={logo} 
          alt="Logótipo PRC" 
          style={{ 
            width: '280px', 
            marginBottom: '20px', 
            borderRadius: '8px'
          }} 
        />
        
        <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Bem-vindo</h2>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>Inicie sessão para aceder ao sistema</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Etiquetas alinhadas à esquerda */}
          <div style={{ textAlign: 'left' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444', fontSize: '14px' }}>E-mail</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@clinica.pt"
              required
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
            />
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444', fontSize: '14px' }}>Palavra-passe</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
            />
          </div>
          
          <button 
            type="submit" 
            style={{ marginTop: '10px', padding: '14px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            Entrar
          </button>

        </form>
      </div>
    </div>
  );
}