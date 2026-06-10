import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });
}
function fmtFechaCorta(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}
const NOMBRE_PERIODO = (sem) => sem === 1 ? 'Periodo 1 — Enero a Junio' : 'Periodo 2 — Julio a Diciembre';

export default function SeccionPeriodos() {
  const { usuario } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSel, setEmpleadoSel] = useState(null);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modalHistorico, setModalHistorico] = useState(false);
  const [modalEditSol, setModalEditSol] = useState(null);
  const [expandido, setExpandido] = useState({});
  const esAdmin = ['admin','rrhh'].includes(usuario?.rol);

  useEffect(() => {
    api.get('/api/empleados').then(r => setEmpleados(r.data)).catch(console.error);
  }, []);

  const seleccionarEmpleado = (emp) => {
    setEmpleadoSel(emp);
    setCargando(true);
    setDatos(null);
    api.get(`/api/solicitudes/periodos-detalle/${emp.id}`)
      .then(r => { setDatos(r.data); setExpandido({}); })
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  const recargar = () => {
    if (!empleadoSel) return;
    setCargando(true);
    api.get(`/api/solicitudes/periodos-detalle/${empleadoSel.id}`)
      .then(r => setDatos(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  const filtrados = empleados.filter(e => {
    if (!busqueda) return true;
    return `${e.nombre} ${e.apellido_paterno} ${e.apellido_materno||''}`.toLowerCase().includes(busqueda.toLowerCase())
      || (e.numero_empleado||'').toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Periodos de Vacaciones</h2>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, alignItems:'start' }}>

        {/* PANEL IZQUIERDO — lista empleados */}
        <div className="card" style={{ padding:0, overflow:'hidden', position:'sticky', top:80 }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--g20)', background:'var(--g-soft)' }}>
            <input className="form-control" placeholder="🔍 Buscar empleado..." value={busqueda}
              onChange={e=>setBusqueda(e.target.value)} style={{ fontSize:13 }} />
          </div>
          <div style={{ maxHeight:'70vh', overflowY:'auto' }}>
            {filtrados.map(emp => (
              <div key={emp.id}
                onClick={() => seleccionarEmpleado(emp)}
                style={{
                  padding:'12px 16px', cursor:'pointer', transition:'background 0.15s',
                  background: empleadoSel?.id === emp.id ? 'var(--g-soft)' : 'transparent',
                  borderLeft: empleadoSel?.id === emp.id ? '4px solid var(--g)' : '4px solid transparent',
                  borderBottom: '1px solid var(--g10)',
                  display:'flex', alignItems:'center', gap:10,
                }}>
                {emp.foto_url
                  ? <img src={emp.foto_url} alt="" style={{ width:38,height:38,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--d)',flexShrink:0 }} />
                  : <div style={{ width:38,height:38,borderRadius:'50%',background:'var(--g10)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>👤</div>
                }
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:'var(--g)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                    {emp.apellido_paterno} {emp.nombre}
                  </div>
                  <div style={{ fontSize:11,color:'var(--g60)' }}>{emp.departamento||'—'}</div>
                </div>
                <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:18,color:'var(--g)',flexShrink:0 }}>
                  {emp.dias_disponibles??'—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO — detalle periodos */}
        <div>
          {!empleadoSel ? (
            <div style={{ textAlign:'center',padding:'80px 20px',color:'var(--g60)' }}>
              <div style={{ fontSize:64,marginBottom:16 }} className="float-anim">📅</div>
              <p style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:22,color:'var(--g)' }}>
                Selecciona un empleado
              </p>
              <p style={{ marginTop:8,fontSize:14 }}>Elige un empleado de la lista para ver su historial de periodos</p>
            </div>
          ) : cargando ? (
            <div className="loader-wrapper"><div className="loader"/></div>
          ) : datos ? (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

              {/* Header empleado */}
              <div className="card" style={{ padding:'20px 24px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
                  {empleadoSel.foto_url
                    ? <img src={empleadoSel.foto_url} alt="" style={{ width:64,height:64,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--d)',flexShrink:0 }} />
                    : <div style={{ width:64,height:64,borderRadius:'50%',background:'var(--g10)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,flexShrink:0 }}>👤</div>
                  }
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:22,color:'var(--g)' }}>
                      {empleadoSel.nombre} {empleadoSel.apellido_paterno}
                    </div>
                    <div style={{ fontSize:13,color:'var(--g60)',marginTop:3 }}>{empleadoSel.puesto||'—'} · {empleadoSel.departamento||'—'}</div>
                  </div>
                  {/* Total disponible */}
                  <div style={{ textAlign:'center',padding:'14px 20px',background:'var(--g-soft)',borderRadius:14,border:'1px solid rgba(107,15,43,0.15)' }}>
                    <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:44,color:'var(--g)',lineHeight:1 }}>{datos.total_disponible}</div>
                    <div style={{ fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)',textTransform:'uppercase',marginTop:4 }}>días disponibles totales</div>
                  </div>
                  {esAdmin && (
                    <button className="btn-institucional filled btn-sm" onClick={()=>setModalHistorico(true)}>
                      📥 Registrar días históricos
                    </button>
                  )}
                </div>

                {/* Resumen por periodos */}
                {datos.periodos.length > 0 && (
                  <div style={{ marginTop:16,paddingTop:16,borderTop:'1px solid var(--g20)' }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'var(--g)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:10 }}>
                      Desglose total de días disponibles:
                    </div>
                    <div style={{ display:'flex',flexWrap:'wrap',gap:8,alignItems:'center' }}>
                      {datos.periodos.map((p,i) => (
                        <span key={p.id||i} style={{ display:'inline-flex',alignItems:'center',gap:6 }}>
                          <span style={{ background:'var(--g)',color:'#fff',padding:'4px 10px',borderRadius:20,fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11 }}>
                            {p.anio} {NOMBRE_PERIODO(p.periodo_semestre||1)} = {p.dias_disponibles} días
                          </span>
                          {i < datos.periodos.length-1 && <span style={{ color:'var(--g60)',fontWeight:700 }}>+</span>}
                        </span>
                      ))}
                      {datos.periodos.length > 1 && (
                        <span style={{ color:'var(--g60)',fontWeight:700 }}>= <strong style={{ color:'var(--g)',fontSize:16 }}>{datos.total_disponible}</strong> días totales</span>
                      )}
                    </div>
                    {datos.proximo_periodo && (
                      <div style={{ marginTop:10,fontSize:12,color:'var(--g60)',fontStyle:'italic' }}>
                        ⏳ Próximo periodo en {datos.proximo_periodo.meses_faltantes} mes{datos.proximo_periodo.meses_faltantes!==1?'es':''}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PERIODOS DETALLADOS */}
              {datos.periodos.length === 0 ? (
                <div style={{ textAlign:'center',padding:40,color:'var(--g60)' }} className="card">
                  <div style={{ fontSize:48,marginBottom:12 }}>📅</div>
                  <p style={{ fontFamily:'Montserrat,sans-serif',fontWeight:700 }}>Sin periodos registrados</p>
                </div>
              ) : (
                datos.periodos.map(p => {
                  const key = `${p.anio}-${p.periodo_semestre||1}`;
                  const abierto = expandido[key] !== false;
                  const pct = p.dias_correspondientes>0 ? Math.round((p.dias_tomados/p.dias_correspondientes)*100) : 0;

                  return (
                    <div key={key} style={{ borderRadius:16,border:'1.5px solid var(--g20)',overflow:'hidden' }}>

                      {/* Header periodo */}
                      <div onClick={()=>setExpandido(e=>({...e,[key]:!abierto}))}
                        style={{ background: abierto?'var(--g-soft)':'var(--g10)', padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:'var(--g)' }}>
                            {p.anio} — {NOMBRE_PERIODO(p.periodo_semestre||1)}
                          </div>
                          <div style={{ marginTop:6,display:'flex',alignItems:'center',gap:8 }}>
                            <div style={{ flex:1,height:8,background:'var(--g20)',borderRadius:4,overflow:'hidden' }}>
                              <div style={{ height:'100%',borderRadius:4,
                                background: pct>=100?'linear-gradient(90deg,#922020,#c0392b)':pct>=70?'linear-gradient(90deg,#E65100,#FF8F00)':'linear-gradient(90deg,var(--g),var(--g-lt))',
                                width:`${Math.min(pct,100)}%`,transition:'width 0.6s' }} />
                            </div>
                            <span style={{ fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)',whiteSpace:'nowrap' }}>
                              {p.dias_tomados} de {p.dias_correspondientes} días usados ({pct}%)
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign:'center',flexShrink:0 }}>
                          <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:32,color:p.dias_disponibles>0?'#1B5E20':'#B71C1C',lineHeight:1 }}>{p.dias_disponibles}</div>
                          <div style={{ fontSize:9,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)',textTransform:'uppercase' }}>disponibles</div>
                        </div>
                        <span style={{ fontSize:20,transition:'transform 0.3s',transform:abierto?'rotate(180deg)':'rotate(0deg)',color:'var(--g)' }}>▾</span>
                      </div>

                      {/* Cuerpo expandible */}
                      {abierto && (
                        <div style={{ padding:'16px 20px',background:'var(--w)',display:'flex',flexDirection:'column',gap:14 }}>

                          {/* Stats 3 columnas */}
                          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                            {[
                              { label:'Días que corresponden a este periodo',value:p.dias_correspondientes,color:'var(--g)',icon:'📋' },
                              { label:'Días de vacaciones ya tomados',value:p.dias_tomados,color:'var(--d-dk)',icon:'🏖️' },
                              { label:'Días disponibles que quedan',value:p.dias_disponibles,color:p.dias_disponibles>0?'#1B5E20':'#B71C1C',icon:'✅' },
                            ].map(({ label,value,color,icon }) => (
                              <div key={label} style={{ textAlign:'center',padding:'12px 8px',background:'var(--g10)',borderRadius:12,border:`2px solid ${color}22` }}>
                                <div style={{ fontSize:18,marginBottom:4 }}>{icon}</div>
                                <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:34,color,lineHeight:1 }}>{value}</div>
                                <div style={{ fontSize:9,color:'var(--g60)',fontFamily:'Montserrat,sans-serif',fontWeight:700,marginTop:5,lineHeight:1.4 }}>{label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Vacaciones de este periodo */}
                          <div>
                            <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'var(--g)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:10 }}>
                              Vacaciones registradas en este periodo:
                            </div>
                            {p.solicitudes?.length > 0 ? (
                              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                                {p.solicitudes.map(s => (
                                  <div key={s.id} style={{
                                    display:'flex',alignItems:'center',gap:12,
                                    padding:'12px 14px',borderRadius:12,
                                    background: s.es_historico?'rgba(230,81,0,0.05)':'var(--g-soft)',
                                    border: `1.5px solid ${s.es_historico?'rgba(230,81,0,0.2)':'rgba(107,15,43,0.12)'}`,
                                    flexWrap:'wrap',
                                  }}>
                                    <span style={{ fontSize:22,flexShrink:0 }}>{s.es_historico?'📂':'✅'}</span>
                                    <div style={{ flex:1,minWidth:140 }}>
                                      <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:'var(--g)' }}>
                                        {fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}
                                      </div>
                                      <div style={{ display:'flex',gap:10,marginTop:4,flexWrap:'wrap',fontSize:11,color:'var(--g60)' }}>
                                        <span>📅 <strong style={{ color:'var(--g)' }}>{s.dias_solicitados} días</strong> de vacaciones</span>
                                        {s.es_historico && <span style={{ color:'#E65100',fontWeight:700 }}>Registro histórico</span>}
                                        {s.aprobado_por_username && <span>Aprobado por: {s.aprobado_por_username}</span>}
                                      </div>
                                      {s.motivo && <div style={{ fontSize:11,color:'var(--g60)',marginTop:3 }}>💬 {s.motivo}</div>}
                                    </div>
                                    {esAdmin && (
                                      <button className="btn-institucional dorado btn-sm" style={{ fontSize:10,flexShrink:0 }}
                                        onClick={()=>setModalEditSol(s)}>✏️ Editar</button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ textAlign:'center',padding:'16px',color:'var(--g60)',background:'var(--g10)',borderRadius:10,fontSize:13 }}>
                                No hay vacaciones registradas en este periodo
                              </div>
                            )}
                          </div>

                          {/* Nota explicativa */}
                          <div style={{ padding:'10px 14px',background:'#E8F5E9',borderRadius:10,border:'1px solid #C8E6C9',fontSize:12,color:'#1B5E20',fontFamily:'Montserrat,sans-serif',fontWeight:600 }}>
                            ℹ️ Este es tu registro oficial del {p.anio} {NOMBRE_PERIODO(p.periodo_semestre||1)}.
                            Te corresponden <strong>{p.dias_correspondientes} días</strong>, has tomado <strong>{p.dias_tomados} días</strong> y tienes <strong>{p.dias_disponibles} días disponibles</strong>.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal registrar histórico */}
      {modalHistorico && empleadoSel && (
        <ModalHistorico
          empleadoId={empleadoSel.id}
          onClose={()=>setModalHistorico(false)}
          onGuardado={()=>{ recargar(); setModalHistorico(false); }}
        />
      )}

      {/* Modal editar solicitud */}
      {modalEditSol && (
        <ModalEditarSolicitud
          solicitud={modalEditSol}
          onClose={()=>setModalEditSol(null)}
          onGuardado={()=>{ recargar(); setModalEditSol(null); }}
        />
      )}
    </div>
  );
}

function ModalHistorico({ empleadoId, onClose, onGuardado }) {
  const [form, setForm] = useState({ tipo:'rango', fecha_inicio:'', fecha_fin:'', dias:'', anio:new Date().getFullYear(), periodo_semestre:1, notas:'' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const calcDias = () => {
    if (!form.fecha_inicio||!form.fecha_fin) return 0;
    const ini=new Date(form.fecha_inicio); const fin=new Date(form.fecha_fin);
    if(fin<ini)return 0;
    let d=0; const c=new Date(ini);
    while(c<=fin){if(c.getDay()!==0&&c.getDay()!==6)d++;c.setDate(c.getDate()+1);}
    return d;
  };

  const diasCalc = form.tipo==='rango' ? calcDias() : parseInt(form.dias||0);

  const guardar = async () => {
    if(!diasCalc||diasCalc<=0){setError('Indica los días correctamente');return;}
    setGuardando(true);setError('');
    try {
      await api.post('/api/solicitudes/historico',{
        empleado_id:empleadoId, fecha_inicio:form.tipo==='rango'?form.fecha_inicio:null,
        fecha_fin:form.tipo==='rango'?form.fecha_fin:null, dias:diasCalc,
        anio:form.anio, periodo_semestre:parseInt(form.periodo_semestre), notas:form.notas,
      });
      onGuardado();
    } catch(e){setError(e.response?.data?.error||'Error');}
    finally{setGuardando(false);}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{background:'linear-gradient(135deg,#4A0A1E,#E65100)'}}>
          <h2>📥 Registrar Días Históricos</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{padding:'10px 12px',background:'#FFF8E1',borderRadius:10,border:'1px solid #FFE082',fontSize:12,color:'#856404',fontWeight:600}}>
            📂 Registra vacaciones que ya ocurrieron antes de usar este sistema.
          </div>
          {error&&<div style={{padding:'10px 12px',background:'#FFEBEE',borderRadius:8,color:'#B71C1C',fontSize:12,fontWeight:600}}>⚠️ {error}</div>}
          <div style={{display:'flex',gap:8}}>
            {[{id:'rango',label:'📅 Por rango de fechas'},{id:'dias',label:'🔢 Solo número de días'}].map(t=>(
              <button key={t.id} onClick={()=>setForm({...form,tipo:t.id})}
                style={{flex:1,padding:'9px 6px',borderRadius:10,cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,
                  background:form.tipo===t.id?'var(--g)':'var(--g10)',border:`2px solid ${form.tipo===t.id?'var(--g)':'var(--g20)'}`,
                  color:form.tipo===t.id?'#fff':'var(--g60)'}}>
                {t.label}
              </button>
            ))}
          </div>
          {form.tipo==='rango' ? (
            <div className="form-grid">
              <div className="form-group"><label>Fecha de inicio</label><input type="date" className="form-control" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} /></div>
              <div className="form-group"><label>Fecha de fin</label><input type="date" className="form-control" value={form.fecha_fin} min={form.fecha_inicio} onChange={e=>setForm({...form,fecha_fin:e.target.value})} /></div>
              {diasCalc>0&&<div style={{gridColumn:'1/-1',background:'var(--g-soft)',borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:32,color:'var(--g)'}}>{diasCalc}</span>
                <span style={{fontSize:12,color:'var(--g60)',fontFamily:'Montserrat,sans-serif',fontWeight:600}}>días hábiles en ese rango</span>
              </div>}
            </div>
          ) : (
            <div className="form-group"><label>Número de días tomados</label><input type="number" className="form-control" min="1" placeholder="Ej: 5" value={form.dias} onChange={e=>setForm({...form,dias:e.target.value})} /></div>
          )}
          <div className="form-grid">
            <div className="form-group"><label>Año al que pertenecen</label>
              <select className="form-control" value={form.anio} onChange={e=>setForm({...form,anio:parseInt(e.target.value)})}>
                {[2022,2023,2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Periodo</label>
              <select className="form-control" value={form.periodo_semestre} onChange={e=>setForm({...form,periodo_semestre:e.target.value})}>
                <option value={1}>Periodo 1 — Enero a Junio</option>
                <option value={2}>Periodo 2 — Julio a Diciembre</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Notas</label><input className="form-control" placeholder="Ej: Vacaciones tomadas en mayo antes del sistema..." value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional filled btn-sm" onClick={guardar} disabled={guardando}>{guardando?'⏳...':'📥 Registrar'}</button>
        </div>
      </div>
    </div>
  );
}

function ModalEditarSolicitud({ solicitud, onClose, onGuardado }) {
  const [form, setForm] = useState({
    fecha_inicio:solicitud.fecha_inicio?.split('T')[0]||'',
    fecha_fin:solicitud.fecha_fin?.split('T')[0]||'',
    dias_solicitados:solicitud.dias_solicitados,
    anio:solicitud.anio,
    periodo_semestre:solicitud.periodo_semestre||1,
    motivo:solicitud.motivo||'',
    estatus:solicitud.estatus,
  });
  const [guardando,setGuardando]=useState(false);

  const guardar=async()=>{
    setGuardando(true);
    try{ await api.put(`/api/solicitudes/${solicitud.id}/editar`,form); onGuardado(); }
    catch(e){alert(e.response?.data?.error||'Error');}
    finally{setGuardando(false);}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>✏️ Editar Registro de Vacaciones</h2><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:12}}>
          <div className="form-grid">
            <div className="form-group"><label>Fecha de inicio</label><input type="date" className="form-control" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})}/></div>
            <div className="form-group"><label>Fecha de fin</label><input type="date" className="form-control" value={form.fecha_fin} onChange={e=>setForm({...form,fecha_fin:e.target.value})}/></div>
            <div className="form-group"><label>Número de días</label><input type="number" className="form-control" value={form.dias_solicitados} onChange={e=>setForm({...form,dias_solicitados:e.target.value})} min="1"/></div>
            <div className="form-group"><label>Año</label><input type="number" className="form-control" value={form.anio} onChange={e=>setForm({...form,anio:e.target.value})}/></div>
            <div className="form-group"><label>Periodo</label>
              <select className="form-control" value={form.periodo_semestre} onChange={e=>setForm({...form,periodo_semestre:e.target.value})}>
                <option value={1}>Periodo 1 — Enero a Junio</option>
                <option value={2}>Periodo 2 — Julio a Diciembre</option>
              </select>
            </div>
            <div className="form-group"><label>Estatus</label>
              <select className="form-control" value={form.estatus} onChange={e=>setForm({...form,estatus:e.target.value})}>
                <option value="aprobada">✅ Aprobada</option>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="rechazada">❌ Rechazada</option>
              </select>
            </div>
            <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notas o motivo</label><input className="form-control" value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})}/></div>
          </div>
          <div style={{padding:'9px 12px',background:'#FFF8E1',borderRadius:8,fontSize:11,color:'#856404',fontWeight:600}}>
            ⚠️ Si cambias el número de días, el periodo se ajustará automáticamente.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional filled btn-sm" onClick={guardar} disabled={guardando}>{guardando?'⏳...':'💾 Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
