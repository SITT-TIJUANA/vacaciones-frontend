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
  const [registrarVacs, setRegistrarVacs] = useState(false);
  const [formVacs, setFormVacs] = useState({ fecha_inicio:'', fecha_fin:'', motivo:'' });
  const [guardandoVacs, setGuardandoVacs] = useState(false);
  const [formPeriodo, setFormPeriodo] = useState({});

  useEffect(() => {
    api.get(`/api/empleados/${empleadoId}`)
      .then(r => setDatos(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [empleadoId]);

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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

  const guardarVacaciones = async () => {
    if (!formVacs.fecha_inicio || !formVacs.fecha_fin) return;
    setGuardandoVacs(true);
    try {
      await api.post('/api/solicitudes/manual', { empleado_id: empleadoId, ...formVacs });
      const r = await api.get('/api/empleados/' + empleadoId);
      setDatos(r.data);
      setRegistrarVacs(false);
      setFormVacs({ fecha_inicio:'', fecha_fin:'', motivo:'' });
      onActualizar?.();
    } catch(e) { alert(e.response?.data?.error || 'Error al registrar'); }
    finally { setGuardandoVacs(false); }
  };

  if (cargando) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ padding: 60 }} onClick={e => e.stopPropagation()}>
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
    ? Math.round((periodoActual.dias_tomados / periodoActual.dias_correspondientes) * 100) : 0;

  const calcularPeriodoSemestral = () => {
    if (!empleado.fecha_ingreso) return null;
    const hoy = new Date();
    const ingreso = new Date(empleado.fecha_ingreso);
    const mesesTrabajados = (hoy.getFullYear() - ingreso.getFullYear()) * 12 + (hoy.getMonth() - ingreso.getMonth());
    const periodoActualNum = Math.floor(mesesTrabajados / 6) + 1;
    const mesesFaltantes = 6 - (mesesTrabajados % 6);
    return { periodoActualNum, mesesFaltantes, mesesTrabajados };
  };

  const infoSemestral = calcularPeriodoSemestral();
  const esAdminRRHH = ['admin', 'rrhh'].includes(usuario?.rol);

  const TABS = [
    { id: 'info',        label: 'Información', icon: '📋' },
    { id: 'periodos',    label: 'Periodos',     icon: '📅' },
    { id: 'solicitudes', label: 'Solicitudes',  icon: '📝' },
  ];

  return (
    <>
      {/* Overlay — clic fuera cierra */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg fade-in" onClick={e => e.stopPropagation()}>

          {/* ── HEADER ── */}
          <div className="perfil-header" style={{ position: 'relative' }}>
            {/* Botón X — grande y siempre visible */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                border: '2px solid rgba(255,255,255,0.5)',
                color: '#fff', fontSize: 20, fontWeight: 900,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', lineHeight: 1,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.45)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            >✕</button>

            {/* Foto */}
            {empleado.foto_url ? (
              <img src={empleado.foto_url} alt={nombre} className="perfil-foto"
                onClick={e => { e.stopPropagation(); setFotoExpandida(true); }} />
            ) : (
              <div style={{ width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, border:'4px solid var(--d)', flexShrink:0 }}>👤</div>
            )}

            {/* Info */}
            <div style={{ flex:1, paddingRight: 44 }}>
              <div className="perfil-nombre">{nombre}</div>
              <div className="perfil-puesto">{empleado.puesto || 'Sin puesto'}</div>
              {empleado.departamento && <div style={{ marginTop:5, fontSize:12, opacity:0.8 }}>🏢 {empleado.departamento}</div>}
              {empleado.numero_empleado && <div style={{ marginTop:3, fontSize:12, opacity:0.7 }}># {empleado.numero_empleado}</div>}
              {infoSemestral && (
                <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                  <span className="periodo-badge periodo-1">Periodo {infoSemestral.periodoActualNum % 2 === 1 ? '1' : '2'}</span>
                  <span style={{ fontSize:11, opacity:0.8 }}>⏳ {infoSemestral.mesesFaltantes} meses para siguiente</span>
                </div>
              )}
            </div>

            {/* Días disponibles */}
            <div className="dias-ring" style={{ flexShrink:0 }}>
              <div className="numero">{periodoActual.dias_disponibles ?? '—'}</div>
              <div className="etiqueta">días disp.</div>
              <div style={{ fontSize:10, opacity:0.7, marginTop:3 }}>{anioActual}</div>
            </div>
          </div>

          {/* ── BARRA PROGRESO ── */}
          <div style={{ padding:'12px 16px 0', background:'var(--w)', flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g)' }}>
              <span>Vacaciones {anioActual}</span>
              <span>{periodoActual.dias_tomados||0} / {periodoActual.dias_correspondientes||0} días ({pct}%)</span>
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${pct>80?'danger':pct>50?'warning':''}`} style={{ width:`${pct}%` }} />
            </div>
          </div>

          {/* ── TABS como botones bonitos ── */}
          <div style={{ display:'flex', gap:6, padding:'10px 16px 0', background:'var(--w)', flexWrap:'nowrap', flexShrink:0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex:1, minWidth:80, padding:'10px 12px',
                  borderRadius:12,
                  background: tab === t.id ? 'var(--g)' : 'var(--g10)',
                  border: tab === t.id ? '2px solid var(--g)' : '2px solid var(--g20)',
                  color: tab === t.id ? '#fff' : 'var(--g60)',
                  fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12,
                  cursor:'pointer', transition:'all 0.25s',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                <span style={{ fontSize:16 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ── CONTENIDO TABS ── */}
          <div className="modal-body" style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>

            {/* INFO */}
            {tab === 'info' && (
              <div className="form-grid" style={{ gap:14 }}>
                {[
                  { label:'Correo', value:empleado.email, icon:'✉️' },
                  { label:'Teléfono', value:empleado.telefono, icon:'📱' },
                  { label:'Fecha de ingreso', value:empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-MX',{year:'numeric',month:'long',day:'numeric'}) : null, icon:'📆' },
                  { label:'Antigüedad', value:empleado.fecha_ingreso ? calcularAntiguedad(empleado.fecha_ingreso) : null, icon:'⏱️' },
                  { label:'Periodo actual', value:infoSemestral ? `Periodo ${infoSemestral.periodoActualNum%2===1?'1':'2'} · ${infoSemestral.mesesFaltantes} meses para el siguiente` : null, icon:'🔄' },
                  { label:'Periodos cumplidos', value:infoSemestral ? `${Math.floor(infoSemestral.mesesTrabajados/6)} periodos de 6 meses` : null, icon:'✅' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background:'var(--g10)', borderRadius:12, padding:'12px 14px', borderLeft:'3px solid var(--g)' }}>
                    <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', textTransform:'uppercase', marginBottom:3 }}>{icon} {label}</div>
                    <div style={{ fontWeight:600, color:'var(--txt)', fontSize:14 }}>{value||'—'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* PERIODOS */}
            {tab === 'periodos' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div>
                    <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'var(--g)', fontSize:14 }}>Periodos de Vacaciones</h3>
                    <p style={{ fontSize:12, color:'var(--g60)', marginTop:3 }}>Cada 6 meses = 10 días. Editable manualmente.</p>
                  </div>
                  {esAdminRRHH && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn-institucional dorado btn-sm"
                        onClick={() => setRegistrarVacs(true)}>
                        📅 Registrar Vacaciones
                      </button>
                      <button className="btn-institucional filled btn-sm"
                        onClick={() => { setEditandoPeriodo('nuevo'); setFormPeriodo({ anio: anioActual, dias_correspondientes: 10, observaciones: '' }); }}>
                        ➕ Periodo
                      </button>
                    </div>
                  )}
                </div>

                {infoSemestral && (
                  <div style={{ background:'var(--g-soft)', borderRadius:12, padding:'12px 14px', marginBottom:14, border:'1px solid rgba(107,15,43,0.15)' }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'var(--g)', marginBottom:8 }}>🧠 Cálculo Automático</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      {[
                        { label:'Meses trabajados', value:`${infoSemestral.mesesTrabajados}` },
                        { label:'Periodos cumplidos', value:`${Math.floor(infoSemestral.mesesTrabajados/6)}` },
                        { label:'Periodo actual', value:`P${infoSemestral.periodoActualNum%2===1?'1':'2'}` },
                        { label:'Siguiente en', value:`${infoSemestral.mesesFaltantes} meses` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', textTransform:'uppercase' }}>{label}</div>
                          <div style={{ fontWeight:800, color:'var(--g)', fontSize:15, marginTop:2 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editandoPeriodo && esAdminRRHH && (
                  <div style={{ background:'var(--g10)', borderRadius:12, padding:16, marginBottom:14, border:'2px solid var(--g)' }}>
                    <h4 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'var(--g)', marginBottom:12, fontSize:12 }}>
                      {editandoPeriodo==='nuevo'?'➕ Nuevo Periodo':'✏️ Editar Periodo'}
                    </h4>
                    <div className="form-grid" style={{ gap:10 }}>
                      <div className="form-group"><label>Año</label><input type="number" className="form-control" value={formPeriodo.anio} onChange={e=>setFormPeriodo({...formPeriodo,anio:e.target.value})} /></div>
                      <div className="form-group"><label>Días correspondientes</label><input type="number" className="form-control" value={formPeriodo.dias_correspondientes} onChange={e=>setFormPeriodo({...formPeriodo,dias_correspondientes:e.target.value})} min="1" max="60" /></div>
                      <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Observaciones</label><input className="form-control" value={formPeriodo.observaciones||''} onChange={e=>setFormPeriodo({...formPeriodo,observaciones:e.target.value})} placeholder="Notas..." /></div>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end' }}>
                      <button className="btn-institucional btn-sm" onClick={()=>setEditandoPeriodo(null)}>Cancelar</button>
                      <button className="btn-institucional filled btn-sm" onClick={guardarPeriodo}>💾 Guardar</button>
                    </div>
                  </div>
                )}

                {registrarVacs && esAdminRRHH && (
                  <div style={{ background:'#E3F2FD', borderRadius:12, padding:16, marginBottom:14, border:'2px solid #1565C0' }}>
                    <h4 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'#1565C0', marginBottom:12, fontSize:12 }}>
                      📅 Registrar Vacaciones Manualmente
                    </h4>
                    <div className="form-grid" style={{ gap:10 }}>
                      <div className="form-group"><label>Fecha inicio</label><input type="date" className="form-control" value={formVacs.fecha_inicio} onChange={e=>setFormVacs({...formVacs,fecha_inicio:e.target.value})} /></div>
                      <div className="form-group"><label>Fecha fin</label><input type="date" className="form-control" value={formVacs.fecha_fin} onChange={e=>setFormVacs({...formVacs,fecha_fin:e.target.value})} /></div>
                      <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Motivo</label><input className="form-control" value={formVacs.motivo} onChange={e=>setFormVacs({...formVacs,motivo:e.target.value})} placeholder="Ej: Vacaciones periodo 2026..." /></div>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end' }}>
                      <button className="btn-institucional btn-sm" onClick={()=>setRegistrarVacs(false)}>Cancelar</button>
                      <button className="btn-institucional filled btn-sm" style={{ background:'#1565C0', borderColor:'#1565C0' }} onClick={guardarVacaciones} disabled={guardandoVacs}>
                        {guardandoVacs ? '⏳...' : '💾 Registrar'}
                      </button>
                    </div>
                  </div>
                )}

                {periodos.length === 0 ? (
                  <p style={{ textAlign:'center', padding:40, color:'var(--g60)' }}>Sin periodos registrados</p>
                ) : (
                  <div className="tabla-wrapper">
                    <table>
                      <thead><tr><th>Año</th><th>P</th><th>Corresp.</th><th>Tomados</th><th>Disp.</th>{esAdminRRHH&&<th>✏️</th>}</tr></thead>
                      <tbody>
                        {periodos.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.anio}</strong></td>
                            <td><span className={`periodo-badge ${p.anio%2===0?'periodo-2':'periodo-1'}`}>P{p.anio%2===0?'2':'1'}</span></td>
                            <td>{p.dias_correspondientes}</td>
                            <td>{p.dias_tomados}</td>
                            <td><span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, color:p.dias_disponibles<=2?'#e74c3c':p.dias_disponibles<=5?'var(--d-dk)':'var(--g)', fontSize:16 }}>{p.dias_disponibles}</span></td>
                            {esAdminRRHH && <td><button className="btn-institucional dorado btn-sm" onClick={()=>{setEditandoPeriodo(p.id);setFormPeriodo({anio:p.anio,dias_correspondientes:p.dias_correspondientes,observaciones:p.observaciones||''});}}>✏️</button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SOLICITUDES */}
            {tab === 'solicitudes' && (
              <div>
                {solicitudes.length === 0 ? (
                  <p style={{ textAlign:'center', padding:40, color:'var(--g60)' }}>Sin solicitudes registradas</p>
                ) : (
                  <div className="tabla-wrapper">
                    <table>
                      <thead><tr><th>Periodo</th><th>Días</th><th>Estatus</th><th>Resuelto por</th></tr></thead>
                      <tbody>
                        {solicitudes.map(s => (
                          <tr key={s.id}>
                            <td>
                              <div style={{ fontWeight:600, fontSize:13 }}>{fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}</div>
                              <div style={{ fontSize:11, color:'var(--g60)' }}>{s.anio}</div>
                            </td>
                            <td><span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, color:'var(--g)', fontSize:18 }}>{s.dias_solicitados}</span></td>
                            <td><span className={`badge badge-${s.estatus}`}>{s.estatus}</span></td>
                            <td style={{ fontSize:12 }}>{s.aprobado_por_username||'—'}</td>
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
        <div className="modal-overlay" style={{ zIndex:2000 }} onClick={()=>setFotoExpandida(false)}>
          <div style={{ position:'relative', maxWidth:500, width:'90%' }} onClick={e=>e.stopPropagation()}>
            <img src={empleado.foto_url} alt={nombre} className="foto-modal-img" />
            <div style={{ textAlign:'center', marginTop:12, color:'#fff', fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:16 }}>{nombre}</div>
            <button onClick={()=>setFotoExpandida(false)}
              style={{ position:'absolute', top:-12, right:-12, background:'var(--g)', border:'none', color:'#fff', width:36, height:36, borderRadius:'50%', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}

function calcularAntiguedad(fechaIngreso) {
  const hoy = new Date();
  const ingreso = new Date(fechaIngreso);
  let anios = hoy.getFullYear() - ingreso.getFullYear();
  let meses = hoy.getMonth() - ingreso.getMonth();
  if (meses < 0) { anios--; meses += 12; }
  const partes = [];
  if (anios > 0) partes.push(`${anios} año${anios!==1?'s':''}`);
  if (meses > 0) partes.push(`${meses} mes${meses!==1?'es':''}`);
  return partes.length ? partes.join(' y ') : 'Menos de 1 mes';
}
