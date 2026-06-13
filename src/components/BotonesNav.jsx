import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Botón Regresar al Menú ────────────────────────────────
export function BtnRegresar() {
  const navigate = useNavigate();
  return (
    <button className="BtnNav regresar" onClick={() => navigate('/menu')} title="Regresar al menú">
      <div className="sign">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
        </svg>
      </div>
      <span className="text">Menú</span>
      <style>{`
        .BtnNav {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 45px;
          height: 45px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
          flex-shrink: 0;
        }
        .BtnNav.regresar { background: linear-gradient(135deg, #6B0F2B, #9B1540); }
        .BtnNav.cerrar { background: linear-gradient(135deg, #c0392b, #ff4141); }
        .BtnNav .sign {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .BtnNav .sign svg { width: 18px; height: 18px; }
        .BtnNav .text {
          position: absolute;
          right: 0;
          width: 0;
          opacity: 0;
          color: white;
          font-size: 13px;
          font-weight: 700;
          font-family: Montserrat, sans-serif;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .BtnNav:hover {
          width: 130px;
          border-radius: 40px;
        }
        .BtnNav:hover .sign {
          width: 30%;
          padding-left: 18px;
        }
        .BtnNav:hover .text {
          opacity: 1;
          width: 70%;
          padding-right: 12px;
        }
        .BtnNav:active { transform: translate(2px, 2px); }
      `}</style>
    </button>
  );
}

// ── Botón Cerrar Sesión ───────────────────────────────────
export function BtnCerrarSesion() {
  const { logout } = useAuth();
  return (
    <button className="BtnNav cerrar" onClick={logout} title="Cerrar sesión">
      <div className="sign">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </div>
      <span className="text">Salir</span>
    </button>
  );
}
