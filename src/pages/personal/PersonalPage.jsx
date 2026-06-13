import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BtnRegresar, BtnCerrarSesion } from '../../components/BotonesNav';
import AltaPersonal from '../../components/AltaPersonal';
import Bajas from '../../components/Bajas';
import Historial from '../../components/Historial';
import Usuarios from '../../components/Usuarios';
import api from '../../services/api';
import PerfilModal from '../../components/PerfilModal';

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

  const cargar = () => api.get('/api/empleados').then(r => setEmpleados(r.data)).catch(console.error);
  useEffect(() => { cargar(); }, []);

  const deptos = [...new Set(empleados.map(e => e.departamento).filter(Boolean))].sort();
  const filtrados = empleados.filter(e => {
    const nombre = `${e.nombre} ${e.apellido_paterno}`.toLowerCase();
    if (busqueda && !nombre.includes(busqueda.toLowerCase()) && !(e.puesto||'').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (depto && e.departamento !== depto) return false;
    return true;
  });

  return (
    <>
      {/* Filtros */}
      <div style={{ background:'#fff', borderRadius:16, padding:'16px 20px', marginBottom:24, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.07)' }}>
        <input placeholder="🔍 Buscar por nombre o puesto..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'10px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}/>
        <select value={depto} onChange={e=>setDepto(e.target.value)}
          style={{ padding:'10px 14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}>
          <option value="">Todos los departamentos</option>
          {deptos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#718096', fontWeight:700, background:'#f7f8fc', padding:'6px 14px', borderRadius:20 }}>{filtrados.length} empleados</span>
      </div>

      {/* Grid de cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:20 }}>
        {filtrados.map((e, i) => <CardEmpleado key={e.id} emp={e} index={i} onClick={()=>setSel(e)} />)}
      </div>

      {/* Modal perfil completo */}
      {sel && (
        <PerfilModal
          empleadoId={sel.id}
          onClose={() => { setSel(null); cargar(); }}
        />
      )}
    </>
  );
}

// ── Card empleado impacto ─────────────────────────────────
function CardEmpleado({ emp, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  const initials = `${emp.nombre?.[0]||''}${emp.apellido_paterno?.[0]||''}`;
  const GRADIENTS = [
    'linear-gradient(135deg,#6B0F2B,#9B1540)',
    'linear-gradient(135deg,#0a1f3d,#1a3a6b)',
    'linear-gradient(135deg,#1B5E20,#2E7D32)',
    'linear-gradient(135deg,#4A1D96,#6D28D9)',
    'linear-gradient(135deg,#92400E,#B45309)',
    'linear-gradient(135deg,#1e3a5f,#2a5298)',
  ];
  const grad = GRADIENTS[index % GRADIENTS.length];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'#fff', borderRadius:20, overflow:'hidden', cursor:'pointer',
        boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        border:'1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Banner superior con gradiente */}
      <div style={{ background:grad, height:70, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
        <div style={{ position:'absolute', bottom:-30, left:-10, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
        {/* Línea dorada */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.8),transparent)' }}/>
      </div>

      {/* Foto centrada sobre el banner */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:-36, position:'relative', zIndex:2 }}>
        {emp.foto_url
          ? <img src={emp.foto_url} alt="" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}/>
          : <div style={{ width:72, height:72, borderRadius:'50%', background:grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, color:'#fff', fontWeight:900, border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
              {initials}
            </div>
        }
      </div>

      {/* Info */}
      <div style={{ padding:'10px 18px 18px', textAlign:'center' }}>
        <div style={{ fontWeight:900, fontSize:15, color:'#1a1a2e', lineHeight:1.2, fontFamily:'Playfair Display,serif', fontStyle:'italic' }}>
          {emp.nombre} {emp.apellido_paterno}
        </div>
        <div style={{ fontSize:11, color:'#6B0F2B', fontWeight:700, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 }}>
          {emp.puesto||'—'}
        </div>
        <div style={{ fontSize:11, color:'#718096', marginTop:3 }}>{emp.departamento||'—'}</div>

        {/* Separador */}
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,#e2e8f0,transparent)', margin:'12px 0' }}/>

        {/* Info rápida */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, fontSize:11, color:'#718096' }}>
          {emp.email && <span title={emp.email}>📧 {emp.email.split('@')[0]}</span>}
          {emp.numero_empleado && <span>🪪 #{emp.numero_empleado}</span>}
        </div>

        {/* Botón ver perfil */}
        <div style={{
          marginTop:12, padding:'8px 0', borderRadius:10,
          background: hovered ? grad : '#f7f8fc',
          color: hovered ? '#fff' : '#718096',
          fontSize:12, fontWeight:800, letterSpacing:0.5,
          transition:'all 0.3s',
        }}>
          {hovered ? 'Ver perfil completo →' : 'Ver perfil'}
        </div>
      </div>
    </div>
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
  'direccion general': { bg:'#6B0F2B', text:'#fff', light:'#fff0f3', border:'#9B1540' },
  'administración':    { bg:'#8B5E3C', text:'#fff', light:'#FFF8F0', border:'#D4A574' },
  'administracion':    { bg:'#8B5E3C', text:'#fff', light:'#FFF8F0', border:'#D4A574' },
  'operaciones':       { bg:'#4B5563', text:'#fff', light:'#F3F4F6', border:'#6B7280' },
};

function getDeptColor(depto) {
  const key = (depto||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for (const [k,v] of Object.entries(DEPT_COLORS)) {
    const kn = k.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if (key.includes(kn)) return v;
  }
  return { bg:'#1a1a2e', text:'#fff', light:'#f0f0ff', border:'#1a1a2e' };
}

function Organigrama() {
  const [empleados, setEmpleados] = useState([]);
  const [sel, setSel] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [editandoJefe, setEditandoJefe] = useState(null);
  const [toast, setToast] = useState(null);
  const { rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);

  const mostrarToast = (msg, tipo='ok') => {
    setToast({msg,tipo}); setTimeout(()=>setToast(null),3000);
  };

  const cargar = () => api.get('/api/empleados')
    .then(r => setEmpleados(r.data.filter(e=>e.activo!==false)))
    .catch(console.error);

  useEffect(()=>{ cargar(); },[]);

  // Construir árbol jerárquico
  const buildTree = (emps) => {
    const map = {};
    emps.forEach(e => { map[e.id] = {...e, hijos:[], esAsistente:false}; });
    const roots = [];
    emps.forEach(e => {
      if (e.jefe_id && map[e.jefe_id]) {
        map[e.jefe_id].hijos.push(map[e.id]);
      } else {
        roots.push(map[e.id]);
      }
    });
    // Ordenar por nivel jerárquico
    const sortHijos = (node) => {
      node.hijos.sort((a,b)=>(a.nivel_jerarquico||0)-(b.nivel_jerarquico||0));
      node.hijos.forEach(sortHijos);
    };
    roots.sort((a,b)=>(a.nivel_jerarquico||0)-(b.nivel_jerarquico||0));
    roots.forEach(sortHijos);
    return roots;
  };

  const tree = buildTree(empleados);

  const moverBajoJefe = async (empId, jefeId) => {
    if (empId === jefeId) return;
    try {
      await api.put(`/api/empleados/${empId}`, { jefe_id: jefeId || null });
      await cargar();
      mostrarToast('✅ Jerarquía actualizada');
    } catch(e) { mostrarToast('❌ Error al actualizar','error'); }
  };

  const quitarJefe = async (empId) => {
    try {
      await api.put(`/api/empleados/${empId}`, { jefe_id: null });
      await cargar();
      mostrarToast('✅ Empleado movido a nivel raíz');
    } catch(e) { mostrarToast('❌ Error','error'); }
  };

  const guardarCargo = async (empId, cargo) => {
    try {
      await api.put(`/api/empleados/${empId}`, { cargo_funcional: cargo });
      await cargar();
      setEditandoJefe(null);
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{fontFamily:'Montserrat,sans-serif', minHeight:400}}>
      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',zIndex:9999,
          background:toast.tipo==='ok'?'#1B5E20':'#B71C1C',color:'#fff',
          padding:'12px 24px',borderRadius:14,fontWeight:700,fontSize:13,
          boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:4,color:'#718096',textTransform:'uppercase',marginBottom:6}}>ORGANIGRAMA</div>
        <div style={{fontSize:28,fontWeight:900,fontFamily:'Playfair Display,serif',fontStyle:'italic',color:'#1a1a2e'}}>SITT · Tijuana</div>
        <div style={{width:60,height:2,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',margin:'10px auto 0'}}/>
        {esAdmin && (
          <div style={{marginTop:12,fontSize:12,color:'#C9A84C',fontWeight:700,
            background:'rgba(201,168,76,0.1)',padding:'6px 16px',borderRadius:20,
            border:'1px solid rgba(201,168,76,0.3)',display:'inline-block'}}>
            ✋ Arrastra una tarjeta y suéltala sobre otra para crear jerarquía
          </div>
        )}
      </div>

      {/* Árbol */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
        {tree.map((node,i) => (
          <NodoOrg key={node.id} node={node} esAdmin={esAdmin} nivel={0}
            dragging={dragging} dragOver={dragOver}
            setDragging={setDragging} setDragOver={setDragOver}
            onDrop={moverBajoJefe} onQuitarJefe={quitarJefe}
            onClickEmp={setSel}
            editandoJefe={editandoJefe} setEditandoJefe={setEditandoJefe}
            onGuardarCargo={guardarCargo}
          />
        ))}
      </div>

      {sel && <ModalEmpleado emp={sel} onClose={()=>setSel(null)}/>}
    </div>
  );
}

// ── Nodo del árbol ────────────────────────────────────────
function NodoOrg({ node, esAdmin, nivel, dragging, dragOver, setDragging, setDragOver, onDrop, onQuitarJefe, onClickEmp, editandoJefe, setEditandoJefe, onGuardarCargo }) {
  const color = getDeptColor(node.departamento);
  const [cargo, setCargo] = useState(node.cargo_funcional || node.puesto || '');
  const tieneHijos = node.hijos && node.hijos.length > 0;
  const isDragOver = dragOver === node.id;
  const isDragging = dragging?.id === node.id;

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',opacity:isDragging?0.4:1}}>
      {/* Línea arriba si no es raíz */}
      {nivel > 0 && <div style={{width:2,height:24,background:'#C9A84C'}}/>}

      {/* Tarjeta */}
      <div
        draggable={esAdmin}
        onDragStart={esAdmin ? (e)=>{ e.dataTransfer.effectAllowed='move'; setDragging(node); } : undefined}
        onDragEnd={esAdmin ? ()=>{ setDragging(null); setDragOver(null); } : undefined}
        onDragOver={esAdmin ? (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; setDragOver(node.id); } : undefined}
        onDragLeave={esAdmin ? ()=>setDragOver(null) : undefined}
        onDrop={esAdmin ? (e)=>{ e.preventDefault(); e.stopPropagation(); if(dragging && dragging.id!==node.id){ onDrop(dragging.id, node.id); } setDragging(null); setDragOver(null); } : undefined}
        onClick={()=>onClickEmp(node)}
        style={{
          background:'#fff', borderRadius:16,
          padding: nivel===0 ? '18px 24px' : nivel===1 ? '14px 18px' : '10px 14px',
          textAlign:'center',
          border:`2px solid ${isDragOver ? '#C9A84C' : color.border}`,
          boxShadow: isDragOver
            ? '0 0 0 4px rgba(201,168,76,0.3), 0 8px 32px rgba(0,0,0,0.15)'
            : nivel===0 ? `0 8px 32px ${color.bg}30` : `0 4px 16px ${color.bg}20`,
          cursor: esAdmin ? 'grab' : 'pointer',
          width: nivel===0 ? 200 : nivel===1 ? 170 : 150,
          transition:'all 0.2s',
          position:'relative',
          zIndex: isDragOver ? 10 : 1,
          background: isDragOver ? color.light : '#fff',
        }}
        onMouseEnter={e=>{ if(!isDragging){ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 32px ${color.bg}40`; }}}
        onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=nivel===0?`0 8px 32px ${color.bg}30`:`0 4px 16px ${color.bg}20`; }}
      >
        {/* Badge nivel */}
        {nivel === 0 && (
          <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',
            background:color.bg,color:color.text,fontSize:8,fontWeight:900,
            padding:'2px 10px',borderRadius:20,letterSpacing:1,whiteSpace:'nowrap'}}>
            {(node.departamento||'').toUpperCase() || 'DIRECCIÓN'}
          </div>
        )}

        {/* Quitar jerarquía — solo admin y si tiene jefe */}
        {esAdmin && node.jefe_id && (
          <button onClick={e=>{e.stopPropagation();onQuitarJefe(node.id);}}
            title="Quitar de esta jerarquía"
            style={{position:'absolute',top:4,left:4,background:'rgba(200,0,0,0.1)',border:'none',
              borderRadius:'50%',width:18,height:18,cursor:'pointer',fontSize:10,color:'#B71C1C',
              display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900}}>
            ✕
          </button>
        )}

        {/* Foto */}
        {node.foto_url
          ? <img src={node.foto_url} alt="" style={{width:nivel===0?68:nivel===1?54:44,height:nivel===0?68:nivel===1?54:44,borderRadius:'50%',objectFit:'cover',border:`3px solid ${color.bg}`,display:'block',margin:'0 auto 8px'}}/>
          : <div style={{width:nivel===0?68:nivel===1?54:44,height:nivel===0?68:nivel===1?54:44,borderRadius:'50%',background:`${color.bg}20`,border:`3px solid ${color.bg}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:nivel===0?24:18,color:color.bg,margin:'0 auto 8px',fontWeight:900}}>
              {node.nombre?.[0]}{node.apellido_paterno?.[0]}
            </div>
        }

        <div style={{fontWeight:800,fontSize:nivel===0?14:12,color:'#1a1a2e',lineHeight:1.2}}>
          {node.nombre} {node.apellido_paterno}
        </div>

        {/* Cargo funcional editable */}
        {editandoJefe===node.id && esAdmin ? (
          <div onClick={e=>e.stopPropagation()} style={{marginTop:6}}>
            <input value={cargo} onChange={e=>setCargo(e.target.value)}
              style={{width:'100%',padding:'4px 8px',borderRadius:8,border:`1.5px solid ${color.bg}`,
                fontFamily:'Montserrat,sans-serif',fontSize:10,textAlign:'center',boxSizing:'border-box'}}
              autoFocus onKeyDown={e=>e.key==='Enter'&&onGuardarCargo(node.id,cargo)}/>
            <div style={{display:'flex',gap:4,marginTop:4,justifyContent:'center'}}>
              <button onClick={e=>{e.stopPropagation();onGuardarCargo(node.id,cargo);}}
                style={{padding:'3px 10px',borderRadius:8,border:'none',background:color.bg,color:color.text,fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
              <button onClick={e=>{e.stopPropagation();setEditandoJefe(null);setCargo(node.cargo_funcional||node.puesto||'');}}
                style={{padding:'3px 8px',borderRadius:8,border:`1px solid ${color.bg}`,background:'#fff',fontSize:10,cursor:'pointer',color:color.bg}}>✕</button>
            </div>
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginTop:3}}>
            <span style={{fontSize:nivel===0?11:10,color:color.bg,fontWeight:700,lineHeight:1.3}}>
              {node.cargo_funcional || node.puesto || '—'}
            </span>
            {esAdmin && (
              <button onClick={e=>{e.stopPropagation();setEditandoJefe(node.id);}}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:9,opacity:0.5,padding:0}}
                title="Editar cargo">✏️</button>
            )}
          </div>
        )}

        {/* Indicador drag over */}
        {isDragOver && esAdmin && (
          <div style={{position:'absolute',inset:0,borderRadius:16,border:`3px dashed #C9A84C`,
            display:'flex',alignItems:'center',justifyContent:'center',
            background:'rgba(201,168,76,0.08)',pointerEvents:'none'}}>
            <span style={{fontSize:11,fontWeight:800,color:'#C9A84C'}}>Soltar aquí</span>
          </div>
        )}
      </div>

      {/* Hijos */}
      {tieneHijos && (
        <>
          {/* Línea vertical */}
          <div style={{width:2,height:20,background:'#C9A84C'}}/>
          {/* Línea horizontal si hay más de 1 hijo */}
          {node.hijos.length > 1 && (
            <div style={{height:2,background:'#C9A84C',
              width:`${Math.min(node.hijos.length * (nivel===0?190:160), 900)}px`,
              maxWidth:'90vw'}}/>
          )}
          {/* Hijos */}
          <div style={{display:'flex',gap:nivel===0?'clamp(16px,3vw,48px)':'clamp(10px,2vw,28px)',
            flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start'}}>
            {node.hijos.map(hijo => (
              <NodoOrg key={hijo.id} node={hijo} esAdmin={esAdmin} nivel={Math.min(nivel+1,2)}
                dragging={dragging} dragOver={dragOver}
                setDragging={setDragging} setDragOver={setDragOver}
                onDrop={onDrop} onQuitarJefe={onQuitarJefe}
                onClickEmp={onClickEmp}
                editandoJefe={editandoJefe} setEditandoJefe={setEditandoJefe}
                onGuardarCargo={onGuardarCargo}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
