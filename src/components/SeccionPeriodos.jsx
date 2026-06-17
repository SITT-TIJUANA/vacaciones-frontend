import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmtFecha(f) {
  if (!f) return '—';
  // Parsear como fecha local para evitar offset de timezone
  const [y,m,d] = f.substring(0,10).split('-');
  return new Date(parseInt(y), parseInt(m)-1, parseInt(d)).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' });
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

  const eliminarHistorico = async (id) => {
    if (!window.confirm('¿Eliminar este registro histórico?')) return;
    try {
      await api.delete(`/api/solicitudes/manual/${id}`);
      recargar();
    } catch(e) { alert(e.response?.data?.error || 'Error al eliminar'); }
  };

  const eliminarVacacion = async (id) => {
    if (!window.confirm('¿Eliminar este registro de vacaciones?')) return;
    try {
      await api.delete(`/api/solicitudes/${id}`);
      recargar();
    } catch(e) { alert(e.response?.data?.error || 'Error al eliminar'); }
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
          ) : datos?.es_asimilable ? (
            <div style={{ textAlign:'center', padding:48 }}>
              <div style={{ fontSize:56, marginBottom:16 }}>📋</div>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:24, color:'var(--g)', marginBottom:10 }}>Personal Asimilable</div>
              <div style={{ fontSize:14, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', maxWidth:400, margin:'0 auto', lineHeight:1.6 }}>
                <strong>{empleadoSel?.nombre} {empleadoSel?.apellido_paterno}</strong> es personal asimilable.<br/>No aplican períodos de vacaciones según la modalidad de contratación vigente.
              </div>
            </div>
          ) : datos ? (
            <DetallePeriodos
              empleado={empleadoSel}
              datos={datos}
              esAdmin={esAdmin}
              expandido={expandido}
              setExpandido={setExpandido}
              onRegistrarHistorico={()=>setModalHistorico(true)}
              onEditarSolicitud={s=>setModalEditSol(s)}
              onEliminarSolicitud={eliminarVacacion}
              onEliminarHistorico={eliminarHistorico}
            />
          ) : null}
        </div>
      </div>

      {modalHistorico && empleadoSel && (
        <ModalHistorico empleadoId={empleadoSel.id} onClose={()=>setModalHistorico(false)} onGuardado={()=>{ recargar(); setModalHistorico(false); }} />
      )}
      {modalEditSol && (
        <ModalEditarSolicitud solicitud={modalEditSol} onClose={()=>setModalEditSol(null)} onGuardado={()=>{ recargar(); setModalEditSol(null); }} />
      )}
    </div>
  );
}

