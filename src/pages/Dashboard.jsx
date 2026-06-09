import { useState, useEffect, useRef } from 'react';
import Tablero from '../components/Tablero';
import Solicitudes from '../components/Solicitudes';
import Reportes from '../components/Reportes';
import AltaPersonal from '../components/AltaPersonal';
import Usuarios from '../components/Usuarios';
import MiPerfil from '../components/MiPerfil';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NAV_ITEMS_ADMIN = [
  { id: 'inicio',      icon: '🏠', label: 'Inicio',     roles: ['admin','rrhh'] },
  { id: 'miperfil',    icon: '👤', label: 'Mi Perfil',  roles: ['admin','rrhh','empleado'] },
  { id: 'solicitudes', icon: '📋', label: 'Solicitudes',roles: ['admin','rrhh','empleado'] },
  { id: 'reportes',    icon: '📊', label: 'Reportes',   roles: ['admin','rrhh'] },
  { id: 'alta',        icon: '➕', label: 'Alta',        roles: ['admin','rrhh'] },
  { id: 'usuarios',    icon: '🔐', label: 'Usuarios',   roles: ['admin'] },
];

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const [seccion, setSeccion] = useState(() => {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    return u.rol === 'empleado' ? 'miperfil' : 'inicio';
  });
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const canvasRef = useRef(null);

  const navItems = NAV_ITEMS_ADMIN.filter(i => i.roles.includes(usuario?.rol));

  // Partículas de fondo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      speed: Math.random() * 0.6 + 0.2,
      swing: Math.random() * 2 - 1,
      swingSpeed: Math.random() * 0.02 + 0.005,
      t: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.3 + 0.05,
    }));

    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.t += p.swingSpeed;
        p.x += Math.sin(p.t) * p.swing;
        p.y += p.speed;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    api.get('/api/notificaciones').then(r => setNotificaciones(r.data)).catch(() => {});
    const t = setInterval(() => api.get('/api/notificaciones').then(r => setNotificaciones(r.data)).catch(() => {}), 60000);
    const ping = setInterval(() => fetch('https://vacaciones-backend-7ota.onrender.com/ping').catch(() => {}), 840000);
    return () => { clearInterval(t); clearInterval(ping); };
  }, []);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="dash-layout">
      {/* Canvas partículas */}
      <canvas ref={canvasRef} className="particles-canvas" />

      {/* Escudo fondo */}
      <div className="escudo-bg-dash" />

      {/* Header top */}
      <header className="dash-header">
        <div className="dash-header-left">
          <img src="/vacaciones-frontend/escudo-sitt.png" alt="SITT" className="dash-logo" />
          <div>
            <div className="dash-title">Control de <em>Vacaciones</em></div>
            <div className="dash-subtitle">SITT · Ayto. Tijuana</div>
          </div>
        </div>
        <div className="dash-header-right">
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => { setShowNotif(s => !s); if (noLeidas > 0) api.put('/api/notificaciones/leer-todas').then(() => api.get('/api/notificaciones').then(r => setNotificaciones(r.data))); }}>
              🔔
              {noLeidas > 0 && <span className="notif-dot">{noLeidas > 9 ? '9+' : noLeidas}</span>}
            </button>
            {showNotif && (
              <div className="notif-panel">
                <div className="notif-panel-header">
                  <span>Notificaciones</span>
                  <button onClick={() => setShowNotif(false)}>✕</button>
                </div>
                {notificaciones.length === 0
                  ? <div className="notif-empty">🔔 Sin notificaciones</div>
                  : notificaciones.slice(0,8).map(n => (
                    <div key={n.id} className={`notif-item${!n.leida ? ' unread' : ''}`}>
                      <div className="notif-title">{n.titulo}</div>
                      <div className="notif-msg">{n.mensaje}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          <div className="dash-user" onClick={() => setSeccion('miperfil')}>
            {usuario?.foto_url
              ? <img src={usuario.foto_url} alt="" className="dash-avatar" />
              : <div className="dash-avatar-placeholder">👤</div>
            }
            <div>
              <div className="dash-user-name">{usuario?.nombre || usuario?.username}</div>
              <div className="dash-user-rol">{usuario?.rol}</div>
            </div>
          </div>
          <button className="icon-btn logout-btn" onClick={logout} title="Cerrar sesión">🚪</button>
        </div>
      </header>

      {/* Contenido */}
      <main className="dash-main">
        <div className="dash-content fade-in" key={seccion}>
          {seccion === 'inicio'      && <Tablero />}
          {seccion === 'miperfil'    && <MiPerfil />}
          {seccion === 'solicitudes' && <Solicitudes onActualizarNotif={() => api.get('/api/notificaciones').then(r => setNotificaciones(r.data))} />}
          {seccion === 'reportes'    && <Reportes />}
          {seccion === 'alta'        && <AltaPersonal onCreado={() => setSeccion('inicio')} />}
          {seccion === 'usuarios'    && <Usuarios />}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item${seccion === item.id ? ' active' : ''}`}
            onClick={() => setSeccion(item.id)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
            {item.id === 'solicitudes' && noLeidas > 0 && (
              <span className="bottom-nav-badge">{noLeidas}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
