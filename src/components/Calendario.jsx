import { useState, useEffect } from 'react';
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
  return d.toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' });
}
function fmtCorta(f) {
  const d = parseDate(f); if (!d) return '—';
  return d.toLocaleDateString('es-MX', { day:'numeric', month:'short' });
}
function getIniciales(n, a) { return `${(n||'?')[0]}${(a||'?')[0]}`.toUpperCase(); }

// Tarjeta flotante de empleado
function TarjetaEmpleado({ ev, activo, delay=0 }) {
  const color = activo ? '#059669' : '#b45309';
  const colorLight = activo ? '#d1fae5' : '#fef3c7';
  const colorBorder = activo ? '#34d399' : '#fbbf24';
  const bgGrad = activo
    ? 'linear-gradient(135deg,#064e3b,#065f46)'
    : 'linear-gradient(135deg,#78350f,#92400e)';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: `0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px ${colorBorder}30`,
      border: `1.5px solid ${colorBorder}50`,
      animation: `floatIn 0.5s ease ${delay}ms both`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 40px rgba(0,0,0,0.15), 0 0 0 2px ${colorBorder}60`; }}
    onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px ${colorBorder}30`; }}>

      {/* Header con foto */}
      <div style={{ background: bgGrad, padding:'20px 20px 24px', position:'relative', overflow:'hidden' }}>
        {/* Círculos decorativos */}
        <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
        <div style={{ position:'absolute', bottom:-30, left:-10, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative', zIndex:1 }}>
          {/* Foto con animación */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{
              width: 64, height: 64, borderRadius:'50%',
              border: `3px solid ${colorBorder}`,
              boxShadow: `0 0 0 4px ${colorBorder}30, 0 4px 16px rgba(0,0,0,0.3)`,
              overflow: 'hidden',
              animation: activo ? 'breathe 3s ease-in-out infinite' : 'none',
            }}>
              {ev.foto_url
                ? <img src={ev.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:`${colorBorder}33`, fontSize:22, fontWeight:900, color:'#fff', fontFamily:'Montserrat,sans-serif' }}>
                    {getIniciales(ev.nombre, ev.apellido_paterno)}
                  </div>
              }
            </div>
            {/* Badge estado */}
            <div style={{
              position:'absolute', bottom:-2, right:-2,
              width:22, height:22, borderRadius:'50%',
              background: activo ? '#22c55e' : '#f59e0b',
              border:'2.5px solid #fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, animation: activo ? 'pulse-badge 2s ease-in-out infinite' : 'none',
            }}>
              {activo ? '🏖️' : '✈️'}
            </div>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#fff', lineHeight:1.2, marginBottom:3 }}>
              {ev.nombre} {ev.apellido_paterno}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontFamily:'Montserrat,sans-serif' }}>
              {ev.departamento||ev.puesto||'—'}
            </div>
            {/* Badge */}
            <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background: activo?'rgba(34,197,94,0.25)':'rgba(251,191,36,0.25)', border:`1px solid ${colorBorder}60` }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:colorBorder, animation: activo?'pulse-badge 1.5s ease-in-out infinite':'none' }}/>
              <span style={{ fontSize:10, fontWeight:800, color:colorBorder, fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', letterSpacing:0.5 }}>
                {activo ? 'De vacaciones ahora' : 'Próximas vacaciones'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fechas */}
      <div style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, textAlign:'center', padding:'10px', background:colorLight, borderRadius:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:color, fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 }}>Inicio</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#1a1a1a', fontFamily:'Montserrat,sans-serif' }}>{fmtCorta(ev.fecha_inicio)}</div>
          </div>
          <div style={{ fontSize:18, color:colorBorder }}>→</div>
          <div style={{ flex:1, textAlign:'center', padding:'10px', background:colorLight, borderRadius:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:color, fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 }}>Fin</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#1a1a1a', fontFamily:'Montserrat,sans-serif' }}>{fmtCorta(ev.fecha_fin)}</div>
          </div>
          <div style={{ width:52, height:52, borderRadius:14, background:bgGrad, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 12px ${colorBorder}40` }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:22, color:'#fff', lineHeight:1 }}>{ev.dias_solicitados}</div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.7)', fontFamily:'Montserrat,sans-serif', fontWeight:700, textTransform:'uppercase', letterSpacing:0.3 }}>días</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Avatar pequeño para celda calendario
function AvatarCelda({ ev, activo }) {
  const color = activo ? '#22c55e' : '#f59e0b';
  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      {ev.foto_url
        ? <img src={ev.foto_url} alt="" style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover', border:`2px solid ${color}`, display:'block' }}/>
        : <div style={{ width:26, height:26, borderRadius:'50%', background:activo?'rgba(34,197,94,0.2)':'rgba(245,158,11,0.2)', border:`2px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:900, color, fontFamily:'Montserrat,sans-serif' }}>
            {getIniciales(ev.nombre, ev.apellido_paterno)}
          </div>
      }
      <div style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', background:color, border:'1.5px solid #fff', fontSize:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {activo?'🏖':'✈'}
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
  const [tab, setTab] = useState('calendario'); // 'calendario' | 'lista'

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
  }, [mes, anio]);

  const cambiarMes = (d) => {
    let m=mes+d, a=anio;
    if(m>12){m=1;a++;} if(m<1){m=12;a--;}
    setMes(m); setAnio(a);
  };

  const primerDia = new Date(anio,mes-1,1).getDay();
  const diasEnMes = new Date(anio,mes,0).getDate();
  const celdas = Array(primerDia).fill(null).concat(Array.from({length:diasEnMes},(_,i)=>i+1));
  while(celdas.length%7!==0) celdas.push(null);

  const getEventosDia = (dia) => {
    if (!dia) return [];
    const fecha = new Date(anio,mes-1,dia); fecha.setHours(12,0,0,0);
    return eventos.filter(e => {
      const ini=parseDate(e.fecha_inicio); const fin=parseDate(e.fecha_fin);
      if(!ini||!fin) return false;
      ini.setHours(0,0,0,0); fin.setHours(23,59,59,999);
      return fecha>=ini && fecha<=fin;
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
      <style>{`
        @keyframes floatIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes breathe { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.4)} 50%{box-shadow:0 0 0 8px rgba(52,211,153,0)} }
        @keyframes pulse-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        @keyframes shimmer { 0%{opacity:0.6} 50%{opacity:1} 100%{opacity:0.6} }
      `}</style>

      <div className="section-header">
        <h2 className="section-title">Calendario de Vacaciones</h2>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[{id:'calendario',label:'📅 Calendario'},{id:'lista',label:'👥 Por empleado'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'9px 20px', borderRadius:12, border:`1.5px solid ${tab===t.id?'var(--g)':'var(--g20)'}`, background:tab===t.id?'var(--g)':'transparent', color:tab===t.id?'#fff':'var(--g)', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI banners */}
      {eventos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:20 }}>
          <div style={{ background:'linear-gradient(135deg,#064e3b,#059669)', borderRadius:16, padding:'14px 18px', color:'#fff', display:'flex', alignItems:'center', gap:12, boxShadow:'0 4px 16px rgba(5,150,105,0.3)' }}>
            <span style={{ fontSize:32, animation:'shimmer 2s ease-in-out infinite' }}>🏖️</span>
            <div>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:30, lineHeight:1 }}>{activos.length}</div>
              <div style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85 }}>De vacaciones hoy</div>
            </div>
          </div>
          <div style={{ background:'linear-gradient(135deg,#78350f,#d97706)', borderRadius:16, padding:'14px 18px', color:'#fff', display:'flex', alignItems:'center', gap:12, boxShadow:'0 4px 16px rgba(217,119,6,0.3)' }}>
            <span style={{ fontSize:32 }}>✈️</span>
            <div>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:30, lineHeight:1 }}>{proximos.length}</div>
              <div style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85 }}>Próximas vacaciones</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'calendario' ? (
        <div className="card">
          {/* Nav mes */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <button onClick={()=>cambiarMes(-1)} className="btn-institucional btn-sm">← Anterior</button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:30, color:'var(--g)', lineHeight:1 }}>{MESES[mes-1]}</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'var(--g60)', marginTop:2, letterSpacing:2 }}>{anio}</div>
            </div>
            <button onClick={()=>cambiarMes(1)} className="btn-institucional btn-sm">Siguiente →</button>
          </div>

          {/* Leyenda */}
          <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
            {[{color:'#22c55e',bg:'rgba(34,197,94,0.1)',icon:'🏖️',label:'De vacaciones'},
              {color:'#f59e0b',bg:'rgba(245,158,11,0.1)',icon:'✈️',label:'Próximo'}].map(l=>(
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:l.bg, border:`2px solid ${l.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>{l.icon}</div>
                <span style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:600, color:'var(--g60)' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
            {DIAS.map(d=>(
              <div key={d} style={{ textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'var(--g)', padding:'6px 2px', textTransform:'uppercase', letterSpacing:0.5 }}>{d}</div>
            ))}
          </div>

          {/* Celdas */}
          {cargando ? <div className="loader-wrapper" style={{minHeight:200}}><div className="loader"/></div> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
              {celdas.map((dia,i) => {
                const evsDia = getEventosDia(dia);
                const esHoyDia = dia && esHoy(dia);
                const tieneActivos = evsDia.some(e=>estaDeVacaciones(e));
                const tieneProximos = evsDia.some(e=>!estaDeVacaciones(e));
                const esFinde = dia && [0,6].includes(new Date(anio,mes-1,dia).getDay());

                return (
                  <div key={i}
                    onClick={()=>dia&&evsDia.length>0&&setSeleccionado({dia,eventos:evsDia})}
                    style={{
                      minHeight:82, borderRadius:10, padding:'6px 4px',
                      background: !dia?'transparent'
                        : tieneActivos?'rgba(34,197,94,0.08)'
                        : tieneProximos?'rgba(245,158,11,0.08)'
                        : esHoyDia?'rgba(107,15,43,0.06)'
                        : esFinde?'rgba(0,0,0,0.02)'
                        : 'var(--w-off)',
                      border: !dia?'none'
                        : tieneActivos?'1.5px solid rgba(34,197,94,0.35)'
                        : tieneProximos?'1.5px solid rgba(245,158,11,0.35)'
                        : esHoyDia?'2px solid #6B0F2B'
                        : '1px solid var(--g20)',
                      cursor: evsDia.length>0?'pointer':'default',
                      transition:'all 0.15s',
                    }}
                    onMouseEnter={e=>{ if(evsDia.length>0) e.currentTarget.style.transform='scale(1.04)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.transform='none'; }}>
                    {dia && (
                      <>
                        <div style={{ display:'flex', justifyContent:'center', marginBottom:5 }}>
                          {esHoyDia
                            ? <div style={{ background:'#6B0F2B', color:'#C9A84C', width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, fontFamily:'Montserrat,sans-serif', boxShadow:'0 2px 8px rgba(107,15,43,0.4)' }}>{dia}</div>
                            : <span style={{ fontSize:12, fontWeight:evsDia.length?800:500, color:esFinde?'#bbb':'var(--txt)', fontFamily:'Montserrat,sans-serif' }}>{dia}</span>
                          }
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                          {evsDia.slice(0,2).map((ev,j)=>(
                            <AvatarCelda key={j} ev={ev} activo={estaDeVacaciones(ev)}/>
                          ))}
                          {evsDia.length>2 && (
                            <div style={{ fontSize:9, color:'var(--g)', fontFamily:'Montserrat,sans-serif', fontWeight:800, background:'var(--g-soft)', borderRadius:8, padding:'1px 5px' }}>+{evsDia.length-2}</div>
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
      ) : (
        /* Vista lista por empleado */
        <div>
          {cargando ? <div className="loader-wrapper"><div className="loader"/></div> : (
            <>
              {activos.length > 0 && (
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <div style={{ width:4, height:24, borderRadius:2, background:'#22c55e' }}/>
                    <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#065f46', margin:0 }}>🏖️ De vacaciones ahora</h3>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                    {activos.map((ev,i)=><TarjetaEmpleado key={ev.id} ev={ev} activo={true} delay={i*80}/>)}
                  </div>
                </div>
              )}
              {proximos.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <div style={{ width:4, height:24, borderRadius:2, background:'#f59e0b' }}/>
                    <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#92400e', margin:0 }}>✈️ Próximas vacaciones</h3>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                    {proximos.map((ev,i)=><TarjetaEmpleado key={ev.id} ev={ev} activo={false} delay={i*80}/>)}
                  </div>
                </div>
              )}
              {eventos.length === 0 && (
                <div className="card" style={{ textAlign:'center', padding:48 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>Sin vacaciones en {MESES[mes-1]} {anio}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {seleccionado && (
        <div className="modal-overlay" onClick={()=>setSeleccionado(null)}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header" style={{background:'linear-gradient(135deg,#6B0F2B,#9B1540)'}}>
              <h2>📅 {seleccionado.dia} de {MESES[mes-1]} {anio}</h2>
              <button className="modal-close" onClick={()=>setSeleccionado(null)}>✕</button>
            </div>
            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
              {seleccionado.eventos.map((ev,i)=>(
                <TarjetaEmpleado key={ev.id} ev={ev} activo={estaDeVacaciones(ev)} delay={i*100}/>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
