import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  });
  const [cargando, setCargando] = useState(true);
  const [modoEmpleado, setModoEmpleado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/api/auth/me')
        .then(r => setUsuario(r.data))
        .catch(() => { localStorage.clear(); setUsuario(null); })
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    setModoEmpleado(false);
    return data.usuario;
  };

  const logout = () => {
    localStorage.clear();
    setUsuario(null);
    setModoEmpleado(false);
    window.location.href = '/vacaciones-frontend/';
  };

  const refrescarUsuario = async () => {
    const { data } = await api.get('/api/auth/me');
    localStorage.setItem('usuario', JSON.stringify(data));
    setUsuario(data);
    return data;
  };

  const rolEfectivo = modoEmpleado ? 'empleado' : usuario?.rol;

  return (
    <AuthContext.Provider value={{
      usuario, rolEfectivo, modoEmpleado, setModoEmpleado,
      login, logout, refrescarUsuario, cargando,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
