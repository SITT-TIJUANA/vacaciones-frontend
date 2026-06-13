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
      <div style={{ background:'#fff', borderRadius:20, maxWidth:380, width:'95%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }} onClick={e=>e.stopPropagation()}>
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
            ['📧 Correo', emp.email],
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
const DEPT_COLORS = {
  'direccion general': { bg:'#6B0F2B', text:'#fff', light:'rgba(107,15,43,0.08)', border:'#6B0F2B' },
  'administración':    { bg:'#F5E6D3', text:'#6B0F2B', light:'rgba(245,230,211,0.5)', border:'#D4A574' },
  'administracion':    { bg:'#F5E6D3', text:'#6B0F2B', light:'rgba(245,230,211,0.5)', border:'#D4A574' },
  'operaciones':       { bg:'#6B7280', text:'#fff', light:'rgba(107,114,128,0.08)', border:'#6B7280' },
};

function getDeptColor(depto) {
  const key = (depto||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for (const [k,v] of Object.entries(DEPT_COLORS)) {
    if (key.includes(k.replace(/[\u0300-\u036f]/g,''))) return v;
  }
  return { bg:'#1a1a2e', text:'#fff', light:'rgba(26,26,46,0.08)', border:'#1a1a2e' };
}

function Organigrama() {
  const [empleados, setEmpleados] = useState([]);
  const [sel, setSel] = useState(null);
  const { rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);

  const recargar = () => api.get('/api/empleados').then(r => setEmpleados(r.data.filter(e=>e.activo!==false))).catch(console.error);

  useEffect(() => { recargar(); }, []);

  const jerarquia = ['director','subdirector','jefe','coordinador','encargado','supervisor'];

  const getRango = (puesto='') => {
    const p = puesto.toLowerCase();
    const i = jerarquia.findIndex(j => p.includes(j));
    return i === -1 ? 99 : i;
  };

  // Separar director general del resto
  const director = empleados.find(e => (e.puesto||'').toLowerCase().includes('director general'));
  const resto = empleados.filter(e => e !== director);

  // Agrupar resto por departamento
  const deptos = {};
  resto.forEach(e => {
    const d = e.departamento || 'Sin departamento';
    if (!deptos[d]) deptos[d] = [];
    deptos[d].push(e);
  });
  Object.values(deptos).forEach(arr => arr.sort((a,b) => getRango(a.puesto) - getRango(b.puesto)));

  return (
    <div style={{ fontFamily:'Montserrat,sans-serif' }}>
      {/* Título */}
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:4, color:'#718096', textTransform:'uppercase', marginBottom:6 }}>ORGANIGRAMA</div>
        <div style={{ fontSize:28, fontWeight:900, fontFamily:'Playfair Display,serif', fontStyle:'italic', color:'#1a1a2e' }}>SITT · Tijuana</div>
        <div style={{ width:60, height:2, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)', margin:'10px auto 0' }}/>
      </div>

      {/* Director General */}
      {director && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:8 }}>
          <TarjetaOrg emp={director} color={getDeptColor(director.departamento||'direccion general')} grande={true} onClick={()=>setSel(director)} esAdmin={esAdmin} onCargoActualizado={recargar}/>
          {/* Línea hacia abajo */}
          <div style={{ width:2, height:40, background:'#C9A84C', marginTop:4 }}/>
        </div>
      )}

      {/* Línea horizontal conectora */}
      {Object.keys(deptos).length > 0 && (
        <div style={{ display:'flex', justifyContent:'center', marginBottom:0 }}>
          <div style={{ height:2, background:'#C9A84C', width:`${Math.min(Object.keys(deptos).length * 280, 900)}px`, maxWidth:'90vw' }}/>
        </div>
      )}

      {/* Departamentos */}
      <div style={{ display:'flex', justifyContent:'center', gap:'clamp(16px,4vw,60px)', flexWrap:'wrap', alignItems:'flex-start', marginTop:0 }}>
        {Object.entries(deptos).map(([dpto, emps]) => {
          const color = getDeptColor(dpto);
          const jefe = emps[0];
          const equipo = emps.slice(1);
          return (
            <div key={dpto} style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:180 }}>
              {/* Línea vertical desde horizontal */}
              <div style={{ width:2, height:32, background:'#C9A84C' }}/>

              {/* Badge departamento */}
              <div style={{ background:color.bg, color:color.text, padding:'5px 16px', borderRadius:20, fontSize:11, fontWeight:800, letterSpacing:1, textTransform:'uppercase', marginBottom:10, boxShadow:`0 2px 8px ${color.bg}40`, border:`1px solid ${color.border}` }}>
                {dpto}
              </div>

              {/* Jefe */}
              {jefe && (
                <>
                  <TarjetaOrg emp={jefe} color={color} grande={false} onClick={()=>setSel(jefe)} esAdmin={esAdmin} onCargoActualizado={recargar}/>
                  {equipo.length > 0 && <div style={{ width:2, height:20, background:`${color.bg}60`, marginTop:4 }}/>}
                </>
              )}

              {/* Equipo */}
              {equipo.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:0 }}>
                  {equipo.map(e => (
                    <TarjetaOrg key={e.id} emp={e} color={color} grande={false} onClick={()=>setSel(e)} esAdmin={esAdmin} onCargoActualizado={recargar}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {sel && <ModalEmpleado emp={sel} onClose={()=>setSel(null)}/>}
    </div>
  );
}

// ── Tarjeta organigrama ──────────────────────────────────
function TarjetaOrg({ emp, color, grande, onClick, esAdmin, onCargoActualizado }) {
  const [editando, setEditando] = useState(false);
  const [cargo, setCargo] = useState(emp.cargo_funcional || emp.puesto || '');
  const [guardando, setGuardando] = useState(false);

  const guardarCargo = async (e) => {
    e.stopPropagation();
    setGuardando(true);
    try {
      await api.put(`/api/empleados/${emp.id}`, { cargo_funcional: cargo });
      emp.cargo_funcional = cargo;
      onCargoActualizado && onCargoActualizado();
      setEditando(false);
    } catch(err) { console.error(err); }
    finally { setGuardando(false); }
  };

  const cargoMostrar = emp.cargo_funcional || emp.puesto || '—';

  return (
    <div
      onClick={editando ? undefined : onClick}
      style={{
        background:'#fff', borderRadius:14,
        padding: grande ? '18px 22px' : '12px 16px',
        textAlign:'center',
        border:`2px solid ${color.border}`,
        boxShadow:`0 4px 16px ${color.bg}20`,
        cursor: editando ? 'default' : 'pointer',
        width: grande ? 210 : 168,
        transition:'all 0.2s',
        position:'relative',
      }}
      onMouseEnter={e=>{ if(!editando){ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 10px 28px ${color.bg}40`; }}}
      onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 4px 16px ${color.bg}20`; }}
    >
      {/* Botón editar cargo — solo admin/rrhh */}
      {esAdmin && !editando && (
        <button onClick={e=>{ e.stopPropagation(); setEditando(true); }}
          style={{ position:'absolute', top:6, right:6, background:`${color.bg}20`, border:'none', borderRadius:'50%', width:22, height:22, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', color:color.bg, fontWeight:900 }}
          title="Editar cargo funcional">✏️</button>
      )}

      {emp.foto_url
        ? <img src={emp.foto_url} alt="" style={{ width:grande?72:54, height:grande?72:54, borderRadius:'50%', objectFit:'cover', border:`3px solid ${color.bg}`, display:'block', margin:'0 auto 8px' }}/>
        : <div style={{ width:grande?72:54, height:grande?72:54, borderRadius:'50%', background:`${color.bg}15`, border:`3px solid ${color.bg}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:grande?24:18, color:color.bg, margin:'0 auto 8px', fontWeight:900 }}>
            {emp.nombre?.[0]}{emp.apellido_paterno?.[0]}
          </div>
      }
      <div style={{ fontWeight:800, fontSize:grande?14:12, color:'#1a1a2e', lineHeight:1.2 }}>{emp.nombre} {emp.apellido_paterno}</div>

      {/* Cargo funcional — editable para admin */}
      {editando ? (
        <div onClick={e=>e.stopPropagation()} style={{ marginTop:6 }}>
          <input value={cargo} onChange={e=>setCargo(e.target.value)}
            style={{ width:'100%', padding:'4px 8px', borderRadius:8, border:`1.5px solid ${color.bg}`, fontFamily:'Montserrat,sans-serif', fontSize:11, textAlign:'center', boxSizing:'border-box' }}
            autoFocus onKeyDown={e=>e.key==='Enter'&&guardarCargo(e)}/>
          <div style={{ display:'flex', gap:4, marginTop:6, justifyContent:'center' }}>
            <button onClick={guardarCargo} disabled={guardando}
              style={{ padding:'4px 12px', borderRadius:8, border:'none', background:color.bg, color:color.text||'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}>
              {guardando?'...':'✓'}
            </button>
            <button onClick={e=>{ e.stopPropagation(); setEditando(false); setCargo(emp.cargo_funcional||emp.puesto||''); }}
              style={{ padding:'4px 10px', borderRadius:8, border:`1px solid ${color.bg}`, background:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', color:color.bg, fontFamily:'Montserrat,sans-serif' }}>
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize:grande?11:10, color:color.bg, fontWeight:700, marginTop:3, lineHeight:1.3 }}>{cargoMostrar}</div>
      )}
    </div>
  );
}
