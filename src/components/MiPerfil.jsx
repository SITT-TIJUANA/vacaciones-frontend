import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PerfilModal from './PerfilModal';

export default function MiPerfil({ onVerPeriodos }) {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalPass, setModalPass] = useState(false);
  const [formPass, setFormPass] = useState({ password_actual: '', password_nuevo: '', confirmar: '' });
  const [msgPass, setMsgPass] = useState('');
  const [errPass, setErrPass] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verPerfil, setVerPerfil] = useState(false);

  useEffect(() => {
    if (usuario?.empleado_id) {
      api.get(`/api/empleados/${usuario.empleado_id}`)
        .then(r => setPerfil(r.data))
        .catch(console.error)
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, [usuario]);

  const cambiarPassword = async () => {
    if (!formPass.password_actual || !formPass.password_nuevo) { setErrPass('Completa todos los campos'); return; }
    if (formPass.password_nuevo !== formPass.confirmar) { setErrPass('Las contraseñas no coinciden'); return; }
    if (formPass.password_nuevo.length < 6) { setErrPass('Mínimo 6 caracteres'); return; }
    setEnviando(true); setErrPass(''); setMsgPass('');
    try {
      await api.post('/api/auth/cambiar-password', { password_actual: formPass.password_actual, password_nuevo: formPass.password_nuevo });
      setMsgPass('✅ Contraseña actualizada correctamente');
      setFormPass({ password_actual: '', password_nuevo: '', confirmar: '' });
      setTimeout(() => { setModalPass(false); setMsgPass(''); }, 2000);
    } catch (e) {
      setErrPass(e.response?.data?.error || 'Error al cambiar contraseña');
    } finally { setEnviando(false); }
  };

  if (cargando) return <div className="loader-wrapper"><div className="loader" /></div>;

  const anioActual = new Date().getFullYear();
  const periodoActual = perfil?.periodos?.find(p => p.anio === anioActual) || {};
  const pct = periodoActual.dias_correspondientes
    ? Math.round((periodoActual.dias_tomados / periodoActual.dias_correspondientes) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Mi Perfil</h2>
        <button className="btn-institucional" onClick={() => setModalPass(true)}>🔑 Cambiar Contraseña</button>
      </div>

      {!usuario?.empleado_id ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: 'var(--guinda)', fontSize: 20, marginBottom: 8 }}>
            {usuario?.username}
          </h3>
          <p style={{ color: 'var(--gris-texto)', marginBottom: 24 }}>
            Tu usuario no está vinculado a un empleado. Contacta al administrador.
          </p>
          <span style={{ background: 'var(--guinda-soft)', color: 'var(--guinda)', padding: '6px 16px', borderRadius: 20, fontFamily: 'Montserrat', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>
            Rol: {usuario?.rol}
          </span>
        </div>
      ) : perfil ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card principal */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--guinda-dark), var(--guinda))', padding: '32px 28px', display: 'flex', alignItems: 'center', gap: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              {perfil.empleado.foto_url ? (
                <img src={perfil.empleado.foto_url} alt="" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--dorado)', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} />
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, border: '4px solid var(--dorado)', flexShrink: 0 }}>👤</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 22 }}>
                  {perfil.empleado.nombre} {perfil.empleado.apellido_paterno} {perfil.empleado.apellido_materno || ''}
                </div>
                <div style={{ opacity: 0.85, marginTop: 4 }}>{perfil.empleado.puesto || 'Sin puesto'}</div>
                <div style={{ opacity: 0.7, fontSize: 13, marginTop: 4 }}>🏢 {perfil.empleado.departamento || '—'}</div>
              </div>
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                <div style={{ fontFamily: 'Montserrat', fontSize: 52, fontWeight: 900, color: 'var(--dorado)', lineHeight: 1 }}>{periodoActual.dias_disponibles ?? '—'}</div>
                <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Montserrat', fontWeight: 700 }}>días disponibles</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{anioActual}</div>
              </div>
            </div>

            <div style={{ padding: '16px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--guinda)' }}>
                <span>Vacaciones {anioActual}</span>
                <span>{periodoActual.dias_tomados || 0} / {periodoActual.dias_correspondientes || 0} días usados ({pct}%)</span>
              </div>
              <div className="progress-bar">
                <div className={`progress-fill ${pct > 80 ? 'danger' : pct > 50 ? 'warning' : ''}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid-4">
            {[
              { label: 'Días disponibles', value: periodoActual.dias_disponibles ?? 0, icon: '✅', clase: 'verde' },
              { label: 'Días tomados', value: periodoActual.dias_tomados ?? 0, icon: '📅', clase: 'dorado' },
              { label: 'Días totales', value: periodoActual.dias_correspondientes ?? 0, icon: '📆', clase: '' },
              { label: 'Solicitudes', value: perfil.solicitudes?.length ?? 0, icon: '📋', clase: '' },
            ].map(({ label, value, icon, clase }) => (
              <div key={label} className={`card kpi-card ${clase}`} data-icon={icon}>
                <div style={{ fontSize: 24 }}>{icon}</div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Botón ver perfil completo */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-institucional filled btn-lg" onClick={() => setVerPerfil(true)}>
              👁️ Ver Perfil Completo
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal cambiar contraseña */}
      {modalPass && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 Cambiar Contraseña</h2>
              <button className="modal-close" onClick={() => { setModalPass(false); setErrPass(''); setMsgPass(''); }}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {errPass && <div style={{ background: '#FFF3CD', border: '1px solid #FFEEBA', borderLeft: '4px solid #856404', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#856404', fontWeight: 600 }}>⚠️ {errPass}</div>}
              {msgPass && <div style={{ background: '#D4EDDA', border: '1px solid #C3E6CB', borderLeft: '4px solid #155724', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#155724', fontWeight: 600 }}>{msgPass}</div>}
              <div className="form-group">
                <label>Contraseña actual</label>
                <input type="password" className="form-control" placeholder="••••••••" value={formPass.password_actual} onChange={e => setFormPass({ ...formPass, password_actual: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input type="password" className="form-control" placeholder="Mínimo 6 caracteres" value={formPass.password_nuevo} onChange={e => setFormPass({ ...formPass, password_nuevo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Confirmar nueva contraseña</label>
                <input type="password" className="form-control" placeholder="Repite la contraseña" value={formPass.confirmar} onChange={e => setFormPass({ ...formPass, confirmar: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => { setModalPass(false); setErrPass(''); setMsgPass(''); }}>Cancelar</button>
              <button className="btn-institucional filled btn-sm" onClick={cambiarPassword} disabled={enviando}>
                {enviando ? '⏳...' : '🔑 Cambiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {verPerfil && usuario?.empleado_id && (
        <PerfilModal empleadoId={usuario.empleado_id} onClose={() => setVerPerfil(false)} onActualizar={() => {}} onVerPeriodos={onVerPeriodos} />
      )}
    </div>
  );
}
