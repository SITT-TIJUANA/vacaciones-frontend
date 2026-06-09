import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import escudoSitt from '../assets/escudo-sitt.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Completa todos los campos'); return; }
    setCargando(true); setError('');
    try {
      await login(form.username, form.password);
      window.location.href = '/vacaciones-frontend/#/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };
  return (
    <div className="login-page">
      <div className="escudo-bg" />
      <div className="login-container">
        <div className="login-header">
          <img src={escudoSitt} alt="Escudo SITT" className="login-escudo" />
          <div>
            <h1 className="login-title">H. XXV Ayuntamiento de Tijuana</h1>
            <p className="login-subtitle">SITT — Control de Vacaciones</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-form-title">Iniciar Sesión</h2>
          <p className="login-form-sub">Ingresa tus credenciales institucionales</p>

          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="flex-column">
            <label>Usuario</label>
            <div className="inputForm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input className="input" type="text" placeholder="Usuario institucional"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                autoComplete="username" />
            </div>
          </div>

          <div className="flex-column">
            <label>Contraseña</label>
            <div className="inputForm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: 'var(--gris-texto)' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-institucional filled btn-lg"
            style={{ width: '100%', marginTop: '8px' }} disabled={cargando}>
            {cargando ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spin">⏳</span> Verificando...
              </span>
            ) : <>🔐 Entrar al Sistema</>}
          </button>
        </form>

        <p className="login-footer">
          Sistema Integral de Transporte de Tijuana<br />
          <span>Uso exclusivo del personal autorizado</span>
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--guinda-dark) 0%, var(--guinda) 50%, var(--guinda-light) 100%);
          padding: 20px;
          position: relative;
        }
        .login-page .escudo-bg::after { opacity: 0.06; filter: none; }
        .login-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 2;
        }
        .login-header {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #fff;
          text-align: left;
        }
        .login-escudo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
          border-radius: 50%;
        }
        .login-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: #fff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .login-subtitle {
          font-size: 13px;
          color: var(--dorado);
          font-weight: 600;
          font-family: 'Montserrat', sans-serif;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .login-form-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: var(--guinda);
          margin-bottom: 4px;
        }
        .login-form-sub {
          font-size: 13px;
          color: var(--gris-texto);
          margin-bottom: 8px;
        }
        .login-error {
          background: #FFF3CD;
          border: 1px solid #FFEEBA;
          border-left: 4px solid #856404;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          color: #856404;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .login-footer {
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          text-align: center;
          line-height: 1.6;
        }
        .login-footer span { color: var(--dorado); font-weight: 600; }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
