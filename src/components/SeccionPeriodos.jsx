import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });
}

// Calcular periodos desde fecha de ingreso
function calcularPeriodos(fechaIngreso) {
  if (!fechaIngreso) return [];
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const periodos = [];
  let inicio = new Date(ingreso);
  let numPeriodo = 1;

  while (inicio <= hoy) {
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + 6);
    fin.setDate(fin.getDate() - 1);

    const completado = fin < hoy;
    const enCurso = !completado && inicio <= hoy;

    // Meses faltantes si está en curso
    let mesesFaltantes = 0;
    if (enCurso) {
      const finReal = new Date(inicio);
      finReal.setMonth(finReal.getMonth() + 6);
      mesesFaltantes = Math.ceil((finReal - hoy) / (1000 * 60 * 60 * 24 * 30));
    }

    periodos.push({
      numero: numPeriodo,
      fecha_inicio: new Date(inicio),
      fecha_fin: fin,
      completado,
      en_curso: enCurso,
      meses_faltantes: mesesFaltantes,
    });

    if (!completado && !enCurso) break;
    inicio = new Date(fin);
    inicio.setDate(inicio.getDate() + 1);
    numPeriodo++;
    if (numPeriodo > 30) break; // safety
  }

  return periodos;
}

export default function SeccionPeriodos({ empleadoInicial }) {
  const { usuario, rolEfectivo } = useAuth();
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
    api.get('/api/empleados').then(r => {
      setEmpleados(r.data);
      // Si viene empleado preseleccionado desde botón
      const idBuscar = empleadoInicial || (rolEfectivo === 'empleado' ? usuario?.empleado_id : null);
      if (idBuscar) {
        const emp = r.data.find(e => e.id === idBuscar);
        if (emp) seleccionarEmpleado(emp);
      }
    }).catch(console.error);
  }, [empleadoInicial]);

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

      <div style={{ display:'grid', gridTemplateColumns: rolEfectivo==='empleado' ? '1fr' : '280px 1fr', gap:20, alignItems:'start' }}>

        {/* Lista empleados — oculta para empleado */}
        {rolEfectivo !== 'empleado' && <div className="card" style={{ padding:0, overflow:'hidden', position:'sticky', top:80 }}>
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--g20)', background:'var(--g-soft)' }}>
            <input className="form-control" placeholder="🔍 Buscar empleado..." value={busqueda}
              onChange={e=>setBusqueda(e.target.value)} style={{ fontSize:13 }} />
          </div>
          <div style={{ maxHeight:'70vh', overflowY:'auto' }}>
            {filtrados.map(emp => (
              <div key={emp.id} onClick={()=>seleccionarEmpleado(emp)}
                style={{ padding:'11px 14px', cursor:'pointer', transition:'background 0.15s',
                  background: empleadoSel?.id===emp.id ? 'var(--g-soft)' : 'transparent',
                  borderLeft: empleadoSel?.id===emp.id ? '4px solid var(--g)' : '4px solid transparent',
                  borderBottom:'1px solid var(--g10)',
                  display:'flex', alignItems:'center', gap:10 }}>
                {emp.foto_url
                  ? <img src={emp.foto_url} alt="" style={{ width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--d)',flexShrink:0 }} />
                  : <div style={{ width:36,height:36,borderRadius:'50%',background:'var(--g10)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>👤</div>
                }
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,color:'var(--g)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                    {emp.apellido_paterno} {emp.nombre}
                  </div>
                  <div style={{ fontSize:10,color:'var(--g60)' }}>{emp.departamento||'—'}</div>
                </div>
                <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:'var(--g)',flexShrink:0 }}>
                  {emp.dias_disponibles??'—'}
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* Panel detalle */}
        <div>
          {!empleadoSel ? (
            <div style={{ textAlign:'center',padding:'80px 20px',color:'var(--g60)' }}>
              <div style={{ fontSize:64,marginBottom:16 }} className="float-anim">📅</div>
              <p style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:22,color:'var(--g)' }}>Selecciona un empleado</p>
              <p style={{ marginTop:8,fontSize:14 }}>Elige un empleado de la lista para ver su historial de periodos</p>
            </div>
          ) : cargando ? (
            <div className="loader-wrapper"><div className="loader"/></div>
          ) : datos ? (
            <DetallePeriodos
              empleado={empleadoSel}
              datos={datos}
              esAdmin={esAdmin}
              expandido={expandido}
              setExpandido={setExpandido}
              onRegistrarHistorico={()=>setModalHistorico(true)}
              onEditarSolicitud={s=>setModalEditSol(s)}
            />
          ) : null}
        </div>
      </div>

      {modalHistorico && empleadoSel && (
        <ModalHistorico empleadoId={empleadoSel.id} fechaIngreso={empleadoSel.fecha_ingreso} onClose={()=>setModalHistorico(false)} onGuardado={()=>{ recargar(); setModalHistorico(false); }} />
      )}
      {modalEditSol && (
        <ModalEditarSolicitud solicitud={modalEditSol} onClose={()=>setModalEditSol(null)} onGuardado={()=>{ recargar(); setModalEditSol(null); }} />
      )}
    </div>
  );
}

