import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Tablero from '../components/Tablero';
import Solicitudes from '../components/Solicitudes';
import Reportes from '../components/Reportes';
import AltaPersonal from '../components/AltaPersonal';
import Usuarios from '../components/Usuarios';
import MiPerfil from '../components/MiPerfil';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TITULOS = {
  inicio:      '🏠 Personal SITT',
  solicitudes: '📋 Solicitudes de Vacaciones',
  reportes:    '📊 Reportes y Estadísticas',
  alta:        '➕ Alta de Personal',
  usuarios:    '🔐 Gestión de Usuarios',
  miperfil:    '👤 Mi Perfil',
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const [seccion, setSeccion] = useState(() => {
    // Si es empleado, va directo a su perfil
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    return u.rol === 'empleado' ? 'miperfil' : 'inicio';
  });
  const [collapsed, setCollapsed] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const cargarNotificaciones = () => {
    api.get('/api/notificaciones').then(r => setNotificaciones(r.data)).catch(() => {});
  };

  useEffect(() => {
    cargarNotificaciones();
    const timer = setInterval(cargarNotificaciones, 60000);
    // Keep-alive
    const ping = setInterval(() => {
      fetch('https://vacaciones-backend-7ota.onrender.com/ping').catch(() => {});
    }, 840000);
    return () => { clearInterval(timer); clearInterval(ping); };
  }, []);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const marcarLeidas = () => {
    api.put('/api/notificaciones/leer-todas').then(() => cargarNotificaciones()).catch(() => {});
  };

  const cambiarSeccion = (id) => {
    setSeccion(id);
    setShowNotif(false);
    if (window.innerWidth < 768) setCollapsed(true);
  };

  return (
    <div className="app-layout">
      <div className="escudo-bg" />
      <Sidebar
        seccion={seccion}
        setSeccion={cambiarSeccion}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        notifCount={['admin','rrhh'].includes(usuario?.rol) ? noLeidas : 0}
      />

      <main className={`main-content${collapsed ? ' full' : ''}`}>
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? '☰' : '✕'}
            </button>
            <span className="topbar-title">{TITULOS[seccion]}</span>
          </div>
          <div className="topbar-right">
            <div style={{ position: 'relative' }}>
              <button className="notif-btn"
                onClick={() => { setShowNotif(s => !s); if (!showNotif && noLeidas > 0) marcarLeidas(); }}>
                🔔
                {noLeidas > 0 && <span className="notif-dot">{noLeidas > 9 ? '9+' : noLeidas}</span>}
              </button>
              {showNotif && (
                <div className="notif-panel">
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gris-claro)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 14, color: 'var(--guinda)' }}>Notificaciones</span>
                    <button onClick={() => setShowNotif(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--gris-texto)' }}>✕</button>
                  </div>
                  {notificaciones.length === 0 ? (
                    <div style={{ padding: 28, textAlign: 'center', color: 'var(--gris-texto)', fontSize: 13 }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
                      Sin notificaciones
                    </div>
                  ) : notificaciones.slice(0, 10).map(n => (
                    <div key={n.id} className={`notif-item${!n.leida ? ' no-leida' : ''}`}>
                      <h4>{n.titulo}</h4>
                      <p>{n.mensaje}</p>
                      <time>{new Date(n.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {usuario?.foto_url
              ? <img src={usuario.foto_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--guinda)', cursor: 'pointer' }} onClick={() => cambiarSeccion('miperfil')} />
              : <div style={{ fontSize: 28, cursor: 'pointer' }} onClick={() => cambiarSeccion('miperfil')}>👤</div>
            }
          </div>
        </div>

        <div className="page-content">
          {seccion === 'inicio'     && <Tablero />}
          {seccion === 'solicitudes' && <Solicitudes onActualizarNotif={cargarNotificaciones} />}
          {seccion === 'reportes'   && <Reportes />}
          {seccion === 'alta'       && <AltaPersonal onCreado={() => cambiarSeccion('inicio')} />}
          {seccion === 'usuarios'   && <Usuarios />}
          {seccion === 'miperfil'   && <MiPerfil />}
        </div>
      </main>
    </div>
  );
}
