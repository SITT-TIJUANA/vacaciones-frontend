import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Fix timezone: parse date without UTC conversion
function parseDate(f) {
  if (!f) return null;
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y, m-1, d);
}

function fmtFecha(f) {
  const d = parseDate(f);
  if (!d) return '—';
  return d.toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' });
}

function getIniciales(n, a) {
  return `${(n||'?')[0]}${(a||'?')[0]}`.toUpperCase();
}

// 3D Card component for each employee
function AvatarCard({ ev, activo, size=56 }) {
  const ref = useRef(null);
  const [rot, setRot] = useState({x:0,y:0});
  const [hover, setHover] = useState(false);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width/2) / (rect.width/2);
    const y = (e.clientY - rect.top - rect.height/2) / (rect.height/2);
    setRot({ x: -y*18, y: x*18 });
  };

  const color = activo ? '#22c55e' : '#C9A84C';
  const glow = activo ? 'rgba(34,197,94,0.6)' : 'rgba(201,168,76,0.6)';

  return (
    <div ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setRot({x:0,y:0}); }}
      onMouseMove={onMove}
      style={{
        transform: `perspective(400px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${hover?1.15:1})`,
        transition: hover ? 'transform 0.1s' : 'transform 0.4s ease',
        cursor: 'pointer',
        position: 'relative',
        width: size, height: size,
      }}>
      {/* Glow */}
      <div style={{ position:'absolute', inset:-4, borderRadius:'50%', background:glow, filter:'blur(8px)', opacity:hover?0.8:0.3, transition:'opacity 0.3s' }}/>
      {/* Avatar */}
      {ev.foto_url ? (
        <img src={ev.foto_url} alt=""
          style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover',
            border:`2.5px solid ${color}`,
            boxShadow:`0 4px 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
            display:'block', position:'relative', zIndex:1 }}/>
      ) : (
        <div style={{ width:size, height:size, borderRadius:'50%',
          background:`linear-gradient(135deg,${color}33,${color}66)`,
          border:`2.5px solid ${color}`,
          boxShadow:`0 4px 20px ${glow}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:size*0.3, fontWeight:900, color, fontFamily:'Montserrat,sans-serif',
          position:'relative', zIndex:1 }}>
          {getIniciales(ev.nombre, ev.apellido_paterno)}
        </div>
      )}
      {/* Badge */}
      <div style={{
        position:'absolute', bottom:-2, right:-2, zIndex:2,
        width:size*0.35, height:size*0.35, borderRadius:'50%',
        background:color, border:'2px solid #fff',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:size*0.2, boxShadow:`0 2px 8px ${glow}`,
      }}>
        {activo ? '🏖️' : '✈️'}
      </div>
    </div>
  );
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
  const [hoveredDia, setHoveredDia] = useState(null);

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

  const cambiarMes = (d) => {
    let m = mes + d, a = anio;
    if (m > 12) { m=1; a++; }
    if (m < 1)  { m=12; a--; }
    setMes(m); setAnio(a);
  };

  const primerDia = new Date(anio, mes-1, 1).getDay();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const celdas = Array(primerDia).fill(null).concat(Array.from({length:diasEnMes},(_,i)=>i+1));
  while (celdas.length%7!==0) celdas.push(null);

  const getEventosDia = (dia) => {
    if (!dia) return [];
    const fecha = new Date(anio, mes-1, dia);
    fecha.setHours(0,0,0,0);
    return eventos.filter(e => {
      const ini = parseDate(e.fecha_inicio);
      const fin = parseDate(e.fecha_fin);
      if (!ini || !fin) return false;
      ini.setHours(0,0,0,0);
      fin.setHours(23,59,59,999);
      return fecha >= ini && fecha <= fin;
    });
  };

  const esHoy = (d) => d===hoy.getDate() && mes===hoy.getMonth()+1 && anio===hoy.getFullYear();
  const estaDeVacaciones = (ev) => {
    const ini = parseDate(ev.fecha_inicio); if(!ini)return false;
    const fin = parseDate(ev.fecha_fin); if(!fin)return false;
    ini.setHours(0,0,0,0); fin.setHours(23,59,59,999);
    const h = new Date(); h.setHours(12,0,0,0);
    return h >= ini && h <= fin;
  };

  const activos = eventos.filter(e => estaDeVacaciones(e));
  const proximos = eventos.filter(e => !estaDeVacaciones(e));

  return (
    <div className="fade-in" style={{ padding:'0 0 40px' }}>
      <div className="section-header">
        <h2 className="section-title">Calendario de Vacaciones</h2>
      </div>

      {/* KPI Cards */}
      {eventos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:28 }}>
          {activos.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#064e3b,#065f46,#059669)', borderRadius:20, padding:'18px 22px', color:'#fff', position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(5,150,105,0.4)' }}>
              <div style={{ position:'absolute', top:-10, right:-10, fontSize:80, opacity:0.15 }}>🏖️</div>
              <div style={{ fontSize:46, fontWeight:900, fontFamily:'Playfair Display,serif', fontStyle:'italic', lineHeight:1 }}>{activos.length}</div>
              <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85, marginTop:4 }}>De vacaciones hoy</div>
              <div style={{ display:'flex', marginTop:12, gap:-8 }}>
                {activos.slice(0,4).map((ev,i) => (
                  <div key={i} style={{ marginLeft: i>0?-10:0, zIndex:4-i }}>
                    {ev.foto_url
                      ? <img src={ev.foto_url} style={{ width:28,height:28,borderRadius:'50%',objectFit:'cover',border:'2px solid #064e3b' }}/>
                      : <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'2px solid #064e3b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:'#fff' }}>{getIniciales(ev.nombre,ev.apellido_paterno)}</div>
                    }
                  </div>
                ))}
                {activos.length > 4 && <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'2px solid #064e3b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,color:'#fff',marginLeft:-10 }}>+{activos.length-4}</div>}
              </div>
            </div>
          )}
          {proximos.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#78350f,#92400e,#d97706)', borderRadius:20, padding:'18px 22px', color:'#fff', position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(217,119,6,0.4)' }}>
              <div style={{ position:'absolute', top:-10, right:-10, fontSize:80, opacity:0.15 }}>✈️</div>
              <div style={{ fontSize:46, fontWeight:900, fontFamily:'Playfair Display,serif', fontStyle:'italic', lineHeight:1 }}>{proximos.length}</div>
              <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85, marginTop:4 }}>Próximas vacaciones</div>
            </div>
          )}
        </div>
      )}

      {/* Calendario principal */}
      <div style={{ background:'linear-gradient(145deg,#1a1a2e,#16213e)', borderRadius:24, padding:'28px 24px', boxShadow:'0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)', marginBottom:24 }}>
        {/* Nav mes */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <button onClick={() => cambiarMes(-1)} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'10px 18px', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, transition:'all 0.2s' }}
            onMouseEnter={e=>e.target.style.background='rgba(255,255,255,0.15)'}
            onMouseLeave={e=>e.target.style.background='rgba(255,255,255,0.08)'}>
            ← Anterior
          </button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:38, color:'#C9A84C', lineHeight:1, textShadow:'0 0 30px rgba(201,168,76,0.5)' }}>
              {MESES[mes-1]}
            </div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, color:'rgba(255,255,255,0.5)', marginTop:4, letterSpacing:3 }}>
              {anio}
            </div>
          </div>
          <button onClick={() => cambiarMes(1)} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'10px 18px', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, transition:'all 0.2s' }}
            onMouseEnter={e=>e.target.style.background='rgba(255,255,255,0.15)'}
            onMouseLeave={e=>e.target.style.background='rgba(255,255,255,0.08)'}>
            Siguiente →
          </button>
        </div>

        {/* Leyenda */}
        <div style={{ display:'flex', gap:20, marginBottom:20, flexWrap:'wrap' }}>
          {[{color:'#22c55e',glow:'rgba(34,197,94,0.4)',icon:'🏖️',label:'De vacaciones'},
            {color:'#C9A84C',glow:'rgba(201,168,76,0.4)',icon:'✈️',label:'Próximo'}].map(l=>(
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:l.color, boxShadow:`0 0 8px ${l.glow}` }}/>
              <span style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'rgba(255,255,255,0.6)' }}>{l.icon} {l.label}</span>
            </div>
          ))}
        </div>

        {/* Headers días */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
          {DIAS.map(d => (
            <div key={d} style={{ textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'rgba(255,255,255,0.35)', padding:'6px 2px', textTransform:'uppercase', letterSpacing:1 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        {cargando ? (
          <div style={{ minHeight:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div className="loader"/>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
            {celdas.map((dia, i) => {
              const evsDia = getEventosDia(dia);
              const esHoyDia = dia && esHoy(dia);
              const tieneActivos = evsDia.some(e => estaDeVacaciones(e));
              const tieneProximos = evsDia.some(e => !estaDeVacaciones(e));
              const isHov = hoveredDia === `${anio}-${mes}-${dia}`;
              const esFinde = dia && (new Date(anio,mes-1,dia).getDay()===0 || new Date(anio,mes-1,dia).getDay()===6);

              return (
                <div key={i}
                  onMouseEnter={() => dia && setHoveredDia(`${anio}-${mes}-${dia}`)}
                  onMouseLeave={() => setHoveredDia(null)}
                  onClick={() => dia && evsDia.length>0 && setSeleccionado({dia, eventos:evsDia})}
                  style={{
                    minHeight: 88,
                    borderRadius: 14,
                    padding: '7px 5px 6px',
                    background: !dia ? 'transparent'
                      : tieneActivos ? 'rgba(34,197,94,0.12)'
                      : tieneProximos ? 'rgba(201,168,76,0.12)'
                      : esHoyDia ? 'rgba(201,168,76,0.08)'
                      : esFinde ? 'rgba(255,255,255,0.02)'
                      : 'rgba(255,255,255,0.04)',
                    border: !dia ? 'none'
                      : tieneActivos ? '1.5px solid rgba(34,197,94,0.4)'
                      : tieneProximos ? '1.5px solid rgba(201,168,76,0.4)'
                      : esHoyDia ? '1.5px solid #C9A84C'
                      : '1px solid rgba(255,255,255,0.06)',
                    cursor: evsDia.length>0 ? 'pointer' : 'default',
                    transform: isHov && evsDia.length>0 ? 'translateY(-3px) scale(1.03)' : 'none',
                    boxShadow: isHov && tieneActivos ? '0 8px 24px rgba(34,197,94,0.25)'
                      : isHov && tieneProximos ? '0 8px 24px rgba(201,168,76,0.25)'
                      : 'none',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    position: 'relative',
                  }}>
                  {dia && (
                    <>
                      {/* Número */}
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:5 }}>
                        {esHoyDia ? (
                          <div style={{ background:'#C9A84C', color:'#1a1a2e', width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, fontFamily:'Montserrat,sans-serif', boxShadow:'0 0 12px rgba(201,168,76,0.6)' }}>{dia}</div>
                        ) : (
                          <span style={{ fontSize:11, fontWeight:evsDia.length?800:500, color:tieneActivos?'#86efac':tieneProximos?'#fde68a':esFinde?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.5)', fontFamily:'Montserrat,sans-serif' }}>{dia}</span>
                        )}
                      </div>

                      {/* Avatares */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                        {evsDia.slice(0,2).map((ev, j) => {
                          const activo = estaDeVacaciones(ev);
                          const color = activo ? '#22c55e' : '#C9A84C';
                          const glow = activo ? 'rgba(34,197,94,0.5)' : 'rgba(201,168,76,0.5)';
                          return (
                            <div key={j} style={{ position:'relative' }}>
                              <div style={{ position:'absolute', inset:-2, borderRadius:'50%', background:glow, filter:'blur(4px)', opacity:0.5 }}/>
                              {ev.foto_url ? (
                                <img src={ev.foto_url} alt="" style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`2px solid ${color}`, display:'block', position:'relative', zIndex:1 }}/>
                              ) : (
                                <div style={{ width:30, height:30, borderRadius:'50%', background:`${color}22`, border:`2px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color, position:'relative', zIndex:1 }}>
                                  {getIniciales(ev.nombre, ev.apellido_paterno)}
                                </div>
                              )}
                              <div style={{ position:'absolute', bottom:-2, right:-2, width:12, height:12, borderRadius:'50%', background:color, border:'1.5px solid #1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, zIndex:2 }}>
                                {activo?'🏖️':'✈️'}
                              </div>
                            </div>
                          );
                        })}
                        {evsDia.length>2 && (
                          <div style={{ fontSize:9, color:'#C9A84C', fontFamily:'Montserrat,sans-serif', fontWeight:800, background:'rgba(201,168,76,0.15)', borderRadius:10, padding:'1px 5px' }}>
                            +{evsDia.length-2}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista empleados del mes */}
      {eventos.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {eventos.map(ev => {
            const activo = estaDeVacaciones(ev);
            const color = activo ? '#22c55e' : '#C9A84C';
            const bg = activo ? 'rgba(34,197,94,0.06)' : 'rgba(201,168,76,0.06)';
            const border = activo ? 'rgba(34,197,94,0.25)' : 'rgba(201,168,76,0.25)';
            return (
              <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:18, padding:'18px 22px', borderRadius:20, background:`linear-gradient(135deg,${bg},transparent)`, border:`1.5px solid ${border}`, backdropFilter:'blur(10px)' }}>
                <AvatarCard ev={ev} activo={activo} size={64}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:20, color:'var(--g)', lineHeight:1.2 }}>
                    {ev.nombre} {ev.apellido_paterno}
                  </div>
                  <div style={{ fontSize:12, color:'var(--g60)', marginTop:3, fontFamily:'Montserrat,sans-serif' }}>{ev.departamento||'—'}</div>
                  <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', marginTop:7 }}>
                    📅 {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)}
                  </div>
                </div>
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:40, color, lineHeight:1, textShadow:`0 0 20px ${color}66` }}>{ev.dias_solicitados}</div>
                  <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', textTransform:'uppercase', marginTop:2, letterSpacing:1 }}>días</div>
                  <div style={{ marginTop:8, padding:'5px 14px', borderRadius:20, fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800, background:activo?'rgba(34,197,94,0.12)':'rgba(201,168,76,0.12)', color, border:`1px solid ${color}40` }}>
                    {activo ? '🏖️ Ahora' : '✈️ Próximo'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle día */}
      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal" style={{ maxWidth:460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background:'linear-gradient(135deg,#1a1a2e,#2d2d4e)' }}>
              <h2>📅 {seleccionado.dia} de {MESES[mes-1]} {anio}</h2>
              <button className="modal-close" onClick={() => setSeleccionado(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {seleccionado.eventos.map(ev => {
                const activo = estaDeVacaciones(ev);
                const color = activo ? '#22c55e' : '#C9A84C';
                return (
                  <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 18px', borderRadius:16, background:activo?'rgba(34,197,94,0.07)':'rgba(201,168,76,0.07)', border:`1.5px solid ${activo?'rgba(34,197,94,0.3)':'rgba(201,168,76,0.3)'}` }}>
                    <AvatarCard ev={ev} activo={activo} size={72}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:20, color:'var(--g)' }}>
                        {ev.nombre} {ev.apellido_paterno}
                      </div>
                      <div style={{ fontSize:12, color:'var(--g60)', marginTop:3 }}>{ev.departamento||'—'}</div>
                      <div style={{ fontSize:12, marginTop:7, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>
                        {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)}
                      </div>
                      <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:5, padding:'5px 14px', borderRadius:20, background:`${color}18`, color, fontSize:12, fontWeight:800, fontFamily:'Montserrat,sans-serif', border:`1px solid ${color}40` }}>
                        {activo ? '🏖️ De Vacaciones' : '✈️ Próximamente'} · {ev.dias_solicitados} días
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
