import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginView from './views/LoginView';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota inicial da aplicação */}
        <Route path="/" element={<LoginView />} />
      </Routes>
    </Router>
  );
}

export default App;