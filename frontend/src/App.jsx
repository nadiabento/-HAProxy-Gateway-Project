import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import Sidebar from './components/Sidebar';
import FuncionariosView from './views/FuncionariosView';
import PacientesView from './views/PacientesView';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Ecrã público */}
        <Route path="/" element={<LoginView />} />

        {/* Ecrãs privados encapsulados no Layout (Sidebar) */}
       <Route element={<Sidebar />}>
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/pacientes" element={<PacientesView />} />
          <Route path="/funcionarios" element={<FuncionariosView />} /> 
          <Route path="/perfil" element={<div>Página de Perfil (em breve)</div>} />
          
        </Route>
      </Routes>
    </Router>
  );
}