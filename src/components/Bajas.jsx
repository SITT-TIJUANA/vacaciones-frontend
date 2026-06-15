import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Bajas() {
  const [bajas, setBajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalReactivar, setModalReactivar] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [empleadosActivos, setEmpleadosActivos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalDarBaja, setModalDarBaja] = useState(null);
  const [formBaja, setFormBaja] = useState({ motivo:'', notas:'' });
  const [conservarHistorial, setConservarHistorial] = useState(true);

  const cargar = () => {
    setCargando(true);
    api.get('/api/bajas').then(r => setBajas(r.data)).catch(console.error).finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
    api.get('/api/empleados').then(r => setEmpleadosActivos(r.data)).catch(console.error);
  }, []);

  const reactivar = async (id) => {
    setEnviando(true);
    try { await api.post(`/api/bajas/${id}/reactivar`); cargar(); setModalReactivar(null); }
    catch(e) { alert(e.response?.data?.error || 'Error'); }
    finally { setEnviando(false); }
  };

  const darBaja = async () => {
    if (!modalDarBaja) return;
    setEnviando(true);
    try {
      await api.post(`/api/bajas/${modalDarBaja.id}`, {
        motivo_baja: formBaja.motivo,
        notas_baja: formBaja.notas,
        borrar_historial: !conservarHistorial,
      });
      setModalDarBaja(null);
      setFormBaja({ motivo:'', notas:'' });
      setConservarHistorial(true);
      cargar();
      api.get('/api/empleados').then(r => setEmpleadosActivos(r.data)).catch(console.error);
    } catch(e) { alert(e.response?.data?.error || 'Error al dar de baja'); }
    finally { setEnviando(false); }
  };

  const [opcionesEliminar, setOpcionesEliminar] = useState({
    empleado: true,
    solicitudes: false,
    historial: false,
    bajas: false,
    vacaciones_calendario: false,
    usuario: false,
  });

  const eliminar = async (emp) => {
    setEnviando(true);
    try {
      await api.delete(`/api/empleados/${emp.id}/permanente`, {
        data: opcionesEliminar
      });
      cargar();
      setModalEliminar(null);
      setOpcionesEliminar({ empleado:true, solicitudes:false, historial:false, bajas:false, vacaciones_calendario:false, usuario:false });
    }
    catch(e) { alert(e.response?.data?.error || 'Error al eliminar'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Bajas de Personal</h2>
        <span style={{ background:'rgba(183,28,28,0.08)', color:'#B71C1C', padding:'8px 18px', borderRadius:30, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, border:'1px solid rgba(183,28,28,0.2)' }}>
          {bajas.length} empleado{bajas.length !== 1 ? 's' : ''} dado{bajas.length !== 1 ? 's' : ''} de baja
        </span>
      </div>

      {/* Sección dar de baja */}
      <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight:800, fontSize:14, color:'#B71C1C', marginBottom:14, fontFamily:'Montserrat,sans-serif' }}>🚫 Dar de baja a un empleado</div>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar empleado activo por nombre o puesto..."
          style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box', marginBottom:12 }}
        />
        {busqueda.length > 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:240, overflowY:'auto' }}>
            {empleadosActivos
              .filter(e => `${e.nombre} ${e.apellido_paterno} ${e.puesto||''}`.toLowerCase().includes(busqueda.toLowerCase()))
              .slice(0, 8)
              .map(e => (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#f7f8fc', borderRadius:10, border:'1px solid #e2e8f0' }}>
                  {e.foto_url
                    ? <img src={e.foto_url} alt="" style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', border:'2px solid #e2e8f0' }}/>
                    : <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👤</div>
                  }
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:'#1a1a2e' }}>{e.nombre} {e.apellido_paterno}</div>
                    <div style={{ fontSize:11, color:'#718096' }}>{e.puesto||'—'} · {e.departamento||'—'}</div>
                  </div>
                  <button onClick={() => { setModalDarBaja(e); setBusqueda(''); }}
                    style={{ padding:'6px 14px', borderRadius:20, border:'none', background:'#B71C1C', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12 }}>
                    🚫 Dar de baja
                  </button>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {cargando ? (
        <div className="loader-wrapper"><div className="loader" /></div>
      ) : bajas.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <div style={{ fontSize:64, marginBottom:16 }} className="float-anim">✅</div>
          <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:22, color:'var(--g)' }}>Sin bajas registradas</p>
          <p style={{ color:'var(--g60)', marginTop:8 }}>Todo el personal está activo</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {bajas.map(emp => (
            <div key={emp.id} className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'stretch' }}>
                <div style={{ width:6, background:'linear-gradient(180deg,#B71C1C,#E53935)', flexShrink:0 }} />
                <div style={{ flex:1, padding:'20px 24px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                  {/* Foto */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    {emp.foto_url
                      ? <img src={emp.foto_url} alt="" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid #E53935', filter:'grayscale(40%)' }} />
                      : <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, border:'3px solid #E53935' }}>👤</div>
                    }
                    <div style={{ position:'absolute', bottom:-4, right:-4, background:'#B71C1C', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, border:'2px solid white' }}>🚫</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:18, color:'var(--g)' }}>
                      {emp.nombre} {emp.apellido_paterno} {emp.apellido_materno || ''}
                    </div>
                    <div style={{ fontSize:13, color:'var(--g60)', marginTop:3 }}>{emp.puesto || '—'} · {emp.departamento || '—'}</div>
                    {emp.numero_empleado && <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}># {emp.numero_empleado}</div>}
                  </div>

                  {/* Stats */}
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                    <div style={{ textAlign:'center', padding:'10px 16px', background:'rgba(183,28,28,0.06)', borderRadius:12, border:'1px solid rgba(183,28,28,0.15)' }}>
                      <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#B71C1C', textTransform:'uppercase', letterSpacing:'0.5px' }}>Fecha de Baja</div>
                      <div style={{ fontWeight:800, color:'#B71C1C', fontSize:14, marginTop:4, fontFamily:'Montserrat,sans-serif' }}>
                        {emp.fecha_baja ? new Date(emp.fecha_baja).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </div>
                    </div>
                    <div style={{ textAlign:'center', padding:'10px 16px', background:'rgba(107,15,43,0.06)', borderRadius:12, border:'1px solid rgba(107,15,43,0.15)' }}>
                      <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Días Adeudados</div>
                      <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, color: emp.dias_adeudados > 0 ? '#E65100' : '#155724', fontSize:28, lineHeight:1.1, marginTop:4 }}>
                        {emp.dias_adeudados || 0}
                      </div>
                    </div>
                    {emp.fecha_ingreso && (
                      <div style={{ textAlign:'center', padding:'10px 16px', background:'var(--g10)', borderRadius:12, border:'1px solid var(--g20)' }}>
                        <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Ingresó</div>
                        <div style={{ fontWeight:700, color:'var(--g80)', fontSize:13, marginTop:4, fontFamily:'Montserrat,sans-serif' }}>
                          {new Date(emp.fecha_ingreso).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Motivo y notas */}
                  {(emp.motivo_baja || emp.notas_baja) && (
                    <div style={{ width:'100%', marginTop:4, padding:'10px 14px', background:'var(--g10)', borderRadius:10, border:'1px solid var(--g20)' }}>
                      {emp.motivo_baja && <div style={{ fontSize:12, fontWeight:700, color:'var(--g)', fontFamily:'Montserrat,sans-serif' }}>Motivo: <span style={{ fontWeight:500, color:'var(--g60)' }}>{emp.motivo_baja}</span></div>}
                      {emp.notas_baja && <div style={{ fontSize:12, color:'var(--g60)', marginTop:4 }}>📝 {emp.notas_baja}</div>}
                    </div>
                  )}

                  {/* Botones */}
                  <div style={{ display:'flex', gap:8, marginLeft:'auto', flexShrink:0 }}>
                    <button className="btn-institucional dorado btn-sm" onClick={() => setModalReactivar(emp)}>
                      🔄 Reactivar
                    </button>
                    <button className="btn-institucional peligro btn-sm" onClick={() => setModalEliminar(emp)}>
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal dar de baja */}
      {modalDarBaja && (
        <div className="modal-overlay" onClick={() => setModalDarBaja(null)}>
          <div className="modal" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background:'linear-gradient(135deg,#7F0000,#B71C1C)' }}>
              <h2>🚫 Dar de Baja</h2>
              <button className="modal-close" onClick={() => setModalDarBaja(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:'rgba(183,28,28,0.06)', borderRadius:12, border:'1px solid rgba(183,28,28,0.15)' }}>
                {modalDarBaja.foto_url
                  ? <img src={modalDarBaja.foto_url} alt="" style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:'3px solid #E53935' }}/>
                  : <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>👤</div>
                }
                <div>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:16, color:'var(--g)' }}>{modalDarBaja.nombre} {modalDarBaja.apellido_paterno}</div>
                  <div style={{ fontSize:12, color:'var(--g60)' }}>{modalDarBaja.puesto||'—'} · {modalDarBaja.departamento||'—'}</div>
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:6, textTransform:'uppercase' }}>Motivo de baja</label>
                <select value={formBaja.motivo} onChange={e => setFormBaja({...formBaja, motivo:e.target.value})}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}>
                  <option value="">Seleccionar motivo...</option>
                  {['Renuncia voluntaria','Término de contrato','Jubilación','Despido','Fallecimiento','Otro'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:6, textTransform:'uppercase' }}>Notas adicionales</label>
                <textarea value={formBaja.notas} onChange={e => setFormBaja({...formBaja, notas:e.target.value})}
                  rows={2} placeholder="Observaciones opcionales..."
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13, resize:'vertical', boxSizing:'border-box' }}/>
              </div>

              <div style={{ padding:'10px 12px', background:'rgba(183,28,28,0.08)', borderRadius:10, border:'1px solid rgba(183,28,28,0.2)', fontSize:12, color:'#B71C1C', fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>
                ⚠️ El empleado quedará inactivo y no podrá acceder al sistema.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => setModalDarBaja(null)}>Cancelar</button>
              <button className="btn-institucional peligro btn-sm" onClick={darBaja} disabled={enviando}>
                {enviando ? '⏳...' : '🚫 Confirmar baja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reactivar */}
      {modalReactivar && (
        <div className="modal-overlay" onClick={() => setModalReactivar(null)}>
          <div className="modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔄 Reactivar Empleado</h2>
              <button className="modal-close" onClick={() => setModalReactivar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize:14, color:'var(--g60)', lineHeight:1.6 }}>
                ¿Reactivar a <strong style={{ color:'var(--g)' }}>{modalReactivar.nombre} {modalReactivar.apellido_paterno}</strong>? Volverá a aparecer en el tablero activo.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => setModalReactivar(null)}>Cancelar</button>
              <button className="btn-institucional dorado btn-sm" onClick={() => reactivar(modalReactivar.id)} disabled={enviando}>
                {enviando ? '⏳...' : '🔄 Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar permanente */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background:'linear-gradient(135deg,#7F0000,#B71C1C)' }}>
              <h2>🗑️ Eliminar Permanentemente</h2>
              <button className="modal-close" onClick={() => setModalEliminar(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Info empleado */}
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:'rgba(183,28,28,0.06)', borderRadius:12, border:'1px solid rgba(183,28,28,0.15)' }}>
                {modalEliminar.foto_url
                  ? <img src={modalEliminar.foto_url} alt="" style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:'3px solid #E53935' }} />
                  : <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>👤</div>
                }
                <div>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:16, color:'var(--g)' }}>{modalEliminar.nombre} {modalEliminar.apellido_paterno}</div>
                  <div style={{ fontSize:12, color:'var(--g60)' }}>{modalEliminar.puesto || '—'}</div>
                </div>
              </div>

              {/* Opciones de qué eliminar */}
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  ¿Qué deseas eliminar?
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { key:'empleado',             label:'👤 Datos del empleado y foto', desc:'Nombre, puesto, departamento, foto', obligatorio: true },
                    { key:'solicitudes',           label:'📋 Solicitudes de vacaciones', desc:'Historial de solicitudes enviadas' },
                    { key:'vacaciones_calendario', label:'📅 Vacaciones del calendario', desc:'Registros aprobados en el calendario' },
                    { key:'bajas',                 label:'🚫 Registro de baja', desc:'Información de fecha y motivo de baja' },
                    { key:'historial',             label:'📖 Historial de actividad', desc:'Log de acciones relacionadas' },
                    { key:'usuario',               label:'🔐 Usuario de acceso', desc:'Cuenta para iniciar sesión' },
                  ].map(({ key, label, desc, obligatorio }) => (
                    <label key={key} style={{
                      display:'flex', alignItems:'flex-start', gap:12, padding:'10px 12px',
                      borderRadius:10, cursor: obligatorio ? 'not-allowed' : 'pointer',
                      background: opcionesEliminar[key] ? 'rgba(183,28,28,0.07)' : 'var(--g10)',
                      border: `1.5px solid ${opcionesEliminar[key] ? 'rgba(183,28,28,0.3)' : 'var(--g20)'}`,
                      transition: 'all 0.2s',
                    }}>
                      <input type="checkbox"
                        checked={opcionesEliminar[key]}
                        disabled={obligatorio}
                        onChange={e => setOpcionesEliminar(o => ({ ...o, [key]: e.target.checked }))}
                        style={{ width:16, height:16, marginTop:2, accentColor:'#B71C1C', flexShrink:0 }}
                      />
                      <div>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color: opcionesEliminar[key] ? '#B71C1C' : 'var(--txt)' }}>
                          {label} {obligatorio && <span style={{ fontSize:10, color:'#B71C1C', fontWeight:500 }}>(requerido)</span>}
                        </div>
                        <div style={{ fontSize:11, color:'var(--g60)', marginTop:2 }}>{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ padding:'10px 12px', background:'rgba(183,28,28,0.08)', borderRadius:10, border:'1px solid rgba(183,28,28,0.2)', fontSize:12, color:'#B71C1C', fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>
                ⚠️ Lo que marques se eliminará permanentemente. No se puede deshacer.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => setModalEliminar(null)}>Cancelar</button>
              <button className="btn-institucional peligro btn-sm" onClick={() => eliminar(modalEliminar)} disabled={enviando}>
                {enviando ? '⏳...' : '🗑️ Eliminar para siempre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
