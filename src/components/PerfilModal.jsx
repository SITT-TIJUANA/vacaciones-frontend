import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PerfilModal({ empleadoId, onClose, onActualizar }) {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [fotoExpandida, setFotoExpandida] = useState(false);
  const [tab, setTab] = useState('info');
  const [editandoPeriodo, setEditandoPeriodo] = useState(null);
  const [formPeriodo, setFormPeriodo] = useState({});

  useEffect(() => {
    api.get(`/api/empleados/${empleadoId}`)
      .then(r => setDatos(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [empleadoId]);

  const guardarPeriodo = async () => {
    try {
      await api.post('/api/periodos', {
        empleado_id: empleadoId,
        anio: formPeriodo.anio,
        dias_correspondientes: parseInt(formPeriodo.dias_correspondientes),
        observaciones: formPeriodo.observaciones,
      });
      const r = await api.get(`/api/empleados/${empleadoId}`);
      setDatos(r.data);
      setEditandoPeriodo(null);
      onActualizar?.();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al guardar');
    }
  };

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

  // Calcular periodos semestrales
  const calcularPeriodoSemestral = () => {
    if (!empleado.fecha_ingreso) return null;
    const hoy = new Date();
    const ingreso = new Date(empleado.fecha_ingreso);
    const mesesTrabajados = (hoy.getFullYear() - ingreso.getFullYear()) * 12 + (hoy.getMonth() - ingreso.getMonth());
    const periodoActualNum = Math.floor(mesesTrabajados / 6) + 1;
    const mesesEnPeriodo = mesesTrabajados % 6;
    const mesesFaltantes = 6 - mesesEnPeriodo;
    const fechaProximoPeriodo = new Date(ingreso);
    fechaProximoPeriodo.setMonth(ingreso.getMonth() + (periodoActualNum * 6));
    return { periodoActualNum, mesesFaltantes, fechaProximoPeriodo, mesesTrabajados };
  };

  const infoSemestral = calcularPeriodoSemestral();
  const esAdminRRHH = ['admin', 'rrhh'].includes(usuario?.rol);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg fade-in" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="perfil-header">
            {empleado.foto_url ? (
              <img src={empleado.foto_url} alt={nombre} className="perfil-foto"
                onClick={e => { e.stopPropagation(); setFotoExpandida(true); }}
                title="Click para ver foto completa" />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, border: '4px solid var(--dorado)', flexShrink: 0 }}>👤</div>
            )}
            <div style={{ flex: 1 }}>
              <div className="perfil-nombre">{nombre}</div>
              <div className="perfil-puesto">{empleado.puesto || 'Sin puesto asignado'}</div>
              {empleado.departamento && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6 }}>🏢 {empleado.departamento}</div>
              )}
              {empleado.numero_empleado && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}># {empleado.numero_empleado}</div>
              )}
              {infoSemestral && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="periodo-badge periodo-1">Periodo {infoSemestral.periodoActualNum % 2 === 1 ? '1' : '2'}</span>
                  <span style={{ fontSize: 11, opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                    ⏳ {infoSemestral.mesesFaltantes} mes{infoSemestral.mesesFaltantes !== 1 ? 'es' : ''} para próximo periodo
                  </span>
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

          {/* Barra progreso */}
          <div style={{ padding: '16px 28px 0', background: 'var(--blanco)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--guinda)' }}>
              <span>Vacaciones {anioActual}</span>
              <span>{periodoActual.dias_tomados || 0} / {periodoActual.dias_correspondientes || 0} días usados ({pct}%)</span>
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${pct > 80 ? 'danger' : pct > 50 ? 'warning' : ''}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--gris-claro)', padding: '0 28px', background: 'var(--blanco)' }}>
            {[
              { id: 'info', label: '📋 Información' },
              { id: 'periodos', label: '📅 Periodos' },
              { id: 'solicitudes', label: '📝 Solicitudes' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '13px 18px', background: 'none', border: 'none', borderBottom: tab === t.id ? '3px solid var(--guinda)' : '3px solid transparent', color: tab === t.id ? 'var(--guinda)' : 'var(--gris-texto)', fontFamily: 'Montserrat', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'color 0.2s', marginBottom: -2 }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          <div className="modal-body">
            {tab === 'info' && (
              <div className="form-grid" style={{ gap: 16 }}>
                {[
                  { label: 'Correo electrónico', value: empleado.email, icon: '✉️' },
                  { label: 'Teléfono', value: empleado.telefono, icon: '📱' },
                  { label: 'Fecha de ingreso', value: empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : null, icon: '📆' },
                  { label: 'Antigüedad', value: empleado.fecha_ingreso ? calcularAntiguedad(empleado.fecha_ingreso) : null, icon: '⏱️' },
                  { label: 'Periodo actual', value: infoSemestral ? `Periodo ${infoSemestral.periodoActualNum % 2 === 1 ? '1' : '2'} (${infoSemestral.mesesFaltantes} meses para el siguiente)` : null, icon: '🔄' },
                  { label: 'Total periodos cumplidos', value: infoSemestral ? `${Math.floor(infoSemestral.mesesTrabajados / 6)} periodos de 6 meses` : null, icon: '✅' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: 'var(--blanco-off)', borderRadius: 12, padding: '14px 16px', borderLeft: '3px solid var(--guinda)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', marginBottom: 4 }}>{icon} {label}</div>
                    <div style={{ fontWeight: 600, color: 'var(--texto-oscuro)', fontSize: 14 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'periodos' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: 'var(--guinda)', fontSize: 14 }}>Periodos de Vacaciones</h3>
                    <p style={{ fontSize: 12, color: 'var(--gris-texto)', marginTop: 4 }}>Cada 6 meses corresponden 10 días. Puedes editar manualmente si es necesario.</p>
                  </div>
                  {esAdminRRHH && (
                    <button className="btn-institucional filled btn-sm"
                      onClick={() => { setEditandoPeriodo('nuevo'); setFormPeriodo({ anio: anioActual, dias_correspondientes: 10, observaciones: '' }); }}>
                      ➕ Agregar
                    </button>
                  )}
                </div>

                {/* Info semestral */}
                {infoSemestral && (
                  <div style={{ background: 'var(--guinda-soft)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid rgba(107,15,43,0.15)' }}>
                    <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 13, color: 'var(--guinda)', marginBottom: 8 }}>📊 Cálculo Automático de Periodos</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Meses trabajados', value: `${infoSemestral.mesesTrabajados} meses` },
                        { label: 'Periodos cumplidos', value: `${Math.floor(infoSemestral.mesesTrabajados / 6)} periodos` },
                        { label: 'Periodo actual', value: `Periodo ${infoSemestral.periodoActualNum % 2 === 1 ? '1 (Ene-Jun)' : '2 (Jul-Dic)'}` },
                        { label: 'Próximo periodo en', value: `${infoSemestral.mesesFaltantes} mes${infoSemestral.mesesFaltantes !== 1 ? 'es' : ''}` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: 10, fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ fontWeight: 700, color: 'var(--guinda)', fontSize: 14, marginTop: 2 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editandoPeriodo && esAdminRRHH && (
                  <div style={{ background: 'var(--blanco-off)', borderRadius: 12, padding: 16, marginBottom: 16, border: '2px solid var(--guinda)' }}>
                    <h4 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: 'var(--guinda)', marginBottom: 14, fontSize: 13 }}>
                      {editandoPeriodo === 'nuevo' ? '➕ Nuevo Periodo' : '✏️ Editar Periodo'}
                    </h4>
                    <div className="form-grid" style={{ gap: 12 }}>
                      <div className="form-group">
                        <label>Año</label>
                        <input type="number" className="form-control" value={formPeriodo.anio} onChange={e => setFormPeriodo({ ...formPeriodo, anio: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Días correspondientes</label>
                        <input type="number" className="form-control" value={formPeriodo.dias_correspondientes} onChange={e => setFormPeriodo({ ...formPeriodo, dias_correspondientes: e.target.value })} min="1" max="60" />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label>Observaciones</label>
                        <input className="form-control" value={formPeriodo.observaciones || ''} onChange={e => setFormPeriodo({ ...formPeriodo, observaciones: e.target.value })} placeholder="Ej: Periodo 1 2026 - Ajuste manual" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
                      <button className="btn-institucional btn-sm" onClick={() => setEditandoPeriodo(null)}>Cancelar</button>
                      <button className="btn-institucional filled btn-sm" onClick={guardarPeriodo}>💾 Guardar</button>
                    </div>
                  </div>
                )}

                {periodos.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: 40, color: 'var(--gris-texto)' }}>Sin periodos registrados</p>
                ) : (
                  <div className="tabla-wrapper">
                    <table>
                      <thead><tr><th>Año</th><th>Periodo</th><th>Corresponden</th><th>Tomados</th><th>Disponibles</th><th>Notas</th>{esAdminRRHH && <th>Editar</th>}</tr></thead>
                      <tbody>
                        {periodos.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.anio}</strong></td>
                            <td>
                              <span className={`periodo-badge ${p.anio % 2 === 0 ? 'periodo-2' : 'periodo-1'}`}>
                                P{p.anio % 2 === 0 ? '2' : '1'}
                              </span>
                            </td>
                            <td>{p.dias_correspondientes}</td>
                            <td>{p.dias_tomados}</td>
                            <td>
                              <span style={{ fontFamily: 'Montserrat', fontWeight: 900, color: p.dias_disponibles <= 2 ? '#e74c3c' : p.dias_disponibles <= 5 ? 'var(--dorado-dark)' : 'var(--guinda)', fontSize: 16 }}>
                                {p.dias_disponibles}
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--gris-texto)' }}>{p.observaciones || '—'}</td>
                            {esAdminRRHH && (
                              <td>
                                <button className="btn-institucional dorado btn-sm"
                                  onClick={() => { setEditandoPeriodo(p.id); setFormPeriodo({ anio: p.anio, dias_correspondientes: p.dias_correspondientes, observaciones: p.observaciones || '' }); }}>
                                  ✏️
                                </button>
                              </td>
                            )}
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
                      <thead><tr><th>Periodo</th><th>Días</th><th>Estatus</th><th>Resuelto por</th></tr></thead>
                      <tbody>
                        {solicitudes.map(s => (
                          <tr key={s.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}</div>
                              <div style={{ fontSize: 11, color: 'var(--gris-texto)' }}>{s.anio}</div>
                            </td>
                            <td><span style={{ fontFamily: 'Montserrat', fontWeight: 800, color: 'var(--guinda)', fontSize: 18 }}>{s.dias_solicitados}</span></td>
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
        </div>
      </div>

      {/* Foto expandida */}
      {fotoExpandida && empleado.foto_url && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setFotoExpandida(false)}>
          <div style={{ position: 'relative', maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
            <img src={empleado.foto_url} alt={nombre} className="foto-modal-img" />
            <div style={{ textAlign: 'center', marginTop: 12, color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 16 }}>{nombre}</div>
            <button onClick={() => setFotoExpandida(false)}
              style={{ position: 'absolute', top: -12, right: -12, background: 'var(--guinda)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
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
