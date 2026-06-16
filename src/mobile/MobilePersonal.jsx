import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function getIniciales(n,a) { return `${(n||'?')[0]}${(a||'?')[0]}`.toUpperCase(); }

export default function MobilePersonal({ setSeccion }) {
  const { rolEfectivo } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('directorio');

  useEffect(()=>{
    api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(()=>{}).finally(()=>setCargando(false));
  },[]);

  const filtrados = empleados.filter(e =>
    `${e.nombre} ${e.apellido_paterno} ${e.puesto||''} ${e.departamento||''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const TABS = [
    { id:'directorio', l:'👥 Directorio' },
    { id:'solicitudes', l:'📋 Solicitudes' },
    { id:'bajas', l:'🚫 Bajas' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Tabs */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'8px 14px', borderRadius:20, border:`1.5px solid ${tab===t.id?'#6B0F2B':'#e5e7eb'}`, background:tab===t.id?'#6B0F2B':'#fff', color:tab===t.id?'#fff':'#6b7280', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11, whiteSpace:'nowrap', flexShrink:0 }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'directorio' && (
        <>
          {/* Búsqueda */}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔍</span>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar empleado..."
              style={{ width:'100%', padding:'12px 12px 12px 38px', borderRadius:14, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box', background:'#fff' }}/>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { n:empleados.length, l:'Total', c:'#6B0F2B' },
              { n:empleados.filter(e=>e.activo!==false).length, l:'Activos', c:'#059669' },
              { n:empleados.filter(e=>!e.activo).length, l:'Bajas', c:'#9ca3af' },
            ].map(k=>(
              <div key={k.l} style={{ background:'#fff', borderRadius:12, padding:'12px 8px', textAlign:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:24, color:k.c }}>{k.n}</div>
                <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', color:'#9ca3af', fontWeight:700 }}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* Lista empleados */}
          {cargando ? <div style={{textAlign:'center',padding:32}}><div className="loader"/></div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {filtrados.slice(0,30).map(emp=>(
                <div key={emp.id} style={{ background:'#fff', borderRadius:14, padding:'12px 14px', boxShadow:'0 2px 6px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:12 }}>
                  {emp.foto_url
                    ? <img src={emp.foto_url} style={{ width:44,height:44,borderRadius:'50%',objectFit:'cover',border:'2px solid #C9A84C',flexShrink:0 }}/>
                    : <div style={{ width:44,height:44,borderRadius:'50%',background:'rgba(107,15,43,0.1)',border:'2px solid #C9A84C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#6B0F2B',flexShrink:0,fontFamily:'Montserrat,sans-serif' }}>
                        {getIniciales(emp.nombre,emp.apellido_paterno)}
                      </div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {emp.nombre} {emp.apellido_paterno}
                    </div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {emp.puesto||'—'} · {emp.departamento||'—'}
                    </div>
                  </div>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:emp.activo!==false?'#22c55e':'#9ca3af',flexShrink:0 }}/>
                </div>
              ))}
              {filtrados.length > 30 && (
                <div style={{ textAlign:'center', fontSize:12, color:'#9ca3af', fontFamily:'Montserrat,sans-serif', padding:8 }}>
                  Mostrando 30 de {filtrados.length}. Usa la búsqueda para filtrar.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'solicitudes' && (
        <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', textAlign:'center', color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
          <button onClick={()=>setSeccion('solicitudes')} style={{ background:'#6B0F2B', color:'#fff', border:'none', borderRadius:12, padding:'12px 20px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Ver solicitudes →
          </button>
        </div>
      )}

      {tab === 'bajas' && (
        <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#374151', marginBottom:12 }}>Empleados dados de baja</div>
          {empleados.filter(e=>!e.activo).map(emp=>(
            <div key={emp.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
              <div style={{ width:36,height:36,borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>👤</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#6b7280' }}>{emp.nombre} {emp.apellido_paterno}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>{emp.puesto}</div>
              </div>
            </div>
          ))}
          {empleados.filter(e=>!e.activo).length === 0 && (
            <div style={{ textAlign:'center', color:'#9ca3af', padding:20, fontFamily:'Montserrat,sans-serif', fontSize:13 }}>Sin bajas registradas</div>
          )}
        </div>
      )}
    </div>
  );
}