function DetallePeriodos({ empleado, datos, esAdmin, expandido, setExpandido, onRegistrarHistorico, onEditarSolicitud }) {
  const periodosTeoricos = calcularPeriodos(empleado.fecha_ingreso);
  const periodosCompletados = periodosTeoricos.filter(p => p.completado);
  const periodoEnCurso = periodosTeoricos.find(p => p.en_curso);
  const totalCorrespondidos = periodosCompletados.length * 10;

  // Mapear solicitudes aprobadas a periodos teóricos
  const todasSolicitudes = datos.periodos.flatMap(p => p.solicitudes || []);

  const getSolicitudesDelPeriodo = (periodoTeorico) => {
    return todasSolicitudes.filter(s => {
      if (!s.fecha_inicio) return false;
      const fechaSol = new Date(s.fecha_inicio);
      return fechaSol >= periodoTeorico.fecha_inicio && fechaSol <= periodoTeorico.fecha_fin;
    });
  };

  const getDiasTomdosPeriodo = (periodoTeorico) => {
    return getSolicitudesDelPeriodo(periodoTeorico).reduce((sum, s) => sum + (s.dias_solicitados||0), 0);
  };

  const totalTomados = datos.total_disponible !== undefined
    ? (totalCorrespondidos - datos.total_disponible)
    : todasSolicitudes.reduce((s,sol) => s + (sol.dias_solicitados||0), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header empleado */}
      <div className="card" style={{ padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          {empleado.foto_url
            ? <img src={empleado.foto_url} alt="" style={{ width:72,height:72,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--d)',flexShrink:0 }} />
            : <div style={{ width:72,height:72,borderRadius:'50%',background:'var(--g10)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,flexShrink:0 }}>👤</div>
          }
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:22,color:'var(--g)' }}>
              {empleado.nombre} {empleado.apellido_paterno}
            </div>
            <div style={{ fontSize:13,color:'var(--g60)',marginTop:2 }}>{empleado.puesto||'—'} · {empleado.departamento||'—'}</div>
            {empleado.fecha_ingreso && (
              <div style={{ marginTop:6,fontSize:13,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g)' }}>
                📆 Ingresó el {fmtFecha(empleado.fecha_ingreso)}
              </div>
            )}
          </div>
          <div style={{ textAlign:'center',padding:'14px 20px',background:'var(--g-soft)',borderRadius:14,border:'1px solid rgba(107,15,43,0.15)',flexShrink:0 }}>
            <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:44,color:'var(--g)',lineHeight:1 }}>{datos.total_disponible}</div>
            <div style={{ fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)',textTransform:'uppercase',marginTop:4 }}>días disponibles</div>
          </div>
        </div>

        {/* Resumen desde ingreso */}
        <div style={{ marginTop:16,padding:'14px 16px',background:'var(--g-soft)',borderRadius:12,border:'1px solid rgba(107,15,43,0.15)' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:'var(--g)',marginBottom:8 }}>
            📊 Desde tu ingreso el {fmtFecha(empleado.fecha_ingreso)}:
          </div>
          <div style={{ fontSize:14,color:'var(--g60)',lineHeight:1.8 }}>
            ✅ <strong style={{ color:'var(--g)' }}>{periodosCompletados.length} periodos completados</strong> de 6 meses cada uno<br/>
            📋 Te corresponden <strong style={{ color:'var(--g)' }}>{totalCorrespondidos} días en total</strong> ({periodosCompletados.length} × 10 días)<br/>
            🏖️ Has tomado <strong style={{ color:'var(--d-dk)' }}>{totalTomados} días</strong> de vacaciones<br/>
            ✨ Tienes <strong style={{ color:'#1B5E20' }}>{datos.total_disponible} días disponibles</strong>
          </div>
          {periodoEnCurso && (
            <div style={{ marginTop:10,padding:'8px 12px',background:'rgba(230,81,0,0.08)',borderRadius:8,border:'1px solid rgba(230,81,0,0.2)',fontSize:12,color:'#E65100',fontFamily:'Montserrat,sans-serif',fontWeight:700 }}>
              ⏳ Faltan {periodoEnCurso.meses_faltantes} mes{periodoEnCurso.meses_faltantes!==1?'es':''} para completar el Periodo {periodoEnCurso.numero} y acumular 10 días más
            </div>
          )}
        </div>

        {/* Desglose suma */}
        <div style={{ marginTop:12 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'var(--g)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:8 }}>
            Cómo se forman tus {totalCorrespondidos} días:
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6,alignItems:'center' }}>
            {periodosCompletados.map((p,i) => (
              <span key={i} style={{ display:'inline-flex',alignItems:'center',gap:4 }}>
                <span style={{ background:'var(--g)',color:'#fff',padding:'4px 10px',borderRadius:20,fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11 }}>
                  Periodo {p.numero} = 10 días
                </span>
                {i < periodosCompletados.length-1 && <span style={{ color:'var(--g60)',fontWeight:700,fontSize:16 }}>+</span>}
              </span>
            ))}
            {periodosCompletados.length > 1 && (
              <span style={{ color:'var(--g60)',fontWeight:700 }}>= <strong style={{ color:'var(--g)',fontSize:18 }}>{totalCorrespondidos}</strong> días</span>
            )}
          </div>
        </div>

        {esAdmin && (
          <div style={{ marginTop:14,paddingTop:14,borderTop:'1px solid var(--g20)' }}>
            <button className="btn-institucional filled btn-sm" onClick={onRegistrarHistorico}>
              📥 Registrar días históricos
            </button>
          </div>
        )}
      </div>

      {/* PERIODOS TEÓRICOS */}
      {periodosTeoricos.map((pt, i) => {
        const key = `periodo-${pt.numero}`;
        const abierto = expandido[key] !== false;
        const solicitudesPeriodo = getSolicitudesDelPeriodo(pt);
        const diasTomados = getDiasTomdosPeriodo(pt);
        const diasDisp = pt.completado ? (10 - diasTomados) : 0;

        return (
          <div key={key} style={{ borderRadius:16, border:`1.5px solid ${pt.completado?'var(--g20)':pt.en_curso?'rgba(230,81,0,0.3)':'var(--g20)'}`, overflow:'hidden' }}>

            {/* Header */}
            <div onClick={()=>setExpandido(e=>({...e,[key]:!abierto}))}
              style={{ padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                background: pt.en_curso ? 'rgba(230,81,0,0.06)' : abierto ? 'var(--g-soft)' : 'var(--g10)' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                  <span style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:15,color: pt.en_curso?'#E65100':'var(--g)' }}>
                    Periodo {pt.numero}
                  </span>
                  <span style={{ fontSize:12,color:'var(--g60)' }}>
                    {fmtFecha(pt.fecha_inicio)} — {fmtFecha(pt.fecha_fin)}
                  </span>
                  <span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:800,
                    background: pt.completado?'#E8F5E9':pt.en_curso?'rgba(230,81,0,0.1)':'var(--g10)',
                    color: pt.completado?'#1B5E20':pt.en_curso?'#E65100':'var(--g60)',
                    border: `1px solid ${pt.completado?'#C8E6C9':pt.en_curso?'rgba(230,81,0,0.3)':'var(--g20)'}` }}>
                    {pt.completado ? '✅ Completado' : pt.en_curso ? `⏳ En curso — faltan ${pt.meses_faltantes} mes${pt.meses_faltantes!==1?'es':''}` : '⏸️ Próximo'}
                  </span>
                </div>
                {pt.completado && (
                  <div style={{ fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:600,color:'var(--g60)' }}>
                    10 días correspondieron · {diasTomados} tomados · {diasDisp} disponibles
                  </div>
                )}
                {pt.en_curso && (
                  <div style={{ fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#E65100' }}>
                    Aún no se acumulan días — completa el periodo para ganar 10 días
                  </div>
                )}
              </div>
              {pt.completado && (
                <div style={{ textAlign:'center',flexShrink:0 }}>
                  <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:28,color:diasDisp>0?'#1B5E20':'#B71C1C',lineHeight:1 }}>{diasDisp}</div>
                  <div style={{ fontSize:9,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)',textTransform:'uppercase' }}>disponibles</div>
                </div>
              )}
              <span style={{ fontSize:18,transition:'transform 0.3s',transform:abierto?'rotate(180deg)':'rotate(0deg)',color:'var(--g)' }}>▾</span>
            </div>

            {/* Cuerpo */}
            {abierto && (
              <div style={{ padding:'16px 20px',background:'var(--w)',display:'flex',flexDirection:'column',gap:12 }}>

                {pt.completado ? (
                  <>
                    {/* Stats */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                      {[
                        { label:'Días acumulados en este periodo',value:10,color:'var(--g)',icon:'📋' },
                        { label:'Días de vacaciones tomados',value:diasTomados,color:'var(--d-dk)',icon:'🏖️' },
                        { label:'Días disponibles que quedan',value:diasDisp,color:diasDisp>0?'#1B5E20':'#B71C1C',icon:'✅' },
                      ].map(({ label,value,color,icon }) => (
                        <div key={label} style={{ textAlign:'center',padding:'12px 8px',background:'var(--g10)',borderRadius:12 }}>
                          <div style={{ fontSize:18,marginBottom:4 }}>{icon}</div>
                          <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:32,color,lineHeight:1 }}>{value}</div>
                          <div style={{ fontSize:9,color:'var(--g60)',fontFamily:'Montserrat,sans-serif',fontWeight:700,marginTop:5,lineHeight:1.4 }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Vacaciones en este periodo */}
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'var(--g)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:8 }}>
                        Vacaciones tomadas en este periodo:
                      </div>
                      {solicitudesPeriodo.length > 0 ? (
                        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                          {solicitudesPeriodo.map(s => (
                            <div key={s.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,
                              background: s.es_historico?'rgba(230,81,0,0.05)':'var(--g-soft)',
                              border:`1.5px solid ${s.es_historico?'rgba(230,81,0,0.2)':'rgba(107,15,43,0.12)'}`,flexWrap:'wrap' }}>
                              <span style={{ fontSize:20,flexShrink:0 }}>{s.es_historico?'📂':'✅'}</span>
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
                                  onClick={()=>onEditarSolicitud(s)}>✏️ Editar</button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign:'center',padding:'14px',color:'var(--g60)',background:'var(--g10)',borderRadius:10,fontSize:13 }}>
                          No hay vacaciones registradas en este periodo
                        </div>
                      )}
                    </div>

                    {/* Nota */}
                    <div style={{ padding:'10px 14px',background:'#E8F5E9',borderRadius:10,border:'1px solid #C8E6C9',fontSize:12,color:'#1B5E20',fontFamily:'Montserrat,sans-serif',fontWeight:600 }}>
                      ℹ️ Periodo {pt.numero} del {fmtFecha(pt.fecha_inicio)} al {fmtFecha(pt.fecha_fin)}.
                      Te correspondieron <strong>10 días</strong>, tomaste <strong>{diasTomados} días</strong> y tienes <strong>{diasDisp} días disponibles</strong>.
                    </div>
                  </>
                ) : pt.en_curso ? (
                  <div style={{ padding:'16px',background:'rgba(230,81,0,0.06)',borderRadius:12,border:'1px solid rgba(230,81,0,0.2)',textAlign:'center' }}>
                    <div style={{ fontSize:40,marginBottom:10 }}>⏳</div>
                    <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#E65100',marginBottom:6 }}>
                      Periodo en curso
                    </div>
                    <div style={{ fontSize:13,color:'var(--g60)',lineHeight:1.6 }}>
                      Este periodo va del <strong>{fmtFecha(pt.fecha_inicio)}</strong> al <strong>{fmtFecha(pt.fecha_fin)}</strong>.<br/>
                      Faltan <strong style={{ color:'#E65100' }}>{pt.meses_faltantes} mes{pt.meses_faltantes!==1?'es':''}</strong> para completarlo y acumular <strong>10 días más</strong>.
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function calcularPeriodosReales(fechaIngreso) {
  if (!fechaIngreso) return [];
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const periodos = [];
  let inicio = new Date(ingreso);
  let num = 1;
  while (inicio <= hoy && num <= 20) {
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + 6);
    fin.setDate(fin.getDate() - 1);
    // Solo agregar periodos COMPLETADOS (no el que está en curso)
    if (fin < hoy) {
      periodos.push({
        numero: num,
        inicio: new Date(inicio),
        fin: new Date(fin),
        label: `Periodo ${num}: ${inicio.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})} — ${fin.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}`,
      });
    }
    inicio = new Date(fin);
    inicio.setDate(inicio.getDate() + 1);
    num++;
  }
  return periodos;
}

function ModalHistorico({ empleadoId, fechaIngreso, onClose, onGuardado }) {
  const periodosReales = calcularPeriodosReales(fechaIngreso);
  const [form, setForm] = useState({ tipo:'rango', fecha_inicio:'', fecha_fin:'', dias:'', periodo_idx:0, notas:'' });
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
      const periodoSel = periodosReales[parseInt(form.periodo_idx)];
      await api.post('/api/solicitudes/historico',{
        empleado_id:empleadoId,
        fecha_inicio:form.tipo==='rango'?form.fecha_inicio: periodoSel?.inicio?.toISOString().split('T')[0],
        fecha_fin:form.tipo==='rango'?form.fecha_fin: periodoSel?.fin?.toISOString().split('T')[0],
        dias:diasCalc,
        anio: periodoSel ? periodoSel.inicio.getFullYear() : new Date().getFullYear(),
        periodo_semestre: periodoSel ? ((periodoSel.numero % 2 === 1) ? 1 : 2) : 1,
        periodo_inicio: periodoSel ? periodoSel.inicio.toISOString().split('T')[0] : null,
        periodo_fin: periodoSel ? periodoSel.fin.toISOString().split('T')[0] : null,
        notas:form.notas,
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
          <div className="form-group">
            <label>¿A qué periodo pertenecen estos días?</label>
            {periodosReales.length > 0 ? (
              <select className="form-control" value={form.periodo_idx} onChange={e=>setForm({...form,periodo_idx:e.target.value})}>
                {periodosReales.map((p,i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize:12,color:'var(--g60)',padding:'10px',background:'var(--g10)',borderRadius:8 }}>
                Sin fecha de ingreso registrada
              </div>
            )}
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
            <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notas o motivo</label><input className="form-control" value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})}/></div>
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
