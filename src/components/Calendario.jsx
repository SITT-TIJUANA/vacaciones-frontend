import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}

export default function Calendario() {
  const { usuario, rolEfectivo } = useAuth();
  const esEmpleado = rolEfectivo === 'empleado';
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    setCargando(true);
    api.get(`/api/calendario?mes=${mes}&anio=${anio}`)
      .then(r => {
        const data = esEmpleado && usuario?.empleado_id
          ? r.data.filter(e => e.empleado_id === usuario.empleado_id)
          : r.data;
        setEventos(data);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [mes, anio, esEmpleado]);

  const cambiarMes = (delta) => {
    let m = mes + delta;
    let a = anio;
    if (m > 12) { m = 1; a++; }
    if (m < 1)  { m = 12; a--; }
    setMes(m); setAnio(a);
  };

  const primerDia = new Date(anio, mes - 1, 1).getDay();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const celdas = Array(primerDia).fill(null).concat(
    Array.from({ length: diasEnMes }, (_, i) => i + 1)
  );
  while (celdas.length % 7 !== 0) celdas.push(null);

  const getEventosDia = (dia) => {
    if (!dia) return [];
    const fecha = new Date(anio, mes - 1, dia);
    return eventos.filter(e => {
      const inicio = new Date(e.fecha_inicio);
      const fin = new Date(e.fecha_fin);
      inicio.setHours(0,0,0,0); fin.setHours(23,59,59,999);
      return fecha >= inicio && fecha <= fin;
    });
  };

  const esHoy = (dia) => {
    if (!dia) return false;
    return dia === hoy.getDate() && mes === hoy.getMonth()+1 && anio === hoy.getFullYear();
  };

  const estaDeVacaciones = (evento) => {
    const ini = new Date(evento.fecha_inicio); ini.setHours(0,0,0,0);
    const fin = new Date(evento.fecha_fin); fin.setHours(23,59,59,999);
    return hoy >= ini && hoy <= fin;
  };

  // Iniciales del nombre
  const getIniciales = (nombre, apellido) => {
    return `${(nombre||'?')[0]}${(apellido||'?')[0]}`.toUpperCase();
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Calendario de Vacaciones</h2>
      </div>

      <div className="card" style={{ marginBottom:24, padding:'20px 20px 16px' }}>

        {/* Navegación mes */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <button className="btn-institucional btn-sm" onClick={() => cambiarMes(-1)}>← Anterior</button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:26, color:'var(--g)', lineHeight:1 }}>
              {MESES[mes-1]}
            </div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'var(--g60)', marginTop:2 }}>{anio}</div>
          </div>
          <button className="btn-institucional btn-sm" onClick={() => cambiarMes(1)}>Siguiente →</button>
        </div>

        {/* Leyenda visual */}
        <div className="cal-leyenda" style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#C9A84C,#E0C46A)', border:'2px solid #A8883A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>✈️</div>
            <span style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>Próximo (aprobado)</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#27ae60,#2ecc71)', border:'2px solid #1a9950', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🏖️</div>
            <span style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>De vacaciones hoy</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,var(--g),var(--g-dk))', border:'2px solid var(--d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:900 }}>Hoy</div>
            <span style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>Día actual</span>
          </div>
        </div>

        {cargando ? (
          <div className="loader-wrapper" style={{ minHeight:200 }}><div className="loader" /></div>
        ) : (
          <>
            {/* Headers días */}
            <div className="cal-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:3 }}>
              {DIAS_SEMANA.map(d => (
                <div key={d} className="cal-header-dia" style={{ textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'var(--g)', padding:'7px 2px', textTransform:'uppercase', letterSpacing:'0.3px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas */}
            <div className="cal-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
              {celdas.map((dia, i) => {
                const eventosHoy = getEventosDia(dia);
                const esHoyDia = esHoy(dia);
                const tieneActivos = eventosHoy.some(e => estaDeVacaciones(e));
                const tieneProximos = eventosHoy.some(e => !estaDeVacaciones(e));

                return (
                  <div key={i}
                    className="cal-celda"
                    onClick={() => dia && eventosHoy.length > 0 && setSeleccionado({ dia, eventos: eventosHoy })}
                    style={{
                      minHeight: 76,
                      borderRadius: 10,
                      padding: '5px 4px 4px',
                      background: dia
                        ? tieneActivos ? 'rgba(39,174,96,0.08)'
                        : tieneProximos ? 'rgba(201,168,76,0.08)'
                        : esHoyDia ? 'rgba(107,15,43,0.06)'
                        : 'var(--w-off)'
                        : 'transparent',
                      border: dia
                        ? tieneActivos ? '1.5px solid rgba(39,174,96,0.4)'
                        : tieneProximos ? '1.5px solid rgba(201,168,76,0.4)'
                        : esHoyDia ? '2px solid var(--g)'
                        : '1px solid var(--g20)'
                        : 'none',
                      cursor: eventosHoy.length > 0 ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    {dia && (
                      <>
                        {/* Número del día */}
                        <div className="cal-dia-num" style={{
                          fontFamily:'Montserrat,sans-serif',
                          fontWeight: esHoyDia ? 900 : 600,
                          fontSize: 12,
                          color: esHoyDia ? '#fff' : 'var(--txt)',
                          marginBottom: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          {esHoyDia ? (
                            <span style={{ background:'var(--g)', color:'#fff', width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900 }}>{dia}</span>
                          ) : (
                            <span style={{ color: tieneActivos?'#155724':tieneProximos?'#856404':'var(--txt)' }}>{dia}</span>
                          )}
                        </div>

                        {/* Fotos/avatares de empleados */}
                        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                          {eventosHoy.slice(0,2).map((ev, j) => {
                            const activo = estaDeVacaciones(ev);
                            return (
                              <div key={j} style={{
                                display:'flex', alignItems:'center', gap:3,
                                background: activo ? 'rgba(39,174,96,0.15)' : 'rgba(201,168,76,0.15)',
                                borderRadius:20,
                                padding:'2px 4px 2px 2px',
                              }}>
                                {/* Foto o iniciales — animación 3D */}
                                {ev.foto_url ? (
                                  <img src={ev.foto_url} alt=""
                                    className={activo ? 'cal-foto-activo' : 'cal-foto-proximo'}
                                    style={{ width:18, height:18, borderRadius:'50%', objectFit:'cover',
                                      border:`1.5px solid ${activo?'#27ae60':'#C9A84C'}`, flexShrink:0 }} />
                                ) : (
                                  <div
                                    className={activo ? 'cal-foto-activo' : 'cal-foto-proximo'}
                                    style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                                      background: activo?'#27ae60':'#C9A84C',
                                      display:'flex', alignItems:'center', justifyContent:'center',
                                      fontSize:7, fontWeight:900, color:'#fff', fontFamily:'Montserrat,sans-serif' }}>
                                    {getIniciales(ev.nombre, ev.apellido_paterno)}
                                  </div>
                                )}
                                {/* Icono estado */}
                                <span style={{ fontSize:9 }}>{activo ? '🏖️' : '✈️'}</span>
                              </div>
                            );
                          })}
                          {eventosHoy.length > 2 && (
                            <div style={{ fontSize:9, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:700, textAlign:'center' }}>
                              +{eventosHoy.length-2} más
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Lista visual de vacaciones del mes */}
      {eventos.length > 0 && (
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)', marginBottom:16 }}>
            📋 Vacaciones en {MESES[mes-1]} {anio}
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {eventos.map(ev => {
              const activo = estaDeVacaciones(ev);
              return (
                <div key={ev.id} style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'12px 16px', borderRadius:14,
                  background: activo ? 'rgba(39,174,96,0.06)' : 'rgba(201,168,76,0.06)',
                  border:`1.5px solid ${activo?'rgba(39,174,96,0.3)':'rgba(201,168,76,0.3)'}`,
                }}>
                  {/* Foto grande */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    {ev.foto_url
                      ? <img src={ev.foto_url} alt=""
                          className={activo ? 'cal-foto-activo' : 'cal-foto-proximo'}
                          style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:`3px solid ${activo?'#27ae60':'#C9A84C'}` }} />
                      : <div
                          className={activo ? 'cal-foto-activo' : 'cal-foto-proximo'}
                          style={{ width:52, height:52, borderRadius:'50%', background: activo?'rgba(39,174,96,0.2)':'rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:900, color: activo?'#155724':'#856404', border:`3px solid ${activo?'#27ae60':'#C9A84C'}` }}>
                          {getIniciales(ev.nombre, ev.apellido_paterno)}
                        </div>
                    }
                    {/* Icono estado sobre foto */}
                    <div style={{ position:'absolute', bottom:-2, right:-2, width:20, height:20, borderRadius:'50%', background: activo?'#27ae60':'#C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, border:'2px solid white' }}>
                      {activo ? '🏖️' : '✈️'}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:16, color:'var(--g)' }}>
                      {ev.nombre} {ev.apellido_paterno}
                    </div>
                    <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{ev.departamento||'—'}</div>
                    <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', marginTop:4 }}>
                      📅 {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)} · <strong style={{ color:'var(--g)' }}>{ev.dias_solicitados} días</strong>
                    </div>
                  </div>

                  {/* Badge estado */}
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ padding:'6px 12px', borderRadius:20, fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800,
                      background: activo?'#D4EDDA':'#FFF3CD',
                      color: activo?'#155724':'#856404',
                      border:`1px solid ${activo?'#C3E6CB':'#FFEEBA'}` }}>
                      {activo ? '🏖️ De Vacaciones' : '✈️ Próximo'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popup detalle del día */}
      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 {seleccionado.dia} de {MESES[mes-1]}</h2>
              <button className="modal-close" onClick={() => setSeleccionado(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {seleccionado.eventos.map(ev => {
                const activo = estaDeVacaciones(ev);
                return (
                  <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', borderRadius:12,
                    background: activo?'rgba(39,174,96,0.08)':'var(--g-soft)',
                    border:`1px solid ${activo?'#27ae60':'rgba(107,15,43,0.15)'}` }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      {ev.foto_url
                        ? <img src={ev.foto_url} alt="" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:`3px solid ${activo?'#27ae60':'var(--d)'}` }} />
                        : <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--g20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, fontFamily:'Montserrat,sans-serif', color:'var(--g)' }}>
                            {getIniciales(ev.nombre, ev.apellido_paterno)}
                          </div>
                      }
                      <div style={{ position:'absolute', bottom:-2, right:-2, width:22, height:22, borderRadius:'50%', background:activo?'#27ae60':'#C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, border:'2px solid white' }}>
                        {activo?'🏖️':'✈️'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:17, color:'var(--g)' }}>{ev.nombre} {ev.apellido_paterno}</div>
                      <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{ev.departamento||'—'}</div>
                      <div style={{ fontSize:12, marginTop:4, fontFamily:'Montserrat,sans-serif', fontWeight:700, color: activo?'#155724':'#856404' }}>
                        {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)} · {ev.dias_solicitados} días
                      </div>
                      <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:activo?'#D4EDDA':'#FFF3CD', color:activo?'#155724':'#856404', fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif' }}>
                        {activo ? '🏖️ De Vacaciones ahora' : '✈️ Próximamente'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
