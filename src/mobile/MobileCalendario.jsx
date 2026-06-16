import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS = ['D','L','M','X','J','V','S'];

function parseDate(f) {
  if (!f) return null;
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y,m-1,d);
}
function fmtFecha(f) {
  const d = parseDate(f); if (!d) return '—';
  return d.toLocaleDateString('es-MX',{day:'numeric',month:'short'});
}
function getIniciales(n,a) { return `${(n||'?')[0]}${(a||'?')[0]}`.toUpperCase(); }

export default function MobileCalendario() {
  const { usuario, rolEfectivo } = useAuth();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth()+1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [selDia, setSelDia] = useState(null);
  const [tab, setTab] = useState('cal');

  const esEmpleado = rolEfectivo === 'empleado';

  useEffect(() => {
    setCargando(true);
    api.get(`/api/calendario?mes=${mes}&anio=${anio}`).then(r=>{
      const data = esEmpleado && usuario?.empleado_id ? r.data.filter(e=>e.empleado_id===usuario.empleado_id) : r.data;
      setEventos(data);
    }).catch(()=>{}).finally(()=>setCargando(false));
  }, [mes, anio]);

  const cambiarMes = (d) => {
    let m=mes+d,a=anio;
    if(m>12){m=1;a++;} if(m<1){m=12;a--;}
    setMes(m); setAnio(a);
  };

  const primerDia = new Date(anio,mes-1,1).getDay();
  const diasEnMes = new Date(anio,mes,0).getDate();
  const celdas = Array(primerDia).fill(null).concat(Array.from({length:diasEnMes},(_,i)=>i+1));
  while(celdas.length%7!==0) celdas.push(null);

  const getEvsDia = (dia) => {
    if (!dia) return [];
    const f = new Date(anio,mes-1,dia); f.setHours(12,0,0,0);
    return eventos.filter(e=>{
      const ini=parseDate(e.fecha_inicio), fin=parseDate(e.fecha_fin);
      if(!ini||!fin) return false;
      ini.setHours(0,0,0,0); fin.setHours(23,59,59,999);
      return f>=ini && f<=fin;
    });
  };

  const esHoy = (d) => d===hoy.getDate()&&mes===hoy.getMonth()+1&&anio===hoy.getFullYear();
  const estaActivo = (ev) => {
    const ini=parseDate(ev.fecha_inicio), fin=parseDate(ev.fecha_fin);
    if(!ini||!fin) return false;
    ini.setHours(0,0,0,0); fin.setHours(23,59,59,999);
    const h=new Date(); h.setHours(12,0,0,0);
    return h>=ini && h<=fin;
  };

  const activos = eventos.filter(e=>estaActivo(e));
  const proximos = eventos.filter(e=>!estaActivo(e));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Tabs */}
      <div style={{ display:'flex', background:'#f3f4f6', borderRadius:12, padding:3 }}>
        {[{id:'cal',l:'📅 Calendario'},{id:'lista',l:'👥 Empleados'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:'9px', borderRadius:10, border:'none', background:tab===t.id?'#fff':'transparent', color:tab===t.id?'#6B0F2B':'#9ca3af', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer', boxShadow:tab===t.id?'0 2px 8px rgba(0,0,0,0.08)':'none', transition:'all 0.2s' }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div style={{ background:'linear-gradient(135deg,#064e3b,#059669)', borderRadius:14, padding:'12px', color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:24 }}>🏖️</span>
          <div>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:24, lineHeight:1 }}>{activos.length}</div>
            <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85 }}>De vacaciones</div>
          </div>
        </div>
        <div style={{ background:'linear-gradient(135deg,#78350f,#d97706)', borderRadius:14, padding:'12px', color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:24 }}>✈️</span>
          <div>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:24, lineHeight:1 }}>{proximos.length}</div>
            <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85 }}>Próximos</div>
          </div>
        </div>
      </div>

      {tab === 'cal' ? (
        <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          {/* Nav mes */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <button onClick={()=>cambiarMes(-1)} style={{ background:'#f3f4f6', border:'none', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13 }}>‹</button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:22, color:'#6B0F2B' }}>{MESES[mes-1]}</div>
              <div style={{ fontSize:12, color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>{anio}</div>
            </div>
            <button onClick={()=>cambiarMes(1)} style={{ background:'#f3f4f6', border:'none', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13 }}>›</button>
          </div>

          {/* Días semana */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
            {DIAS.map(d=><div key={d} style={{ textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:10, color:'#6B0F2B', padding:'4px 0' }}>{d}</div>)}
          </div>

          {/* Celdas */}
          {cargando ? <div style={{textAlign:'center',padding:24}}><div className="loader"/></div> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
              {celdas.map((dia,i) => {
                const evs = getEvsDia(dia);
                const esHoyDia = dia && esHoy(dia);
                const tieneActivos = evs.some(e=>estaActivo(e));
                const tieneProximos = evs.some(e=>!estaActivo(e));
                return (
                  <div key={i} onClick={()=>dia&&evs.length>0&&setSelDia({dia,eventos:evs})}
                    style={{ minHeight:52, borderRadius:8, padding:'3px 2px', display:'flex', flexDirection:'column', alignItems:'center',
                      background:!dia?'transparent':tieneActivos?'rgba(5,150,105,0.1)':tieneProximos?'rgba(217,119,6,0.1)':esHoyDia?'rgba(107,15,43,0.05)':'transparent',
                      border:!dia?'none':tieneActivos?'1px solid rgba(5,150,105,0.3)':tieneProximos?'1px solid rgba(217,119,6,0.3)':esHoyDia?'1.5px solid #6B0F2B':'1px solid #f3f4f6',
                      cursor:evs.length>0?'pointer':'default' }}>
                    {dia && (
                      <>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:11, fontWeight:evs.length?800:500,
                          color:esHoyDia?'#fff':'#374151',
                          background:esHoyDia?'#6B0F2B':'transparent',
                          width:esHoyDia?20:undefined, height:esHoyDia?20:undefined,
                          borderRadius:esHoyDia?'50%':undefined,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          marginBottom:2 }}>{dia}</div>
                        {evs.slice(0,2).map((ev,j)=>{
                          const activo = estaActivo(ev);
                          return ev.foto_url
                            ? <img key={j} src={ev.foto_url} style={{ width:18,height:18,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${activo?'#059669':'#d97706'}`,marginBottom:1 }}/>
                            : <div key={j} style={{ width:18,height:18,borderRadius:'50%',background:activo?'rgba(5,150,105,0.2)':'rgba(217,119,6,0.2)',border:`1.5px solid ${activo?'#059669':'#d97706'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:900,color:activo?'#065f46':'#92400e',marginBottom:1 }}>{ev.nombre?.[0]}</div>;
                        })}
                        {evs.length>2 && <div style={{ fontSize:7,color:'#6B0F2B',fontWeight:800 }}>+{evs.length-2}</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {activos.length>0 && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#065f46', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:3, height:18, background:'#059669', borderRadius:2 }}/> 🏖️ De vacaciones ahora
              </div>
              {activos.map(ev=>(
                <EmpleadoCard key={ev.id} ev={ev} activo={true}/>
              ))}
            </div>
          )}
          {proximos.length>0 && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#92400e', marginBottom:8, marginTop:activos.length?12:0, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:3, height:18, background:'#d97706', borderRadius:2 }}/> ✈️ Próximas vacaciones
              </div>
              {proximos.map(ev=>(
                <EmpleadoCard key={ev.id} ev={ev} activo={false}/>
              ))}
            </div>
          )}
          {eventos.length===0 && !cargando && (
            <div style={{ background:'#fff', borderRadius:16, padding:32, textAlign:'center', color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>
              Sin vacaciones en {MESES[mes-1]}
            </div>
          )}
        </div>
      )}

      {/* Modal día */}
      {selDia && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setSelDia(null)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px', width:'100%', maxHeight:'70vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:2, margin:'0 auto 16px' }}/>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#6B0F2B', marginBottom:14 }}>
              📅 {selDia.dia} de {MESES[mes-1]}
            </div>
            {selDia.eventos.map(ev=><EmpleadoCard key={ev.id} ev={ev} activo={estaActivo(ev)}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

function EmpleadoCard({ ev, activo }) {
  const color = activo ? '#059669' : '#d97706';
  const bg = activo ? 'rgba(5,150,105,0.06)' : 'rgba(217,119,6,0.06)';
  const fmtF = (f) => { const d=parseDate(f); if(!d)return'—'; return d.toLocaleDateString('es-MX',{day:'numeric',month:'short'}); };
  return (
    <div style={{ background:'#fff', borderRadius:14, padding:'14px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', gap:12, alignItems:'center', marginBottom:8, border:`1px solid ${color}25` }}>
      {ev.foto_url
        ? <img src={ev.foto_url} style={{ width:44,height:44,borderRadius:'50%',objectFit:'cover',border:`2px solid ${color}`,flexShrink:0 }}/>
        : <div style={{ width:44,height:44,borderRadius:'50%',background:`${color}15`,border:`2px solid ${color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color,flexShrink:0,fontFamily:'Montserrat,sans-serif' }}>
            {ev.nombre?.[0]}{ev.apellido_paterno?.[0]}
          </div>
      }
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.nombre} {ev.apellido_paterno}</div>
        <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{ev.departamento}</div>
        <div style={{ fontSize:11, color, fontWeight:700, marginTop:4, fontFamily:'Montserrat,sans-serif' }}>📅 {fmtF(ev.fecha_inicio)} → {fmtF(ev.fecha_fin)} · {ev.dias_solicitados}d</div>
      </div>
      <div style={{ width:8,height:8,borderRadius:'50%',background:color,flexShrink:0,boxShadow:`0 0 6px ${color}` }}/>
    </div>
  );
}
