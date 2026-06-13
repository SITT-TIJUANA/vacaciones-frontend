import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BtnRegresar, BtnCerrarSesion } from '../../components/BotonesNav';
import AltaPersonal from '../../components/AltaPersonal';
import Bajas from '../../components/Bajas';
import Historial from '../../components/Historial';
import Usuarios from '../../components/Usuarios';
import api from '../../services/api';

const NAV_ITEMS = [
  { id:'directorio',  icon:'👥', label:'Directorio',  roles:['admin','rrhh'] },
  { id:'organigrama', icon:'📊', label:'Organigrama', roles:['admin','rrhh','empleado'] },
  { id:'alta',        icon:'➕', label:'Alta',         roles:['admin','rrhh'] },
  { id:'bajas',       icon:'🚫', label:'Bajas',        roles:['admin','rrhh'] },
  { id:'historial',   icon:'📋', label:'Historial',   roles:['admin','rrhh'] },
  { id:'usuarios',    icon:'🔐', label:'Usuarios',    roles:['admin'] },
];

export default function PersonalPage() {
  const { rolEfectivo } = useAuth();
  const [seccion, setSeccion] = useState('directorio');
  const navItems = NAV_ITEMS.filter(i => i.roles.includes(rolEfectivo));

  // Empleado solo ve organigrama
  useEffect(() => {
    if (rolEfectivo === 'empleado') setSeccion('organigrama');
  }, [rolEfectivo]);

  return (
    <div style={{ minHeight:'100vh', background:'#F7F8FC', fontFamily:'Montserrat,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#6B0F2B,#9B1540,#C9A84C)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>SITT · Gestión de</div>
          <div style={{ fontSize:28, fontWeight:900, color:'#fff', fontFamily:'Playfair Display,serif', fontStyle:'italic' }}>Personal SITT</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <BtnRegresar />
          <BtnCerrarSesion />
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 20px', display:'flex', gap:4, overflowX:'auto' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setSeccion(item.id)}
            style={{
              padding:'14px 18px', border:'none', background:'none', cursor:'pointer',
              fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13,
              color: seccion===item.id ? '#6B0F2B' : '#718096',
              borderBottom: seccion===item.id ? '3px solid #6B0F2B' : '3px solid transparent',
              whiteSpace:'nowrap', transition:'all 0.2s',
            }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 16px' }}>
        {seccion === 'directorio'  && <Directorio />}
        {seccion === 'organigrama' && <Organigrama />}
        {seccion === 'alta'        && <AltaPersonal onCreado={() => setSeccion('directorio')} />}
        {seccion === 'bajas'       && <Bajas />}
        {seccion === 'historial'   && <Historial />}
        {seccion === 'usuarios'    && <Usuarios />}
      </div>
    </div>
  );
}

// ── Directorio ────────────────────────────────────────────
function Directorio() {
  const [empleados, setEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [depto, setDepto] = useState('');
  const [sel, setSel] = useState(null);

  useEffect(() => {
    api.get('/api/empleados').then(r => setEmpleados(r.data)).catch(console.error);
  }, []);

  const deptos = [...new Set(empleados.map(e => e.departamento).filter(Boolean))].sort();
  const filtrados = empleados.filter(e => {
    const nombre = `${e.nombre} ${e.apellido_paterno}`.toLowerCase();
    if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false;
    if (depto && e.departamento !== depto) return false;
    return true;
  });

  return (
    <>
      {/* Filtros */}
      <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', marginBottom:20, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <input placeholder="🔍 Buscar empleado..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'8px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}/>
        <select value={depto} onChange={e=>setDepto(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}>
          <option value="">Todos los departamentos</option>
          {deptos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#718096', fontWeight:600 }}>{filtrados.length} empleados</span>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
        {filtrados.map(e => (
          <div key={e.id} onClick={() => setSel(e)}
            style={{ background:'#fff', borderRadius:16, padding:'20px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer', textAlign:'center', border:'1px solid #f0f0f0', transition:'all 0.2s' }}
            onMouseEnter={ev => { ev.currentTarget.style.transform='translateY(-4px)'; ev.currentTarget.style.boxShadow='0 8px 24px rgba(107,15,43,0.15)'; ev.currentTarget.style.borderColor='#C9A84C'; }}
            onMouseLeave={ev => { ev.currentTarget.style.transform='none'; ev.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; ev.currentTarget.style.borderColor='#f0f0f0'; }}>
            {e.foto_url
              ? <img src={e.foto_url} alt="" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid #C9A84C', marginBottom:10 }}/>
              : <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#6B0F2B,#9B1540)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, color:'#C9A84C', margin:'0 auto 10px', fontWeight:900 }}>
                  {e.nombre?.[0]}{e.apellido_paterno?.[0]}
                </div>
            }
            <div style={{ fontWeight:800, fontSize:14, color:'#1a1a2e', lineHeight:1.2 }}>{e.nombre} {e.apellido_paterno}</div>
            <div style={{ fontSize:11, color:'#6B0F2B', fontWeight:700, marginTop:4 }}>{e.puesto||'—'}</div>
            <div style={{ fontSize:10, color:'#718096', marginTop:2 }}>{e.departamento||'—'}</div>
          </div>
        ))}
      </div>

      {/* Modal empleado */}
      {sel && <ModalEmpleado emp={sel} onClose={() => setSel(null)} />}
    </>
  );
}

// ── Modal empleado ─────────────────────────────────────────
function ModalEmpleado({ emp, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, maxWidth:420, width:'95%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'linear-gradient(135deg,#6B0F2B,#9B1540)', padding:'24px', textAlign:'center', position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', width:28, height:28, borderRadius:'50%', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          {emp.foto_url
            ? <img src={emp.foto_url} alt="" style={{ width:90, height:90, borderRadius:'50%', objectFit:'cover', border:'4px solid #C9A84C', marginBottom:12 }}/>
            : <div style={{ width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, color:'#C9A84C', margin:'0 auto 12px', fontWeight:900 }}>
                {emp.nombre?.[0]}{emp.apellido_paterno?.[0]}
              </div>
          }
          <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:'Playfair Display,serif', fontStyle:'italic' }}>{emp.nombre} {emp.apellido_paterno}</div>
          <div style={{ fontSize:13, color:'#C9A84C', fontWeight:700, marginTop:4 }}>{emp.puesto||'—'}</div>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:10 }}>
          {[
            ['🏢 Departamento', emp.departamento],
            ['📅 Ingreso', emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}) : '—'],
            ['📱 Teléfono', emp.telefono||'—'],
            ['📧 Email', emp.email||'—'],
            ['🏖️ Días disponibles', emp.dias_disponibles!=null ? `${emp.dias_disponibles} días` : '—'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f0f0' }}>
              <span style={{ fontSize:13, color:'#718096', fontWeight:600 }}>{l}</span>
              <span style={{ fontSize:13, color:'#1a1a2e', fontWeight:700 }}>{v||'—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Organigrama ───────────────────────────────────────────
function Organigrama() {
  const [empleados, setEmpleados] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const { rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);

  useEffect(() => {
    api.get('/api/empleados').then(r => setEmpleados(r.data)).catch(console.error);
  }, []);

  // Agrupar por departamento
  const deptos = {};
  empleados.forEach(e => {
    const d = e.departamento || 'Sin departamento';
    if (!deptos[d]) deptos[d] = [];
    deptos[d].push(e);
  });

  // Ordenar — directores primero
  const jerarquia = ['director','subdirector','jefe','coordinador','encargado','supervisor','administrativo','operativo'];
  Object.keys(deptos).forEach(d => {
    deptos[d].sort((a, b) => {
      const pA = (a.puesto||'').toLowerCase();
      const pB = (b.puesto||'').toLowerCase();
      const iA = jerarquia.findIndex(j => pA.includes(j));
      const iB = jerarquia.findIndex(j => pB.includes(j));
      return (iA===-1?99:iA) - (iB===-1?99:iB);
    });
  });

  const moverEmpleado = async (empId, nuevoDpto) => {
    try {
      await api.put(`/api/empleados/${empId}`, { departamento: nuevoDpto });
      const r = await api.get('/api/empleados');
      setEmpleados(r.data);
    } catch(e) { console.error(e); }
  };

  const COLORES_DEPTO = ['#6B0F2B','#0a1f3d','#1B5E20','#4A1D96','#92400E','#1e3a5f','#3d1a00','#1a3a1a'];

  return (
    <div>
      <div style={{ marginBottom:20, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ fontSize:14, color:'#718096', fontWeight:600 }}>
          📊 {Object.keys(deptos).length} departamentos · {empleados.length} empleados
        </div>
        {esAdmin && (
          <div style={{ fontSize:12, color:'#C9A84C', fontWeight:700, background:'rgba(201,168,76,0.1)', padding:'4px 12px', borderRadius:20, border:'1px solid rgba(201,168,76,0.3)' }}>
            ✋ Arrastra para cambiar departamento
          </div>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {Object.entries(deptos).map(([dpto, emps], di) => {
          const color = COLORES_DEPTO[di % COLORES_DEPTO.length];
          const jefe = emps[0];
          const resto = emps.slice(1);

          return (
            <div key={dpto}
              onDragOver={esAdmin ? e => { e.preventDefault(); setDragOver(dpto); } : undefined}
              onDrop={esAdmin ? e => {
                e.preventDefault();
                if (dragging && dragging.departamento !== dpto) {
                  moverEmpleado(dragging.id, dpto);
                }
                setDragging(null); setDragOver(null);
              } : undefined}
              style={{
                background:'#fff', borderRadius:20, overflow:'hidden',
                boxShadow: dragOver===dpto ? `0 0 0 3px ${color}` : '0 2px 16px rgba(0,0,0,0.07)',
                transition:'box-shadow 0.2s',
              }}>

              {/* Header departamento */}
              <div style={{ background:color, padding:'14px 24px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>Departamento</div>
                  <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:'Playfair Display,serif', fontStyle:'italic' }}>{dpto}</div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'6px 14px', fontSize:13, color:'#fff', fontWeight:700 }}>
                  {emps.length} {emps.length===1?'persona':'personas'}
                </div>
              </div>

              <div style={{ padding:'20px 24px' }}>
                {/* Jefe del departamento */}
                {jefe && (
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                    <TarjetaEmpleado emp={jefe} color={color} esJefe={true} esAdmin={esAdmin}
                      onDragStart={() => setDragging(jefe)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    />
                  </div>
                )}

                {/* Línea conectora */}
                {resto.length > 0 && (
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                    <div style={{ width:2, height:20, background:`${color}40` }}/>
                  </div>
                )}

                {/* Resto del equipo */}
                {resto.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center' }}>
                    {resto.map(e => (
                      <TarjetaEmpleado key={e.id} emp={e} color={color} esJefe={false} esAdmin={esAdmin}
                        onDragStart={() => setDragging(e)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tarjeta empleado organigrama ──────────────────────────
function TarjetaEmpleado({ emp, color, esJefe, esAdmin, onDragStart, onDragEnd }) {
  const [sel, setSel] = useState(false);

  return (
    <>
      <div
        draggable={esAdmin}
        onDragStart={esAdmin ? onDragStart : undefined}
        onDragEnd={esAdmin ? onDragEnd : undefined}
        onClick={() => setSel(true)}
        style={{
          background:'#fff', borderRadius:14, padding:'14px 16px', textAlign:'center',
          border:`2px solid ${esJefe ? color : '#f0f0f0'}`,
          boxShadow: esJefe ? `0 4px 20px ${color}30` : '0 2px 8px rgba(0,0,0,0.06)',
          cursor: esAdmin ? 'grab' : 'pointer',
          width: esJefe ? 180 : 150,
          transition:'all 0.2s',
          position:'relative',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${color}30`; }}
        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=esJefe?`0 4px 20px ${color}30`:'0 2px 8px rgba(0,0,0,0.06)'; }}
      >
        {esJefe && (
          <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:color, color:'#fff', fontSize:9, fontWeight:900, padding:'2px 10px', borderRadius:20, letterSpacing:1, whiteSpace:'nowrap' }}>
            RESPONSABLE
          </div>
        )}
        {emp.foto_url
          ? <img src={emp.foto_url} alt="" style={{ width: esJefe?68:56, height:esJefe?68:56, borderRadius:'50%', objectFit:'cover', border:`3px solid ${color}`, marginBottom:8 }}/>
          : <div style={{ width:esJefe?68:56, height:esJefe?68:56, borderRadius:'50%', background:`${color}20`, border:`3px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:esJefe?22:18, color:color, margin:'0 auto 8px', fontWeight:900 }}>
              {emp.nombre?.[0]}{emp.apellido_paterno?.[0]}
            </div>
        }
        <div style={{ fontWeight:800, fontSize:esJefe?13:12, color:'#1a1a2e', lineHeight:1.2 }}>{emp.nombre} {emp.apellido_paterno}</div>
        <div style={{ fontSize:10, color:color, fontWeight:700, marginTop:3, lineHeight:1.3 }}>{emp.puesto||'—'}</div>
      </div>

      {sel && <ModalEmpleado emp={emp} onClose={() => setSel(false)} />}
    </>
  );
}