function DetallePeriodos({ empleado, datos, esAdmin, expandido, setExpandido, onRegistrarHistorico, onEditarSolicitud, onEliminarSolicitud, onEliminarHistorico }) {
  // Usar directamente los periodos del backend (ya calculados correctamente)
  const periodos = datos.periodos || [];
  const periodoEnCurso = periodos.find(p => p.en_curso);
  const periodosCompletados = periodos.filter(p => p.completado);
  const totalCorrespondidos = periodosCompletados.length * 10;

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

        {/* Resumen */}
        <div style={{ marginTop:16,padding:'14px 16px',background:'var(--g-soft)',borderRadius:12,border:'1px solid rgba(107,15,43,0.15)' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:'var(--g)',marginBottom:8 }}>
            📊 Desde tu ingreso el {fmtFecha(empleado.fecha_ingreso)}:
          </div>
          <div style={{ fontSize:14,color:'var(--g60)',lineHeight:1.8 }}>
            ✅ <strong style={{ color:'var(--g)' }}>{periodosCompletados.length} periodos completados</strong> de 6 meses cada uno<br/>
            📋 Te corresponden <strong style={{ color:'var(--g)' }}>{totalCorrespondidos} días en total</strong><br/>
            🏖️ Has tomado <strong style={{ color:'var(--d-dk)' }}>{totalCorrespondidos - datos.total_disponible} días</strong> de vacaciones<br/>
            ✨ Tienes <strong style={{ color:'#1B5E20' }}>{datos.total_disponible} días disponibles</strong>
          </div>
          {periodoEnCurso && (
            <div style={{ marginTop:10,padding:'8px 12px',background:'rgba(230,81,0,0.08)',borderRadius:8,border:'1px solid rgba(230,81,0,0.2)',fontSize:12,color:'#E65100',fontFamily:'Montserrat,sans-serif',fontWeight:700 }}>
              ⏳ Faltan {periodoEnCurso.meses_faltantes} mes{periodoEnCurso.meses_faltantes!==1?'es':''} para completar el Periodo {periodoEnCurso.numero} y acumular 10 días más
            </div>
          )}
        </div>

        {esAdmin && (
          <div style={{ marginTop:14,paddingTop:14,borderTop:'1px solid var(--g20)' }}>
            <button className="btn-institucional filled btn-sm" onClick={onRegistrarHistorico}>
              ➕ Agregar vacaciones manualmente
            </button>
          </div>
        )}
      </div>

      {/* HISTORIAL COMPLETO CRONOLÓGICO */}
      {(() => {
        // Juntar solicitudes aprobadas + manuales de todos los periodos
        const todasVacaciones = [];
        periodos.forEach(p => {
          (p.solicitudes||[]).forEach(s => todasVacaciones.push({
            fecha_inicio: s.fecha_inicio,
            fecha_fin: s.fecha_fin,
            dias: s.dias_solicitados,
            tipo: 'aprobada',
            aprobado_por: s.aprobado_por_username,
            notas: s.motivo || '',
            id: s.id,
            periodo: p.numero,
          }));
          (p.manuales||[]).forEach(m => todasVacaciones.push({
            fecha_inicio: m.fecha_inicio,
            fecha_fin: m.fecha_fin,
            dias: m.dias,
            tipo: 'manual',
            aprobado_por: m.registrado_por_username,
            notas: m.notas || '',
            id: m.id,
            periodo: p.numero,
          }));
        });
        // Ordenar por fecha
        todasVacaciones.sort((a,b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

        if (!todasVacaciones.length) return null;

        return (
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'var(--g)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
              📋 Historial completo de vacaciones
              <span style={{ background:'var(--g)', color:'#fff', fontSize:11, padding:'2px 10px', borderRadius:20, fontWeight:700 }}>{todasVacaciones.length} registros</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {todasVacaciones.map((v, i) => (
                <div key={v.id||i} style={{
                  display:'flex', alignItems:'flex-start', gap:14, padding:'14px 16px',
                  borderRadius:12, flexWrap:'wrap',
                  background: v.tipo==='manual' ? 'rgba(230,81,0,0.04)' : 'var(--g-soft)',
                  border: `1.5px solid ${v.tipo==='manual' ? 'rgba(230,81,0,0.18)' : 'rgba(107,15,43,0.12)'}`,
                }}>
                  {/* Número */}
                  <div style={{ width:28, height:28, borderRadius:'50%', background: v.tipo==='manual'?'#E65100':'var(--g)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, flexShrink:0 }}>
                    {i+1}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color: v.tipo==='manual'?'#E65100':'var(--g)', marginBottom:4 }}>
                      {v.fecha_inicio
                        ? `${fmtFecha(v.fecha_inicio)}${v.fecha_fin && v.fecha_fin.substring(0,10)!==v.fecha_inicio.substring(0,10) ? ` al ${fmtFecha(v.fecha_fin)}` : ''}`
                        : 'Sin fecha registrada'
                      }
                    </div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', fontSize:12, color:'var(--g60)' }}>
                      <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color: v.tipo==='manual'?'#E65100':'var(--g)' }}>
                        {v.dias} {v.dias===1?'día':'días'} hábiles
                      </span>
                      <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif',
                        background: v.tipo==='manual'?'rgba(230,81,0,0.1)':'#E8F5E9',
                        color: v.tipo==='manual'?'#E65100':'#1B5E20',
                        border: `1px solid ${v.tipo==='manual'?'rgba(230,81,0,0.2)':'#C8E6C9'}` }}>
                        {v.tipo==='manual' ? '📂 Manual' : '✅ Solicitud aprobada'}
                      </span>
                      <span>Periodo {v.periodo}</span>
                      {v.aprobado_por && <span>{v.tipo==='manual'?'Registrado':'Aprobado'} por: {v.aprobado_por}</span>}
                    </div>
                    {v.notas && <div style={{ fontSize:11, color:'var(--g60)', marginTop:4, fontStyle:'italic' }}>💬 {v.notas}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* PERIODOS */}
      {periodos.length === 0 ? (
        <div style={{ textAlign:'center',padding:40,color:'var(--g60)' }} className="card">
          <div style={{ fontSize:48,marginBottom:12 }}>📅</div>
          <p style={{ fontFamily:'Montserrat,sans-serif',fontWeight:700 }}>Sin periodos registrados</p>
          <p style={{ fontSize:12,marginTop:6 }}>Verifica que el empleado tenga fecha de ingreso registrada</p>
        </div>
      ) : (
        periodos.map(p => {
          const key = `periodo-${p.numero}`;
          const abierto = expandido[key] !== false;
          const pct = p.dias_correspondientes > 0 ? Math.round((p.dias_tomados/p.dias_correspondientes)*100) : 0;
          const todasVacaciones = [
            ...(p.solicitudes||[]).map(s => ({ ...s, tipo:'sistema' })),
            ...(p.manuales||[]).map(h => ({ ...h, tipo:'historico' })),
          ].sort((a,b) => new Date(a.fecha_inicio||0) - new Date(b.fecha_inicio||0));

          return (
            <div key={key} style={{ borderRadius:16, border:`1.5px solid ${p.completado?'var(--g20)':p.en_curso?'rgba(230,81,0,0.3)':'var(--g20)'}`, overflow:'hidden' }}>

              {/* Header */}
              <div onClick={()=>setExpandido(e=>({...e,[key]:!abierto}))}
                style={{ padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                  background: p.en_curso?'rgba(230,81,0,0.06)':abierto?'var(--g-soft)':'var(--g10)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4 }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:15,color:p.en_curso?'#E65100':'var(--g)' }}>
                      Periodo {p.numero}
                    </span>
                    <span style={{ fontSize:12,color:'var(--g60)' }}>
                      {fmtFecha(p.fecha_inicio)} — {fmtFecha(p.fecha_fin)}
                    </span>
                    <span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:800,
                      background:p.completado?'#E8F5E9':p.en_curso?'rgba(230,81,0,0.1)':'var(--g10)',
                      color:p.completado?'#1B5E20':p.en_curso?'#E65100':'var(--g60)',
                      border:`1px solid ${p.completado?'#C8E6C9':p.en_curso?'rgba(230,81,0,0.3)':'var(--g20)'}` }}>
                      {p.completado ? '✅ Completado' : p.en_curso ? `⏳ En curso — faltan ${p.meses_faltantes} mes${p.meses_faltantes!==1?'es':''}` : '⏸️ Próximo'}
                    </span>
                  </div>
                  {p.completado && (
                    <div style={{ fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:600,color:'var(--g60)' }}>
                      10 días correspondieron · {p.dias_tomados} tomados · {p.dias_disponibles} disponibles
                    </div>
                  )}
                  {p.en_curso && (
                    <div style={{ fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#E65100' }}>
                      Aún no se acumulan días — completa el periodo para ganar 10 días
                    </div>
                  )}
                </div>
                {p.completado && (
                  <div style={{ textAlign:'center',flexShrink:0 }}>
                    <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:28,color:p.dias_disponibles>0?'#1B5E20':'#B71C1C',lineHeight:1 }}>{p.dias_disponibles}</div>
                    <div style={{ fontSize:9,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)',textTransform:'uppercase' }}>disponibles</div>
                  </div>
                )}
                <span style={{ fontSize:18,transition:'transform 0.3s',transform:abierto?'rotate(180deg)':'rotate(0deg)',color:'var(--g)' }}>▾</span>
              </div>

              {/* Cuerpo */}
              {abierto && (
                <div style={{ padding:'16px 20px',background:'var(--w)',display:'flex',flexDirection:'column',gap:14 }}>
                  {p.completado ? (
                    <>
                      {/* Stats 3 columnas */}
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                        {[
                          { label:'Días acumulados en este periodo',value:p.dias_correspondientes,color:'var(--g)',icon:'📋' },
                          { label:'Días de vacaciones tomados',value:p.dias_tomados,color:'var(--d-dk)',icon:'🏖️' },
                          { label:'Días disponibles que quedan',value:p.dias_disponibles,color:p.dias_disponibles>0?'#1B5E20':'#B71C1C',icon:'✅' },
                        ].map(({ label,value,color,icon }) => (
                          <div key={label} style={{ textAlign:'center',padding:'12px 8px',background:'var(--g10)',borderRadius:12 }}>
                            <div style={{ fontSize:18,marginBottom:4 }}>{icon}</div>
                            <div style={{ fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:32,color,lineHeight:1 }}>{value}</div>
                            <div style={{ fontSize:9,color:'var(--g60)',fontFamily:'Montserrat,sans-serif',fontWeight:700,marginTop:5,lineHeight:1.4 }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Vacaciones */}
                      <div>
                        <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'var(--g)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:8 }}>
                          Vacaciones tomadas en este periodo:
                        </div>
                        {todasVacaciones.length > 0 ? (
                          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                            {todasVacaciones.map((v, i) => (
                              <div key={v.id||i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,
                                background: v.tipo==='historico'?'rgba(230,81,0,0.05)':'var(--g-soft)',
                                border:`1.5px solid ${v.tipo==='historico'?'rgba(230,81,0,0.2)':'rgba(107,15,43,0.12)'}`,flexWrap:'wrap' }}>
                                <span style={{ fontSize:18,flexShrink:0 }}>{v.tipo==='historico'?'📂':'✅'}</span>
                                <div style={{ flex:1,minWidth:140 }}>
                                  <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:v.tipo==='historico'?'#E65100':'var(--g)' }}>
                                    {fmtFecha(v.fecha_inicio)}{(v.fecha_fin && v.fecha_fin !== v.fecha_inicio) ? ` → ${fmtFecha(v.fecha_fin)}` : ''}
                                  </div>
                                  <div style={{ fontSize:11,color:'var(--g60)',marginTop:3,display:'flex',gap:10,flexWrap:'wrap' }}>
                                    <strong style={{ color:v.tipo==='historico'?'#E65100':'var(--g)' }}>
                                      {v.tipo==='historico' ? v.dias : v.dias_solicitados} días
                                    </strong>
                                    {v.tipo==='historico' && <span style={{ color:'#E65100',fontWeight:700 }}>Histórico</span>}
                                    {v.aprobado_por_username && <span>Aprobado por: {v.aprobado_por_username}</span>}
                                    {v.registrado_por_username && <span>Registrado por: {v.registrado_por_username}</span>}
                                    {(v.motivo||v.notas) && <span>💬 {v.motivo||v.notas}</span>}
                                  </div>
                                </div>
                                {esAdmin && (
                                  <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                                    {v.tipo==='sistema' && (
                                      <button className="btn-institucional dorado btn-sm" style={{ fontSize:10 }}
                                        onClick={()=>onEditarSolicitud(v)}>✏️</button>
                                    )}
                                    <button className="btn-institucional peligro btn-sm" style={{ fontSize:10 }}
                                      onClick={()=>v.tipo==='historico'?onEliminarHistorico(v.id):onEliminarSolicitud(v.id)}>🗑️</button>
                                  </div>
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
                        ℹ️ Periodo {p.numero} del {fmtFecha(p.fecha_inicio)} al {fmtFecha(p.fecha_fin)}.
                        Te correspondieron <strong>10 días</strong>, tomaste <strong>{p.dias_tomados} días</strong> y tienes <strong>{p.dias_disponibles} días disponibles</strong>.
                      </div>
                    </>
                  ) : p.en_curso ? (
                    <div style={{ padding:'16px',background:'rgba(230,81,0,0.06)',borderRadius:12,border:'1px solid rgba(230,81,0,0.2)',textAlign:'center' }}>
                      <div style={{ fontSize:40,marginBottom:10 }}>⏳</div>
                      <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#E65100',marginBottom:6 }}>Periodo en curso</div>
                      <div style={{ fontSize:13,color:'var(--g60)',lineHeight:1.6 }}>
                        Del <strong>{fmtFecha(p.fecha_inicio)}</strong> al <strong>{fmtFecha(p.fecha_fin)}</strong>.<br/>
                        Faltan <strong style={{ color:'#E65100' }}>{p.meses_faltantes} mes{p.meses_faltantes!==1?'es':''}</strong> para completarlo y acumular <strong>10 días más</strong>.
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })
      )}
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

function ModalHistorico({ empleadoId, onClose, onGuardado }) {
  const [form, setForm] = useState({ fecha_inicio:'', fecha_fin:'', dias:'', notas:'' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const calcDias = () => {
    if (!form.fecha_inicio || !form.fecha_fin) return 0;
    // Usar split para evitar problema de zona horaria
    const [iy,im,id] = form.fecha_inicio.split('-').map(Number);
    const [fy,fm,fd] = form.fecha_fin.split('-').map(Number);
    const ini = new Date(iy, im-1, id);
    const fin = new Date(fy, fm-1, fd);
    if (fin < ini) return 0;
    let d = 0; const c = new Date(ini);
    while (c <= fin) { if (c.getDay()!==0&&c.getDay()!==6) d++; c.setDate(c.getDate()+1); }
    return d;
  };

  // Si ponen fecha inicio y fin, calculamos días. Si no, usan el campo manual
  const diasCalc = form.fecha_inicio && form.fecha_fin ? calcDias() : parseInt(form.dias||0);

  const guardar = async () => {
    if (!form.fecha_inicio) { setError('La fecha de inicio es obligatoria'); return; }
    if (!form.fecha_fin) { setForm(f => ({...f, fecha_fin: form.fecha_inicio})); }
    if (!diasCalc || diasCalc <= 0) { setError('Indica los días correctamente'); return; }
    setGuardando(true); setError('');
    try {
      await api.post('/api/solicitudes/manual', {
        empleado_id: empleadoId,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin && form.fecha_fin.trim()!=='' ? form.fecha_fin : form.fecha_inicio,
        dias: diasCalc,
        notas: form.notas,
      });
      onGuardado();
    } catch(e) { setError(e.response?.data?.error || 'Error al registrar'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{background:'linear-gradient(135deg,#4A0A1E,#E65100)'}}>
          <h2>📥 Registrar Vacaciones Pasadas</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{padding:'10px 12px',background:'#FFF8E1',borderRadius:10,border:'1px solid #FFE082',fontSize:12,color:'#856404',fontWeight:600}}>
            📂 Registra vacaciones que ya ocurrieron antes de usar este sistema. Los días se descontarán automáticamente del periodo más viejo al más nuevo.
          </div>
          {error && <div style={{padding:'10px 12px',background:'#FFEBEE',borderRadius:8,color:'#B71C1C',fontSize:12,fontWeight:600}}>⚠️ {error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label>Fecha de inicio *</label>
              <input type="date" className="form-control" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Fecha de fin *</label>
              <input type="date" className="form-control" value={form.fecha_fin} min={form.fecha_inicio} onChange={e=>setForm({...form,fecha_fin:e.target.value})} />
            </div>
          </div>

          {form.fecha_inicio && form.fecha_fin && diasCalc > 0 ? (
            <div style={{background:'var(--g-soft)',borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:32,color:'var(--g)'}}>{diasCalc}</span>
              <span style={{fontSize:12,color:'var(--g60)',fontFamily:'Montserrat,sans-serif',fontWeight:600}}>días hábiles calculados automáticamente</span>
            </div>
          ) : (
            <div className="form-group">
              <label>Número de días tomados *</label>
              <input type="number" className="form-control" min="1" placeholder="Ej: 5" value={form.dias} onChange={e=>setForm({...form,dias:e.target.value})} />
            </div>
          )}

          <div className="form-group">
            <label>Notas (opcional)</label>
            <input className="form-control" placeholder="Ej: Vacaciones mayo 2025..." value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} />
          </div>
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
