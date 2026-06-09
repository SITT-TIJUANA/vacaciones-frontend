import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PerfilModal({ empleadoId, onClose, onActualizar }) {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [fotoExpandida, setFotoExpandida] = useState(false);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    api.get(`/api/empleados/${empleadoId}`)
      .then(r => setDatos(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [empleadoId]);

  if (cargando) return (
    <div className="modal-overlay">
      <div className="modal" style={{ padding: 60 }}>
        <div className="loader-wrapper"><div className="loader" /></div>
      </div>
    </div>
  );

  if (!datos) return null;

  const { empleado, periodos, solicitudes } = datos;
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno || ''}`.trim();
  const anioActual = new Date().getFullYear();
  const periodoActual = periodos.find(p => p.anio === anioActual) || {};

  const pct = periodoActual.dias_correspondientes
    ? Math.round((periodoActual.dias_tomados / periodoActual.dias_correspondientes) * 100)
    : 0;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          {/* Header con foto y datos */}
          <div className="perfil-header">
            {empleado.foto_url ? (
              <img
                src={empleado.foto_url}
                alt={nombre}
                className="perfil-foto"
                onClick={() => setFotoExpandida(true)}
                title="Click para ver foto completa"
              />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '4px solid var(--dorado)', flexShrink: 0 }}>
                👤
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div className="perfil-nombre">{nombre}</div>
              <div className="perfil-puesto">{empleado.puesto || 'Sin puesto asignado'}</div>
              {empleado.departamento && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🏢 {empleado.departamento}
                </div>
              )}
              {empleado.numero_empleado && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                  # {empleado.numero_empleado}
                </div>
              )}
            </div>

            <div className="dias-ring">
              <div className="numero">{periodoActual.dias_disponibles ?? '—'}</div>
              <div className="etiqueta">días disponibles</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{anioActual}</div>
            </div>

            <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>✕</button>
          </div>

          {/* Barra de progreso de vacaciones */}
          <div style={{ padding: '16px 24px 0', background: 'var(--blanco)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--guinda)' }}>
              <span>Vacaciones {anioActual}</span>
              <span>{periodoActual.dias_tomados || 0} / {periodoActual.dias_correspondientes || 0} días usados ({pct}%)</span>
            </div>
            <div style={{ height: 8, background: 'var(--gris-claro)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#e74c3c' : pct > 50 ? 'var(--dorado)' : 'var(--guinda)', borderRadius: 4, transition: 'width 0.8s ease' }} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--gris-claro)', padding: '0 24px', background: 'var(--blanco)' }}>
            {[
              { id: 'info',       label: '📋 Información' },
              { id: 'periodos',   label: '📅 Periodos' },
              { id: 'solicitudes',label: '📝 Solicitudes' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t.id ? '3px solid var(--guinda)' : '3px solid transparent',
                  color: tab === t.id ? 'var(--guinda)' : 'var(--gris-texto)',
                  fontFamily: 'Montserrat',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  marginBottom: -2,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          <div className="modal-body">
            {tab === 'info' && (
              <div className="form-grid" style={{ gap: 20 }}>
                {[
                  { label: 'Correo electrónico', value: empleado.email, icon: '✉️' },
                  { label: 'Teléfono', value: empleado.telefono, icon: '📱' },
                  { label: 'Fecha de ingreso', value: empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : null, icon: '📆' },
                  { label: 'Antigüedad', value: empleado.fecha_ingreso ? calcularAntiguedad(empleado.fecha_ingreso) : null, icon: '⏱️' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: 'var(--blanco-off)', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid var(--guinda)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', marginBottom: 4 }}>{icon} {label}</div>
                    <div style={{ fontWeight: 600, color: 'var(--texto-oscuro)' }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'periodos' && (
              <div>
                {periodos.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: 40, color: 'var(--gris-texto)' }}>Sin periodos registrados</p>
                ) : (
                  <div className="tabla-wrapper">
                    <table>
                      <thead><tr>
                        <th>Año</th><th>Correspondientes</th><th>Tomados</th><th>Disponibles</th><th>Notas</th>
                      </tr></thead>
                      <tbody>
                        {periodos.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.anio}</strong></td>
                            <td>{p.dias_correspondientes}</td>
                            <td>{p.dias_tomados}</td>
                            <td>
                              <span style={{ fontFamily: 'Montserrat', fontWeight: 800, color: p.dias_disponibles <= 2 ? '#e74c3c' : 'var(--guinda)' }}>
                                {p.dias_disponibles}
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--gris-texto)' }}>{p.observaciones || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'solicitudes' && (
              <div>
                {solicitudes.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: 40, color: 'var(--gris-texto)' }}>Sin solicitudes registradas</p>
                ) : (
                  <div className="tabla-wrapper">
                    <table>
                      <thead><tr>
                        <th>Periodo</th><th>Días</th><th>Estatus</th><th>Resuelto por</th>
                      </tr></thead>
                      <tbody>
                        {solicitudes.map(s => (
                          <tr key={s.id}>
                            <td>{fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}</td>
                            <td>{s.dias_solicitados}</td>
                            <td><span className={`badge badge-${s.estatus}`}>{s.estatus}</span></td>
                            <td style={{ fontSize: 12 }}>{s.aprobado_por_username || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          {['admin', 'rrhh'].includes(usuario?.rol) && (
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={onClose}>Cerrar</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal foto completa */}
      {fotoExpandida && empleado.foto_url && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setFotoExpandida(false)}>
          <div style={{ position: 'relative', maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
            <img src={empleado.foto_url} alt={nombre} className="foto-modal-img" />
            <div style={{ textAlign: 'center', marginTop: 12, color: '#fff', fontFamily: 'Montserrat', fontWeight: 700 }}>
              {nombre}
            </div>
            <button
              onClick={() => setFotoExpandida(false)}
              style={{ position: 'absolute', top: -12, right: -12, background: 'var(--guinda)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}
            >✕</button>
          </div>
        </div>
      )}
    </>
  );
}

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcularAntiguedad(fechaIngreso) {
  const hoy = new Date();
  const ingreso = new Date(fechaIngreso);
  let anios = hoy.getFullYear() - ingreso.getFullYear();
  let meses = hoy.getMonth() - ingreso.getMonth();
  if (meses < 0) { anios--; meses += 12; }
  const partes = [];
  if (anios > 0) partes.push(`${anios} año${anios !== 1 ? 's' : ''}`);
  if (meses > 0) partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`);
  return partes.length ? partes.join(' y ') : 'Menos de 1 mes';
}
