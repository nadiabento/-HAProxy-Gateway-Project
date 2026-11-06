export default function DashboardView() {
  return (
    <div>
      <p style={{ color: '#7f8c8d' }}>Bem-vindo ao painel de controlo do Portal de Reabilitação Clínica.</p>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1 }}>
          <h3>Total de Pacientes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>0</p>
        </div>
        <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1 }}>
          <h3>Consultas Hoje</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>0</p>
        </div>
      </div>
    </div>
  );
}