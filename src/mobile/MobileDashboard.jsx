import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('es-MX',{day:'numeric',month:'short'});
}

export default function MobileDashboard({ setSeccion }) {
  const { usuario, rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);
  const [resumen, setResumen] = useState(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        if (!esAdmin && usuario?.empleado_id) {
          const r = await api.get(`/api/solicitudes/periodos-detalle/${usuario.empleado_id}`);
          setResumen(r.data);
        }
        if (esAdmin) {
          const r = await api.get('/api/solicitudes');
          setSolicitudesPendientes(r.data.filter(s => s.estatus === 'pendiente'));
        }
      } catch(e) {}
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) return <div style={{ textAlign:'center', padding:40 }}><div className="loader"/></div>;

  if (esAdmin) return <AdminDashboard pendientes={solicitudesPendientes} setSeccion={setSeccion}/>;
  return <EmpleadoDashboard resumen={resumen} setSeccion={setSeccion}/>;
}

function EmpleadoDashboard({ resumen, setSeccion }) {
  const { usuario } = useAuth();
  const diasDisp = resumen?.total_disponible || 0;
  const diasTom = resumen?.total_tomado || 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Bienvenida */}
      <div style={{ background:'linear-gradient(135deg,#4A0A1E,#6B0F2B)', borderRadius:20, padding:'20px', color:'#fff', display:'flex', alignItems:'center', gap:14, boxShadow:'0 8px 24px rgba(107,15,43,0.3)' }}>
        {usuario?.foto_url
          ? <img src={usuario.foto_url} style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:'3px solid #C9A84C', flexShrink:0 }}/>
          : <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(201,168,76,0.2)', border:'3px solid #C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>👤</div>
        }
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontFamily:'Montserrat,sans-serif' }}>Bienvenido/a</div>
          <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:20, color:'#C9A84C', lineHeight:1.2 }}>{usuario?.nombre || usuario?.username}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:2 }}>{usuario?.departamento || 'SITT'}</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ background:'linear-gradient(135deg,#064e3b,#059669)', borderRadius:16, padding:'16px', color:'#fff', textAlign:'center', boxShadow:'0 4px 16px rgba(5,150,105,0.3)' }}>
          <div style={{ fontSize:36, fontWeight:900, fontFamily:'Playfair Display,serif', fontStyle:'italic', lineHeight:1 }}>{diasDisp}</div>
          <div style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85, marginTop:4 }}>Días disponibles</div>
        </div>
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius:16, padding:'16px', color:'#fff', textAlign:'center', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
          <div style={{ fontSize:36, fontWeight:900, fontFamily:'Playfair Display,serif', fontStyle:'italic', lineHeight:1 }}>{diasTom}</div>
          <div style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:0.85, marginTop:4 }}>Días tomados</div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#374151', marginBottom:12 }}>Acciones rápidas</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { icon:'🏖️', label:'Solicitar vacaciones', color:'#6B0F2B', s:'solicitudes' },
            { icon:'📄', label:'Pedir permiso', color:'#1e3a5f', s:'permisos' },
            { icon:'🏥', label:'Incapacidad', color:'#064e3b', s:'incapacidades' },
            { icon:'📅', label:'Calendario', color:'#78350f', s:'calendario' },
          ].map(a=>(
            <button key={a.s} onClick={()=>setSeccion(a.s)}
              style={{ background:`${a.color}12`, border:`1.5px solid ${a.color}30`, borderRadius:14, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', transition:'all 0.2s' }}
              onTouchStart={e=>e.currentTarget.style.transform='scale(0.95)'}
              onTouchEnd={e=>e.currentTarget.style.transform='none'}>
              <span style={{ fontSize:24 }}>{a.icon}</span>
              <span style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:a.color, textAlign:'center', lineHeight:1.3 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Periodos */}
      {resumen?.periodos?.filter(p=>p.completado).slice(0,2).map((p,i) => (
        <div key={i} style={{ background:'#fff', borderRadius:14, padding:'14px 16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'#6B0F2B' }}>Periodo {p.numero}</div>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{String(p.fecha_inicio||'').substring(0,10)} → {String(p.fecha_fin||'').substring(0,10)}</div>
          </div>
          <div style={{ marginTop:10, background:'#f4f5f7', borderRadius:8, overflow:'hidden', height:8 }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#6B0F2B,#9B1540)', width:`${Math.min(100,(p.dias_tomados/p.dias_correspondientes)*100)||0}%`, borderRadius:8, transition:'width 1s ease' }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:10, color:'#6B0F2B', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>{p.dias_tomados} tomados</span>
            <span style={{ fontSize:10, color:'#059669', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>{p.dias_disponibles} disponibles de {p.dias_correspondientes}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminDashboard({ pendientes, setSeccion }) {
  const { usuario } = useAuth();
  const [stats, setStats] = useState({ empleados:0, vacaciones:0, permisos:0 });

  useEffect(() => {
    Promise.all([
      api.get('/api/empleados').catch(()=>({data:[]})),
      api.get('/api/solicitudes').catch(()=>({data:[]})),
    ]).then(([emp, sol]) => {
      setStats({ empleados: emp.data?.length||0, vacaciones: sol.data?.length||0, permisos: pendientes.length });
    });
  }, [pendientes]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Bienvenida admin */}
      <div style={{ background:'linear-gradient(135deg,#4A0A1E,#6B0F2B)', borderRadius:20, padding:'16px 20px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 24px rgba(107,15,43,0.3)' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(201,168,76,0.2)', border:'2px solid #C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>👑</div>
        <div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontFamily:'Montserrat,sans-serif' }}>Panel de control</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#C9A84C' }}>{usuario?.nombre || usuario?.username}</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {[
          { n:stats.empleados, label:'Empleados', color:'#1e3a5f', bg:'#1e3a5f15', icon:'👥' },
          { n:stats.vacaciones, label:'Solicitudes', color:'#064e3b', bg:'#06533015', icon:'📋' },
          { n:pendientes.length, label:'Pendientes', color:'#92400e', bg:'#92400e15', icon:'⏳' },
        ].map((k,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:14, padding:'14px 10px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:`1.5px solid ${k.color}20` }}>
            <div style={{ fontSize:20 }}>{k.icon}</div>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:26, color:k.color, lineHeight:1, marginTop:4 }}>{k.n}</div>
            <div style={{ fontSize:9, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#9ca3af', marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#374151', marginBottom:12 }}>Acceso rápido</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { icon:'📋', label:'Solicitudes', color:'#6B0F2B', s:'solicitudes' },
            { icon:'📅', label:'Calendario', color:'#064e3b', s:'calendario' },
            { icon:'👥', label:'Personal', color:'#1e3a5f', s:'personal' },
            { icon:'👤', label:'Mi Perfil', color:'#78350f', s:'perfil' },
          ].map(a=>(
            <button key={a.s} onClick={()=>setSeccion(a.s)}
              style={{ background:`${a.color}10`, border:`1.5px solid ${a.color}25`, borderRadius:14, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer' }}>
              <span style={{ fontSize:24 }}>{a.icon}</span>
              <span style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:a.color, textAlign:'center' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Solicitudes pendientes */}
      {pendientes.length > 0 && (
        <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#374151' }}>⏳ Solicitudes pendientes</div>
            <button onClick={()=>setSeccion('solicitudes')} style={{ fontSize:11, color:'#6B0F2B', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>Ver todas →</button>
          </div>
          {pendientes.slice(0,3).map(s=>(
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
              {s.foto_url
                ? <img src={s.foto_url} style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid #C9A84C', flexShrink:0 }}/>
                : <div style={{ width:36, height:36, borderRadius:'50%', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>👤</div>
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.nombre} {s.apellido_paterno}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>{fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)} · {s.dias_solicitados} días</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>setSeccion('solicitudes')} style={{ background:'#064e3b', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓</button>
                <button onClick={()=>setSeccion('solicitudes')} style={{ background:'#7f1d1d', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
