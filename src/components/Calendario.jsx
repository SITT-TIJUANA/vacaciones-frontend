import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

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
        // Si es empleado, solo mostrar sus propias vacaciones
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

  // Construir días del mes
  const primerDia = new Date(anio, mes - 1, 1).getDay();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const celdas = Array(primerDia).fill(null).concat(
    Array.from({ length: diasEnMes }, (_, i) => i + 1)
  );
  while (celdas.length % 7 !== 0) celdas.push(null);

  // Mapear eventos a fechas
  const getFechaStr = (d) => `${anio}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

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
    const hoyMs = hoy.getTime();
    const ini = new Date(evento.fecha_inicio); ini.setHours(0,0,0,0);
    const fin = new Date(evento.fecha_fin); fin.setHours(23,59,59,999);
    return hoy >= ini && hoy <= fin;
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Calendario de Vacaciones</h2>
      </div>

      {/* Navegación del mes */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <button className="btn-institucional btn-sm" onClick={() => cambiarMes(-1)}>← Anterior</button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:28, color:'var(--g)' }}>
              {MESES[mes-1]}
            </div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, color:'var(--g60)' }}>{anio}</div>
          </div>
          <button className="btn-institucional btn-sm" onClick={() => cambiarMes(1)}>Siguiente →</button>
        </div>

        {/* Leyenda */}
        <div style={{ display:'flex', gap:20, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { color:'rgba(201,168,76,0.3)', border:'2px solid #C9A84C', label:'Aprobado (próximo)' },
            { color:'rgba(39,174,96,0.3)', border:'2px solid #27ae60', label:'De vacaciones (hoy)' },
            { color:'rgba(107,15,43,0.08)', border:'2px solid var(--g)', label:'Hoy' },
          ].map(({ color, border, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:20, height:20, background:color, border, borderRadius:4 }} />
              <span style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:600, color:'var(--g60)' }}>{label}</span>
            </div>
          ))}
        </div>

        {cargando ? (
          <div className="loader-wrapper" style={{ minHeight:200 }}><div className="loader" /></div>
        ) : (
          <>
            {/* Encabezados días */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
              {DIAS_SEMANA.map(d => (
                <div key={d} style={{ textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'var(--g)', padding:'8px 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas del calendario */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {celdas.map((dia, i) => {
                const eventosHoy = getEventosDia(dia);
                const esHoyDia = esHoy(dia);
                return (
                  <div key={i}
                    onClick={() => dia && eventosHoy.length > 0 && setSeleccionado({ dia, eventos: eventosHoy })}
                    style={{
                      minHeight: 80,
                      borderRadius: 10,
                      padding: '6px 8px',
                      background: dia ? (esHoyDia ? 'rgba(107,15,43,0.06)' : 'var(--w-off)') : 'transparent',
                      border: dia ? (esHoyDia ? '2px solid var(--g)' : '1px solid var(--g20)') : 'none',
                      cursor: eventosHoy.length > 0 ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    {dia && (
                      <>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight: esHoyDia ? 900 : 600, fontSize:13, color: esHoyDia ? 'var(--g)' : 'var(--txt)', marginBottom:4 }}>
                          {dia}
                          {esHoyDia && <span style={{ marginLeft:4, fontSize:9, background:'var(--g)', color:'#fff', padding:'1px 5px', borderRadius:8, fontWeight:800 }}>HOY</span>}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                          {eventosHoy.slice(0,3).map((ev, j) => {
                            const activo = estaDeVacaciones(ev);
                            return (
                              <div key={j} style={{
                                display:'flex', alignItems:'center', gap:4,
                                background: activo ? 'rgba(39,174,96,0.2)' : 'rgba(201,168,76,0.2)',
                                border: `1px solid ${activo ? '#27ae60' : '#C9A84C'}`,
                                borderRadius:6, padding:'2px 5px',
                              }}>
                                {ev.foto_url
                                  ? <img src={ev.foto_url} alt="" style={{ width:18, height:18, borderRadius:'50%', objectFit:'cover', border:`1px solid ${activo?'#27ae60':'#C9A84C'}`, flexShrink:0 }} />
                                  : <span style={{ fontSize:12 }}>👤</span>
                                }
                                <span style={{ fontSize:9, fontFamily:'Montserrat,sans-serif', fontWeight:700, color: activo ? '#155724' : '#856404', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:55 }}>
                                  {ev.nombre}
                                </span>
                              </div>
                            );
                          })}
                          {eventosHoy.length > 3 && (
                            <div style={{ fontSize:9, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>+{eventosHoy.length-3} más</div>
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

      {/* Lista de vacaciones del mes */}
      {eventos.length > 0 && (
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)', marginBottom:18 }}>
            📋 Vacaciones en {MESES[mes-1]} {anio}
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {eventos.map(ev => {
              const activo = estaDeVacaciones(ev);
              return (
                <div key={ev.id} style={{
                  display:'flex', alignItems:'center', gap:16, padding:'14px 16px',
                  borderRadius:12, border:`1.5px solid ${activo?'#27ae60':'#C9A84C'}`,
                  background: activo ? 'rgba(39,174,96,0.06)' : 'rgba(201,168,76,0.06)',
                }}>
                  {ev.foto_url
                    ? <img src={ev.foto_url} alt="" style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', border:`3px solid ${activo?'#27ae60':'#C9A84C'}`, flexShrink:0 }} />
                    : <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>👤</div>
                  }
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:16, color:'var(--g)' }}>
                      {ev.nombre} {ev.apellido_paterno}
                    </div>
                    <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{ev.departamento || '—'}</div>
                    <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', marginTop:4 }}>
                      📅 {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)} · {ev.dias_solicitados} días
                    </div>
                  </div>
                  <span style={{
                    padding:'6px 14px', borderRadius:20, fontSize:11,
                    fontFamily:'Montserrat,sans-serif', fontWeight:800,
                    background: activo ? '#D4EDDA' : '#FFF3CD',
                    color: activo ? '#155724' : '#856404',
                    border: `1px solid ${activo?'#C3E6CB':'#FFEEBA'}`,
                    textTransform:'uppercase', letterSpacing:'0.5px',
                  }}>
                    {activo ? '🏖️ De Vacaciones' : '⏳ Próximo'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {eventos.length === 0 && !cargando && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--g60)' }}>
          <div style={{ fontSize:64, marginBottom:16 }} className="float-anim">📅</div>
          <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:20, color:'var(--g)' }}>Sin vacaciones este mes</p>
          <p style={{ marginTop:8, fontSize:14 }}>No hay vacaciones aprobadas para {MESES[mes-1]} {anio}</p>
        </div>
      )}

      {/* Modal detalle día */}
      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal" style={{ maxWidth:460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 {seleccionado.dia} de {MESES[mes-1]}</h2>
              <button className="modal-close" onClick={() => setSeleccionado(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {seleccionado.eventos.map(ev => {
                const activo = estaDeVacaciones(ev);
                return (
                  <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', borderRadius:12, background: activo?'rgba(39,174,96,0.08)':'var(--g-soft)', border:`1px solid ${activo?'#27ae60':'rgba(107,15,43,0.15)'}` }}>
                    {ev.foto_url
                      ? <img src={ev.foto_url} alt="" style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:`3px solid ${activo?'#27ae60':'var(--d)'}` }} />
                      : <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--g20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>👤</div>
                    }
                    <div>
                      <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:16, color:'var(--g)' }}>{ev.nombre} {ev.apellido_paterno}</div>
                      <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)}</div>
                      <span style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800, color: activo?'#155724':'#856404' }}>
                        {activo ? '🏖️ De vacaciones hoy' : '⏳ Aprobado'}
                      </span>
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

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}
