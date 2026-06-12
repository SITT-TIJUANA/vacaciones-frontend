import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './assets/styles/global.css';
import './assets/styles/mobile.css';
import MexicoMode from './components/MexicoMode';

// Aplicar tema México inmediatamente si está guardado — antes de cualquier render
if (localStorage.getItem('mx-tema') === '1') {
  const existing = document.getElementById('mx-style');
  if (!existing) {
    const el = document.createElement('style');
    el.id = 'mx-style';
    el.textContent = `.dash-header{background:rgba(0,61,42,0.97)!important;border-bottom:1px solid rgba(206,17,38,0.4)!important;box-shadow:0 4px 30px rgba(0,40,25,0.5)!important;}.bottom-nav{background:rgba(0,40,25,0.97)!important;border-top:1px solid rgba(206,17,38,0.4)!important;box-shadow:0 -8px 40px rgba(0,40,25,0.5)!important;}:root{--g:#006847!important;--d:#CE1126!important;}`;
    document.head.appendChild(el);
  }
}

function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--guinda)' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Cargando sistema...</div>
      </div>
    </div>
  );
  return usuario ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return !usuario ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <MexicoMode />
          <Routes>
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
