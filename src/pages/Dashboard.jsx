import { useState, useEffect, useRef } from 'react';
import Tablero from '../components/Tablero';
import Solicitudes from '../components/Solicitudes';
import Reportes from '../components/Reportes';
import AltaPersonal from '../components/AltaPersonal';
import Usuarios from '../components/Usuarios';
import MiPerfil from '../components/MiPerfil';
import VincularCuenta from '../components/VincularCuenta';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NAV_ADMIN = [
  { id:'inicio',      icon:'🏠', label:'Inicio',     roles:['admin','rrhh'] },
  { id:'miperfil',    icon:'👤', label:'Mi Perfil',  roles:['admin','rrhh','empleado'] },
  { id:'solicitudes', icon:'📋', label:'Solicitudes',roles:['admin','rrhh','empleado'] },
  { id:'reportes',    icon:'📊', label:'Reportes',   roles:['admin','rrhh'] },
  { id:'alta',        icon:'➕', label:'Alta',        roles:['admin','rrhh'] },
  { id:'usuarios',    icon:'🔐', label:'Usuarios',   roles:['admin'] },
];

export default function Dashboard() {
  const { usuario, rolEfectivo, modoEmpleado, setModoEmpleado, logout, refrescarUsuario } = useAuth();
  const [seccion, setSeccion] = useState(() => {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    return u.rol === 'empleado' ? 'miperfil' : 'inicio';
  });
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showVincular, setShowVincular] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef(null);

  const navItems = NAV_ADMIN.filter(i => i.roles.includes(rolEfectivo));

  // Cuando cambia el modo, ajustar sección
  useEffect(() => {
    if (modoEmpleado) setSeccion('miperfil');
    else if (rolEfectivo !== 'empleado') setSeccion('inicio');
  }, [modoEmpleado]);

  // Partículas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.8, speed: Math.random() * 0.6 + 0.2,
      swing: Math.random() * 1.8 - 0.9, swingSpeed: Math.random() * 0.02 + 0.004,
      t: Math.random() * Math.PI * 2, opacity: Math.random() * 0.28 + 0.05,
    }));
    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.t += p.swingSpeed; p.x += Math.sin(p.t) * p.swing; p.y += p.speed;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.opacity})`; ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    };
    animate();
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
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
  const esAdminRRHH = ['admin','rrhh'].includes(usuario?.rol);
  const vinculado = !!usuario?.empleado_id;

  return (
    <div className="dash-layout">
      <canvas ref={canvasRef} className="particles-canvas" />
      <div className="escudo-bg-dash" />

      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          <img src="/vacaciones-frontend/escudo-sitt.png" alt="SITT" className="dash-logo" />
          <div>
            <div className="dash-title">Control de <em>Vacaciones</em></div>
            <div className="dash-subtitle">SITT · Ayto. Tijuana</div>
          </div>
        </div>

        <div className="dash-header-right">

          {/* Botón Vincular Cuenta — solo para admin y rrhh */}
          {esAdminRRHH && (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {/* Botón info */}
              <button className="icon-btn" style={{ width:32, height:32, fontSize:15 }}
                onClick={() => setShowInfo(true)} title="¿Qué es vincular cuenta?">
                ℹ️
              </button>

              {vinculado ? (
                /* Ya está vinculado */
                <button
                  className="vincular-btn vinculado"
                  onClick={() => setModoEmpleado(m => !m)}
                  title={modoEmpleado ? 'Regresar a modo administrador' : 'Ver como empleado'}
                >
                  {modoEmpleado ? (
                    <><span>👑</span> Modo {usuario.rol === 'admin' ? 'Admin' : 'RRHH'}</>
                  ) : (
                    <><span>✅</span> Vinculado · Ver como Empleado</>
                  )}
                </button>
              ) : (
                /* No vinculado */
                <button
                  className="vincular-btn"
                  onClick={() => setShowVincular(true)}
                  title="Vincular tu cuenta con un perfil de empleado"
                >
                  <span>🔗</span> Vincular Cuenta
                </button>
              )}
            </div>
          )}

          {/* Notificaciones */}
          <div style={{ position:'relative' }}>
            <button className="icon-btn" onClick={() => { setShowNotif(s => !s); if (noLeidas > 0) api.put('/api/notificaciones/leer-todas').then(() => api.get('/api/notificaciones').then(r => setNotificaciones(r.data))); }}>
              🔔{noLeidas > 0 && <span className="notif-dot">{noLeidas > 9 ? '9+' : noLeidas}</span>}
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
                    <div key={n.id} className={`notif-item${!n.leida?' unread':''}`}>
                      <div className="notif-title">{n.titulo}</div>
                      <div className="notif-msg">{n.mensaje}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="dash-user" onClick={() => setSeccion('miperfil')}>
            {usuario?.foto_url
              ? <img src={usuario.foto_url} alt="" className="dash-avatar" />
              : <div className="dash-avatar-placeholder">👤</div>
            }
            <div>
              <div className="dash-user-name">{usuario?.nombre || usuario?.username}</div>
              <div className="dash-user-rol">
                {modoEmpleado ? '👤 Modo Empleado' : usuario?.rol}
              </div>
            </div>
          </div>

          <button className="icon-btn logout-btn" onClick={logout} title="Cerrar sesión">🚪</button>
        </div>
      </header>

      {/* Contenido */}
      <main className="dash-main">
        <div className="dash-content fade-in" key={seccion + modoEmpleado}>
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
          <button key={item.id}
            className={`bottom-nav-item${seccion === item.id ? ' active' : ''}`}
            onClick={() => setSeccion(item.id)}>
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
            {item.id === 'solicitudes' && noLeidas > 0 && (
              <span className="bottom-nav-badge">{noLeidas}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Modal Vincular Cuenta */}
      {showVincular && (
        <VincularCuenta
          onClose={() => setShowVincular(false)}
          onVinculado={async () => {
            await refrescarUsuario();
            setShowVincular(false);
          }}
        />
      )}

      {/* Modal Info */}
      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal" style={{ maxWidth:460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ℹ️ ¿Para qué sirve Vincular Cuenta?</h2>
              <button className="modal-close" onClick={() => setShowInfo(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { icon:'🔗', titulo:'Una sola cuenta, dos roles', desc:'Puedes ser administrador Y empleado con el mismo usuario. No necesitas dos cuentas separadas.' },
                { icon:'👤', titulo:'Ver tus propias vacaciones', desc:'Al vincular, puedes cambiar a "Modo Empleado" y ver tus días disponibles, historial y solicitar vacaciones.' },
                { icon:'🔄', titulo:'Cambio instantáneo', desc:'Con un clic cambias entre vista de administrador y vista de empleado, sin cerrar sesión.' },
                { icon:'✅', titulo:'Cómo funciona', desc:'Das de alta tu perfil de empleado (nombre, fecha ingreso, foto, etc.) y queda vinculado automáticamente a tu usuario de admin.' },
              ].map(({ icon, titulo, desc }) => (
                <div key={titulo} style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'12px 14px', background:'var(--g-soft)', borderRadius:12 }}>
                  <span style={{ fontSize:28, flexShrink:0 }}>{icon}</span>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--g)', marginBottom:4 }}>{titulo}</div>
                    <div style={{ fontSize:13, color:'var(--g60)', lineHeight:1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-institucional filled btn-sm" onClick={() => { setShowInfo(false); setShowVincular(true); }}>
                🔗 Vincular ahora
              </button>
              <button className="btn-institucional btn-sm" onClick={() => setShowInfo(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
