import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function parseDate(f) {
  if (!f) return null;
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y, m-1, d);
}
function fmtFecha(f) {
  const d = parseDate(f); if (!d) return '—';
  return d.toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' });
}
function getIniciales(n, a) { return `${(n||'?')[0]}${(a||'?')[0]}`.toUpperCase(); }

// Pin de ubicación con foto girando en 3D
function PinUbicacion({ ev, activo, size=36 }) {
  const color = activo ? '#22c55e' : '#C9A84C';
  const colorDark = activo ? '#15803d' : '#92400e';
  const glow = activo ? '0 0 16px rgba(34,197,94,0.7)' : '0 0 16px rgba(201,168,76,0.7)';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, position:'relative' }}>
      <style>{`
        @keyframes spin3d-${ev.id} {
          0%   { transform: perspective(120px) rotateY(0deg); }
          100% { transform: perspective(120px) rotateY(360deg); }
        }
        @keyframes pinBounce {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-4px); }
        }
        @keyframes pinPulse-${ev.id} {
          0%,100% { transform: scale(1); opacity:0.6; }
          50%     { transform: scale(1.4); opacity:0; }
        }
      `}</style>

      {/* Foto girando en el pin */}
      <div style={{
        width: size, height: size,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: colorDark,
        border: `2.5px solid ${color}`,
        boxShadow: glow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        animation: 'pinBounce 2s ease-in-out infinite',
        flexShrink: 0,
      }}>
        <div style={{
          transform: 'rotate(45deg)',
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '100%', height: '100%',
            animation: `spin3d-${ev.id} 4s linear infinite`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {ev.foto_url ? (
              <img src={ev.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            ) : (
              <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.28, fontWeight:900, color:'#fff', fontFamily:'Montserrat,sans-serif', background:`${color}44` }}>
                {getIniciales(ev.nombre, ev.apellido_paterno)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sombra pulsante abajo del pin */}
      <div style={{
        width: size*0.5, height: size*0.15,
        borderRadius: '50%',
        background: color,
        opacity: 0.4,
        filter: 'blur(3px)',
        animation: `pinPulse-${ev.id} 2s ease-in-out infinite`,
        marginTop: -2,
      }}/>
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
    let m = mes+d, a = anio;
    if (m>12){m=1;a++;} if (m<1){m=12;a--;}
    setMes(m); setAnio(a);
  };

  const primerDia = new Date(anio, mes-1, 1).getDay();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const celdas = Array(primerDia).fill(null).concat(Array.from({length:diasEnMes},(_,i)=>i+1));
  while (celdas.length%7!==0) celdas.push(null);

  const getEventosDia = (dia) => {
    if (!dia) return [];
    const fecha = new Date(anio, mes-1, dia); fecha.setHours(12,0,0,0);
    return eventos.filter(e => {
      const ini = parseDate(e.fecha_inicio); const fin = parseDate(e.fecha_fin);
      if (!ini||!fin) return false;
      ini.setHours(0,0,0,0); fin.setHours(23,59,59,999);
      return fecha >= ini && fecha <= fin;
    });
  };

  const esHoy = (d) => d===hoy.getDate()&&mes===hoy.getMonth()+1&&anio===hoy.getFullYear();
  const estaDeVacaciones = (ev) => {
    const ini=parseDate(ev.fecha_inicio); const fin=parseDate(ev.fecha_fin);
    if(!ini||!fin) return false;
    ini.setHours(0,0,0,0); fin.setHours(23,59,59,999);
    const h=new Date(); h.setHours(12,0,0,0);
    return h>=ini && h<=fin;
  };

  const activos = eventos.filter(e=>estaDeVacaciones(e));
  const proximos = eventos.filter(e=>!estaDeVacaciones(e));

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Calendario de Vacaciones</h2>
      </div>

      {/* KPI */}
      {eventos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
          {activos.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#064e3b,#059669)', borderRadius:18, padding:'18px 22px', color:'#fff', boxShadow:'0 8px 24px rgba(5,150,105,0.3)', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:42 }}>🏖️</div>
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:38, lineHeight:1 }}>{activos.length}</div>
                <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85 }}>De vacaciones hoy</div>
              </div>
            </div>
          )}
          {proximos.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#78350f,#d97706)', borderRadius:18, padding:'18px 22px', color:'#fff', boxShadow:'0 8px 24px rgba(217,119,6,0.3)', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:42 }}>✈️</div>
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:38, lineHeight:1 }}>{proximos.length}</div>
                <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85 }}>Próximas vacaciones</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendario */}
      <div className="card" style={{ marginBottom:24, overflow:'hidden' }}>
        {/* Header nav */}
        <div style={{ background:'linear-gradient(135deg,#6B0F2B,#9B1540)', margin:'-24px -24px 24px', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={()=>cambiarMes(-1)} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 16px', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12 }}>
            ← Anterior
          </button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:32, color:'#C9A84C', lineHeight:1 }}>{MESES[mes-1]}</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:3, letterSpacing:2 }}>{anio}</div>
          </div>
          <button onClick={()=>cambiarMes(1)} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 16px', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12 }}>
            Siguiente →
          </button>
        </div>

        {/* Leyenda */}
        <div style={{ display:'flex', gap:20, marginBottom:18, flexWrap:'wrap' }}>
          {[{color:'#22c55e',icon:'📍',label:'De vacaciones hoy'},{color:'#C9A84C',icon:'📍',label:'Próximo'}].map(l=>(
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ color:l.color, fontSize:14 }}>{l.icon}</span>
              <span style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:600, color:'var(--g60)' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Días semana */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
          {DIAS.map(d => (
            <div key={d} style={{ textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'var(--g)', padding:'7px 2px', textTransform:'uppercase', letterSpacing:0.5 }}>{d}</div>
          ))}
        </div>

        {/* Celdas */}
        {cargando ? (
          <div className="loader-wrapper" style={{minHeight:200}}><div className="loader"/></div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
            {celdas.map((dia, i) => {
              const evsDia = getEventosDia(dia);
              const esHoyDia = dia && esHoy(dia);
              const tieneActivos = evsDia.some(e=>estaDeVacaciones(e));
              const tieneProximos = evsDia.some(e=>!estaDeVacaciones(e));
              const esFinde = dia && [0,6].includes(new Date(anio,mes-1,dia).getDay());

              return (
                <div key={i}
                  onClick={()=>dia&&evsDia.length>0&&setSeleccionado({dia,eventos:evsDia})}
                  style={{
                    minHeight: 80,
                    borderRadius: 12,
                    padding: '6px 4px 4px',
                    background: !dia?'transparent'
                      : tieneActivos?'rgba(34,197,94,0.07)'
                      : tieneProximos?'rgba(201,168,76,0.07)'
                      : esHoyDia?'rgba(107,15,43,0.05)'
                      : esFinde?'rgba(0,0,0,0.02)'
                      : 'var(--w-off)',
                    border: !dia?'none'
                      : tieneActivos?'1.5px solid rgba(34,197,94,0.3)'
                      : tieneProximos?'1.5px solid rgba(201,168,76,0.3)'
                      : esHoyDia?'2px solid #6B0F2B'
                      : '1px solid var(--g20)',
                    cursor: evsDia.length>0?'pointer':'default',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}>
                  {dia && (
                    <>
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:4 }}>
                        {esHoyDia ? (
                          <div style={{ background:'#6B0F2B', color:'#C9A84C', width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, fontFamily:'Montserrat,sans-serif' }}>{dia}</div>
                        ) : (
                          <span style={{ fontSize:12, fontWeight:evsDia.length?800:500, color:esFinde?'#aaa':'var(--txt)', fontFamily:'Montserrat,sans-serif' }}>{dia}</span>
                        )}
                      </div>

                      {/* Pines */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                        {evsDia.slice(0,2).map((ev,j) => (
                          <PinUbicacion key={j} ev={ev} activo={estaDeVacaciones(ev)} size={32}/>
                        ))}
                        {evsDia.length>2 && (
                          <div style={{ fontSize:9, color:'var(--g)', fontFamily:'Montserrat,sans-serif', fontWeight:800, background:'var(--g-soft)', borderRadius:10, padding:'1px 5px' }}>
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

      {/* Lista del mes */}
      {eventos.length > 0 && (
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, color:'var(--g)', marginBottom:16 }}>
            Vacaciones en {MESES[mes-1]} {anio}
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {eventos.map(ev => {
              const activo = estaDeVacaciones(ev);
              const color = activo ? '#22c55e' : '#C9A84C';
              return (
                <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:18, padding:'16px 20px', borderRadius:16, background:activo?'rgba(34,197,94,0.06)':'rgba(201,168,76,0.06)', border:`1.5px solid ${activo?'rgba(34,197,94,0.25)':'rgba(201,168,76,0.25)'}` }}>
                  <PinUbicacion ev={ev} activo={activo} size={56}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:19, color:'var(--g)' }}>
                      {ev.nombre} {ev.apellido_paterno}
                    </div>
                    <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{ev.departamento||'—'}</div>
                    <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', marginTop:6 }}>
                      📅 {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)}
                    </div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:38, color, lineHeight:1 }}>{ev.dias_solicitados}</div>
                    <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', textTransform:'uppercase', marginTop:2 }}>días</div>
                    <div style={{ marginTop:8, padding:'4px 12px', borderRadius:20, fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800, background:activo?'rgba(34,197,94,0.1)':'rgba(201,168,76,0.1)', color, border:`1px solid ${color}40` }}>
                      {activo?'🏖️ Ahora':'✈️ Próximo'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {seleccionado && (
        <div className="modal-overlay" onClick={()=>setSeleccionado(null)}>
          <div className="modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header" style={{background:'linear-gradient(135deg,#6B0F2B,#9B1540)'}}>
              <h2>📅 {seleccionado.dia} de {MESES[mes-1]} {anio}</h2>
              <button className="modal-close" onClick={()=>setSeleccionado(null)}>✕</button>
            </div>
            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
              {seleccionado.eventos.map(ev => {
                const activo = estaDeVacaciones(ev);
                const color = activo ? '#22c55e' : '#C9A84C';
                return (
                  <div key={ev.id} style={{display:'flex',alignItems:'center',gap:18,padding:'14px 16px',borderRadius:14,background:activo?'rgba(34,197,94,0.07)':'var(--g-soft)',border:`1.5px solid ${activo?'rgba(34,197,94,0.3)':'rgba(107,15,43,0.15)'}`}}>
                    <PinUbicacion ev={ev} activo={activo} size={64}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:20,color:'var(--g)'}}>
                        {ev.nombre} {ev.apellido_paterno}
                      </div>
                      <div style={{fontSize:12,color:'var(--g60)',marginTop:3}}>{ev.departamento||'—'}</div>
                      <div style={{fontSize:12,marginTop:6,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)'}}>
                        {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)}
                      </div>
                      <div style={{marginTop:8,display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,background:`${color}18`,color,fontSize:12,fontWeight:800,fontFamily:'Montserrat,sans-serif',border:`1px solid ${color}40`}}>
                        {activo?'🏖️ De Vacaciones':'✈️ Próximamente'} · {ev.dias_solicitados} días
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
