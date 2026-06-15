import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PerfilModal from './PerfilModal';

export default function MiPerfil({ onVerPeriodos }) {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalPass, setModalPass] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [verPerfil, setVerPerfil] = useState(false);

  useEffect(() => {
    if (usuario?.empleado_id) {
      api.get(`/api/solicitudes/periodos-detalle/${usuario.empleado_id}`)
        .then(r => setPerfil({
          empleado: r.data.empleado,
          periodos: r.data.periodos,
          solicitudes: r.data.periodos.flatMap(p => p.solicitudes||[]),
          total_disponible: r.data.total_disponible,
          total_tomado: r.data.total_tomado,
          total_correspondiente: r.data.total_correspondiente,
        }))
        .catch(console.error)
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, [usuario]);

  const anioActual = new Date().getFullYear();
  const totalDisponible = perfil?.total_disponible ?? 0;
  const totalTomado = perfil?.total_tomado ?? 0;
  const totalCorrespondiente = perfil?.total_correspondiente ?? 0;
  const pct = totalCorrespondiente > 0 ? Math.round((totalTomado / totalCorrespondiente) * 100) : 0;
  const periodoActual = { dias_disponibles: totalDisponible, dias_tomados: totalTomado, dias_correspondientes: totalCorrespondiente };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Mi Perfil</h2>
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
                <span>Vacaciones acumuladas</span>
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
              { label: 'Días disponibles', value: totalDisponible, icon: '✅', clase: 'verde' },
              { label: 'Días tomados', value: totalTomado, icon: '📅', clase: 'dorado' },
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

    </div>
  );
}
