import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BtnRegresar, BtnCerrarSesion } from '../../components/BotonesNav';
import AltaPersonal from '../../components/AltaPersonal';
import Bajas from '../../components/Bajas';
import Historial from '../../components/Historial';
import Usuarios from '../../components/Usuarios';
import PerfilModal from '../../components/PerfilModal';
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
  const [seccion, setSeccion] = useState(() => rolEfectivo==='empleado' ? 'organigrama' : 'directorio');
  const navItems = NAV_ITEMS.filter(i => i.roles.includes(rolEfectivo));

  return (
    <div style={{ minHeight:'100vh', background:'#F7F8FC', fontFamily:'Montserrat,sans-serif' }}>
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

      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 20px', display:'flex', gap:4, overflowX:'auto' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setSeccion(item.id)}
            style={{ padding:'14px 18px', border:'none', background:'none', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:seccion===item.id?'#6B0F2B':'#718096', borderBottom:seccion===item.id?'3px solid #6B0F2B':'3px solid transparent', whiteSpace:'nowrap', transition:'all 0.2s' }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 16px' }}>
        {seccion==='directorio'  && <Directorio />}
        {seccion==='organigrama' && <Organigrama />}
        {seccion==='alta'        && <AltaPersonal onCreado={()=>setSeccion('directorio')} />}
        {seccion==='bajas'       && <Bajas />}
        {seccion==='historial'   && <Historial />}
        {seccion==='usuarios'    && <Usuarios />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DIRECTORIO
// ─────────────────────────────────────────────────────────
function Directorio() {
  const [empleados, setEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [depto, setDepto] = useState('');
  const [sel, setSel] = useState(null);

  const cargar = () => api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(console.error);
  useEffect(()=>{ cargar(); },[]);

  const deptos = [...new Set(empleados.map(e=>e.departamento).filter(Boolean))].sort();
  const filtrados = empleados.filter(e => {
    const nombre = `${e.nombre} ${e.apellido_paterno}`.toLowerCase();
    if (busqueda && !nombre.includes(busqueda.toLowerCase()) && !(e.puesto||'').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (depto && e.departamento !== depto) return false;
    return true;
  });

  const GRADIENTS = [
    'linear-gradient(135deg,#6B0F2B,#9B1540)',
    'linear-gradient(135deg,#0a1f3d,#1a3a6b)',
    'linear-gradient(135deg,#1B5E20,#2E7D32)',
    'linear-gradient(135deg,#4A1D96,#6D28D9)',
    'linear-gradient(135deg,#92400E,#B45309)',
    'linear-gradient(135deg,#1e3a5f,#2a5298)',
  ];

  return (
    <>
      <div style={{ background:'#fff', borderRadius:16, padding:'16px 20px', marginBottom:24, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.07)' }}>
        <input placeholder="🔍 Buscar por nombre o puesto..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'10px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}/>
        <select value={depto} onChange={e=>setDepto(e.target.value)}
          style={{ padding:'10px 14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}>
          <option value="">Todos los departamentos</option>
          {deptos.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#718096', fontWeight:700, background:'#f7f8fc', padding:'6px 14px', borderRadius:20 }}>{filtrados.length} empleados</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:20 }}>
        {filtrados.map((e,i) => {
          const grad = GRADIENTS[i%GRADIENTS.length];
          const initials = `${e.nombre?.[0]||''}${e.apellido_paterno?.[0]||''}`;
          return (
            <CardEmpleado key={e.id} emp={e} grad={grad} initials={initials} onClick={()=>setSel(e)} />
          );
        })}
      </div>

      {sel && <PerfilModal empleadoId={sel.id} onClose={()=>{ setSel(null); cargar(); }}/>}
    </>
  );
}

function CardEmpleado({ emp, grad, initials, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{ background:'#fff', borderRadius:20, overflow:'hidden', cursor:'pointer',
        boxShadow:hovered?'0 20px 50px rgba(0,0,0,0.15)':'0 4px 20px rgba(0,0,0,0.07)',
        transform:hovered?'translateY(-8px) scale(1.02)':'none',
        transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        border:'1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ background:grad, height:70, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.8),transparent)' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'center', marginTop:-36, position:'relative', zIndex:2 }}>
        {emp.foto_url
          ? <img src={emp.foto_url} alt="" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}/>
          : <div style={{ width:72, height:72, borderRadius:'50%', background:grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, color:'#fff', fontWeight:900, border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>{initials}</div>
        }
      </div>
      <div style={{ padding:'10px 18px 18px', textAlign:'center' }}>
        <div style={{ fontWeight:900, fontSize:15, color:'#1a1a2e', lineHeight:1.2, fontFamily:'Playfair Display,serif', fontStyle:'italic' }}>{emp.nombre} {emp.apellido_paterno}</div>
        <div style={{ fontSize:11, color:'#6B0F2B', fontWeight:700, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 }}>{emp.puesto||'—'}</div>
        <div style={{ fontSize:11, color:'#718096', marginTop:3 }}>{emp.departamento||'—'}</div>
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,#e2e8f0,transparent)', margin:'12px 0' }}/>
        <div style={{ display:'flex', justifyContent:'center', gap:16, fontSize:11, color:'#718096' }}>
          {emp.email && <span>📧 {emp.email.split('@')[0]}</span>}
          {emp.numero_empleado && <span>🪪 #{emp.numero_empleado}</span>}
        </div>
        <div style={{ marginTop:12, padding:'8px 0', borderRadius:10, background:hovered?grad:'#f7f8fc', color:hovered?'#fff':'#718096', fontSize:12, fontWeight:800, letterSpacing:0.5, transition:'all 0.3s' }}>
          {hovered?'Ver perfil completo →':'Ver perfil'}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ORGANIGRAMA
// ─────────────────────────────────────────────────────────
const DEPT_COLORS = {
  'direccion general': { bg:'#6B0F2B', text:'#fff', border:'#9B1540', light:'#fff0f3' },
  'administración':    { bg:'#8B5E3C', text:'#fff', border:'#D4A574', light:'#FFF8F0' },
  'administracion':    { bg:'#8B5E3C', text:'#fff', border:'#D4A574', light:'#FFF8F0' },
  'operaciones':       { bg:'#4B5563', text:'#fff', border:'#6B7280', light:'#F3F4F6' },
};

function getDeptColor(depto) {
  const key = (depto||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for (const [k,v] of Object.entries(DEPT_COLORS)) {
    const kn = k.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if (key.includes(kn)) return v;
  }
  return { bg:'#1a1a2e', text:'#fff', border:'#1a1a2e', light:'#f0f0ff' };
}

function Organigrama() {
  const [empleados, setEmpleados] = useState([]);
  const [sel, setSel] = useState(null);
  const [panelId, setPanelId] = useState(null);
  const [toast, setToast] = useState(null);
  const { rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);

  const mostrarToast = (msg, tipo='ok') => { setToast({msg,tipo}); setTimeout(()=>setToast(null),3000); };
  const cargar = () => api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(console.error);
  useEffect(()=>{ cargar(); },[]);

  const buildTree = (emps) => {
    const map = {};
    emps.forEach(e=>{ map[e.id]={...e,hijos:[]}; });
    const roots = [];
    emps.forEach(e=>{
      if (e.jefe_id && map[e.jefe_id]) map[e.jefe_id].hijos.push(map[e.id]);
      else roots.push(map[e.id]);
    });
    const sort = arr => { arr.sort((a,b)=>(a.nivel_jerarquico||0)-(b.nivel_jerarquico||0)); arr.forEach(n=>sort(n.hijos)); };
    sort(roots);
    return roots;
  };

  const tree = buildTree(empleados);

  const actualizarEmp = async (empId, datos) => {
    try {
      await api.put(`/api/empleados/${empId}`, datos);
      await cargar();
      mostrarToast('✅ Organigrama actualizado');
      setPanelId(null);
    } catch(e) { mostrarToast('❌ Error al actualizar','error'); }
  };

  return (
    <div style={{fontFamily:'Montserrat,sans-serif'}}>
      {toast && (
        <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',zIndex:9999,
          background:toast.tipo==='ok'?'#1B5E20':'#B71C1C',color:'#fff',
          padding:'12px 24px',borderRadius:14,fontWeight:700,fontSize:13,boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
          {toast.msg}
        </div>
      )}
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:4,color:'#718096',textTransform:'uppercase',marginBottom:6}}>ORGANIGRAMA</div>
        <div style={{fontSize:28,fontWeight:900,fontFamily:'Playfair Display,serif',fontStyle:'italic',color:'#1a1a2e'}}>SITT · Tijuana</div>
        <div style={{width:60,height:2,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',margin:'10px auto 0'}}/>
        {esAdmin && <div style={{marginTop:10,fontSize:12,color:'#6B0F2B',fontWeight:700,background:'rgba(107,15,43,0.06)',padding:'6px 16px',borderRadius:20,border:'1px solid rgba(107,15,43,0.15)',display:'inline-block'}}>⚙️ Usa el botón de cada persona para editar su jerarquía</div>}
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',overflowX:'auto',paddingBottom:20}}>
        <div style={{display:'flex',gap:'clamp(12px,3vw,40px)',justifyContent:'center',alignItems:'flex-start',flexWrap:'wrap'}}>
          {tree.map(node=>(
            <NodoOrg key={node.id} node={node} nivel={0} esAdmin={esAdmin} empleados={empleados}
              panelId={panelId} setPanelId={setPanelId}
              onActualizar={actualizarEmp} onClickEmp={setSel}/>
          ))}
        </div>
      </div>
      {/* Empleados sin jerarquía asignada */}
      {(() => {
        const map = {};
        empleados.forEach(e=>{ map[e.id]=true; });
        const enArbol = new Set();
        const marcar = (nodes) => nodes.forEach(n=>{ enArbol.add(n.id); marcar(n.hijos||[]); });
        marcar(tree);
        const sinJerarquia = empleados.filter(e=>!enArbol.has(e.id));
        if (!sinJerarquia.length) return null;
        return (
          <div style={{marginTop:40,borderTop:'2px dashed #e2e8f0',paddingTop:24}}>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:3,color:'#718096',textTransform:'uppercase'}}>Sin jerarquía asignada</div>
              {esAdmin && <div style={{fontSize:11,color:'#C9A84C',marginTop:4}}>Usa ⚙️ para asignarlos al organigrama</div>}
            </div>
            <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
              {sinJerarquia.map(e=>{
                const color = getDeptColor(e.departamento);
                return (
                  <div key={e.id} onClick={()=>setSel(e)}
                    style={{background:'#fff',borderRadius:14,padding:'12px 16px',textAlign:'center',
                      border:`2px dashed ${color.border}`,cursor:'pointer',width:148,
                      boxShadow:'0 2px 8px rgba(0,0,0,0.06)',transition:'all 0.2s',opacity:0.8}}
                    onMouseEnter={ev=>{ev.currentTarget.style.opacity='1';ev.currentTarget.style.transform='translateY(-3px)';}}
                    onMouseLeave={ev=>{ev.currentTarget.style.opacity='0.8';ev.currentTarget.style.transform='none';}}>
                    {e.foto_url
                      ? <img src={e.foto_url} alt="" style={{width:48,height:48,borderRadius:'50%',objectFit:'cover',border:`2px solid ${color.bg}`,display:'block',margin:'0 auto 6px'}}/>
                      : <div style={{width:48,height:48,borderRadius:'50%',background:`${color.bg}18`,border:`2px solid ${color.bg}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:color.bg,margin:'0 auto 6px',fontWeight:900}}>{e.nombre?.[0]}{e.apellido_paterno?.[0]}</div>
                    }
                    <div style={{fontWeight:800,fontSize:11,color:'#1a1a2e',lineHeight:1.2}}>{e.nombre} {e.apellido_paterno}</div>
                    <div style={{fontSize:9,color:color.bg,fontWeight:700,marginTop:2}}>{e.cargo_funcional||e.puesto||'—'}</div>
                    {esAdmin && (
                      <button onClick={ev=>{ev.stopPropagation();setPanelId(e.id);}}
                        style={{marginTop:8,padding:'4px 10px',borderRadius:20,border:`1px solid ${color.border}`,background:'transparent',color:color.bg,fontSize:9,fontWeight:800,cursor:'pointer',fontFamily:'Montserrat,sans-serif',width:'100%'}}>
                        ⚙️ Asignar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {sel && <ModalOrgEmpleado emp={sel} onClose={()=>setSel(null)}/>}
      {panelId && esAdmin && (() => {
        const empPanel = empleados.find(e=>e.id===panelId);
        return empPanel ? (
          <div className="modal-overlay" onClick={()=>setPanelId(null)}>
            <div onClick={e=>e.stopPropagation()}>
              <PanelJerarquia emp={empPanel} empleados={empleados}
                color={getDeptColor(empPanel.departamento)}
                onActualizar={actualizarEmp} onCerrar={()=>setPanelId(null)}/>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}

function NodoOrg({ node, nivel, esAdmin, empleados, panelId, setPanelId, onActualizar, onClickEmp }) {
  const color = getDeptColor(node.departamento);
  const [cargoBorrador, setCargoBorrador] = useState(node.cargo_funcional||node.puesto||'');
  const [editandoCargo, setEditandoCargo] = useState(false);
  const tieneHijos = node.hijos && node.hijos.length > 0;
  const panelAbierto = panelId === node.id;
  const w = nivel===0?200:nivel===1?170:148;
  const fotoSize = nivel===0?68:nivel===1?54:44;

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
      {nivel>0 && <div style={{width:2,height:24,background:'#C9A84C'}}/>}
      <div style={{position:'relative'}}>
        <div onClick={()=>{ if(!panelAbierto&&!editandoCargo) onClickEmp(node); }}
          style={{background:'#fff',borderRadius:16,padding:nivel===0?'20px 20px 14px':nivel===1?'14px 16px 10px':'10px 12px 8px',
            textAlign:'center',border:`2px solid ${color.border}`,
            boxShadow:nivel===0?`0 8px 32px ${color.bg}25`:`0 4px 16px ${color.bg}15`,
            cursor:'pointer',width:w,transition:'all 0.2s',position:'relative'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 12px 32px ${color.bg}40`;}}
          onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=nivel===0?`0 8px 32px ${color.bg}25`:`0 4px 16px ${color.bg}15`;}}>

          {nivel===0 && <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:color.bg,color:color.text,fontSize:8,fontWeight:900,padding:'2px 10px',borderRadius:20,letterSpacing:1,whiteSpace:'nowrap',zIndex:2}}>{(node.departamento||'GENERAL').toUpperCase()}</div>}
          {node.es_asistente && <div style={{position:'absolute',top:-8,right:8,background:'#C9A84C',color:'#fff',fontSize:7,fontWeight:900,padding:'2px 6px',borderRadius:10}}>ASISTENTE</div>}

          {node.foto_url
            ? <img src={node.foto_url} alt="" style={{width:fotoSize,height:fotoSize,borderRadius:'50%',objectFit:'cover',border:`3px solid ${color.bg}`,display:'block',margin:'0 auto 8px'}}/>
            : <div style={{width:fotoSize,height:fotoSize,borderRadius:'50%',background:`${color.bg}18`,border:`3px solid ${color.bg}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:nivel===0?24:18,color:color.bg,margin:'0 auto 8px',fontWeight:900}}>{node.nombre?.[0]}{node.apellido_paterno?.[0]}</div>
          }
          <div style={{fontWeight:800,fontSize:nivel===0?14:nivel===1?12:11,color:'#1a1a2e',lineHeight:1.2}}>{node.nombre} {node.apellido_paterno}</div>

          {editandoCargo&&esAdmin ? (
            <div onClick={e=>e.stopPropagation()} style={{marginTop:6}}>
              <input value={cargoBorrador} onChange={e=>setCargoBorrador(e.target.value)}
                style={{width:'100%',padding:'4px 8px',borderRadius:8,border:`1.5px solid ${color.bg}`,fontFamily:'Montserrat,sans-serif',fontSize:10,textAlign:'center',boxSizing:'border-box'}}
                autoFocus onKeyDown={e=>{if(e.key==='Enter'){onActualizar(node.id,{cargo_funcional:cargoBorrador});setEditandoCargo(false);}}}/>
              <div style={{display:'flex',gap:4,marginTop:4,justifyContent:'center'}}>
                <button onClick={e=>{e.stopPropagation();onActualizar(node.id,{cargo_funcional:cargoBorrador});setEditandoCargo(false);}} style={{padding:'3px 10px',borderRadius:8,border:'none',background:color.bg,color:color.text,fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                <button onClick={e=>{e.stopPropagation();setEditandoCargo(false);setCargoBorrador(node.cargo_funcional||node.puesto||'');}} style={{padding:'3px 8px',borderRadius:8,border:`1px solid ${color.bg}`,background:'#fff',fontSize:10,cursor:'pointer',color:color.bg}}>✕</button>
              </div>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginTop:3}}>
              <span style={{fontSize:nivel===0?11:10,color:color.bg,fontWeight:700,lineHeight:1.3}}>{node.cargo_funcional||node.puesto||'—'}</span>
              {esAdmin && <button onClick={e=>{e.stopPropagation();setEditandoCargo(true);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:9,opacity:0.4,padding:0}} title="Editar cargo">✏️</button>}
            </div>
          )}

          {esAdmin && (
            <button onClick={e=>{e.stopPropagation();setPanelId(panelAbierto?null:node.id);}}
              style={{marginTop:8,padding:'5px 12px',borderRadius:20,border:`1px solid ${color.border}`,background:panelAbierto?color.bg:'transparent',color:panelAbierto?color.text:color.bg,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:'Montserrat,sans-serif',width:'100%',transition:'all 0.2s'}}>
              ⚙️ Jerarquía {panelAbierto?'▲':'▼'}
            </button>
          )}
        </div>


      </div>

      {tieneHijos && (
        <>
          <div style={{width:2,height:20,background:'#C9A84C'}}/>
          {node.hijos.length>1 && <div style={{height:2,background:'#C9A84C',width:`${Math.min(node.hijos.length*(nivel===0?185:155),860)}px`,maxWidth:'88vw'}}/>}
          <div style={{display:'flex',gap:nivel===0?'clamp(10px,2.5vw,36px)':'clamp(6px,1.5vw,20px)',flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start'}}>
            {node.hijos.map(hijo=>(
              <NodoOrg key={hijo.id} node={hijo} nivel={Math.min(nivel+1,2)} esAdmin={esAdmin} empleados={empleados}
                panelId={panelId} setPanelId={setPanelId} onActualizar={onActualizar} onClickEmp={onClickEmp}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PanelJerarquia({ emp, empleados, color, onActualizar, onCerrar }) {
  // Modal panel — no position absolute needed
  const [jefeId, setJefeId] = useState(emp.jefe_id||'');
  const [esAsistente, setEsAsistente] = useState(emp.es_asistente||false);
  const [depto, setDepto] = useState(emp.departamento||'');
  const [deptoNuevo, setDeptoNuevo] = useState('');
  const [nivel, setNivel] = useState(emp.nivel_jerarquico||0);

  const deptos = [...new Set(empleados.map(e=>e.departamento).filter(Boolean))].sort();
  const posiblesJefes = empleados.filter(e=>e.id!==emp.id);

  const guardar = () => {
    const dFinal = depto==='__nuevo__' ? deptoNuevo : depto;
    onActualizar(emp.id,{ 
      jefe_id: jefeId==='__sin_jerarquia__' ? '__sin_jerarquia__' : (jefeId||null), 
      es_asistente:esAsistente, 
      departamento:dFinal||emp.departamento, 
      nivel_jerarquico:parseInt(nivel)||0 
    });
  };

  return (
    <div style={{background:'#fff',borderRadius:20,padding:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',width:'min(320px,92vw)',border:`2px solid ${color.border}`}}>
      <div style={{fontWeight:800,fontSize:12,color:color.bg,marginBottom:12,textAlign:'center'}}>⚙️ {emp.nombre} {emp.apellido_paterno}</div>

      <label style={{display:'block',fontSize:10,fontWeight:700,color:'#718096',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Reporta a (jefe directo)</label>
      <select value={jefeId} onChange={e=>setJefeId(e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:9,border:`1.5px solid ${color.border}`,fontFamily:'Montserrat,sans-serif',fontSize:12,marginBottom:10,boxSizing:'border-box'}}>
        <option value="">— Sin jefe (nivel raíz) —</option>
        <option value="__sin_jerarquia__">📌 Sin jerarquía asignada</option>
        {posiblesJefes.map(e=><option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>)}
      </select>

      <label style={{display:'block',fontSize:10,fontWeight:700,color:'#718096',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Departamento</label>
      <select value={depto} onChange={e=>setDepto(e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:9,border:`1.5px solid ${color.border}`,fontFamily:'Montserrat,sans-serif',fontSize:12,marginBottom:depto==='__nuevo__'?6:10,boxSizing:'border-box'}}>
        <option value="">— Sin departamento —</option>
        {deptos.map(d=><option key={d} value={d}>{d}</option>)}
        <option value="__nuevo__">➕ Nuevo departamento...</option>
      </select>

      {depto==='__nuevo__' && (
        <input placeholder="Nombre del departamento" value={deptoNuevo} onChange={e=>setDeptoNuevo(e.target.value)}
          style={{width:'100%',padding:'7px 10px',borderRadius:9,border:`1.5px solid ${color.border}`,fontFamily:'Montserrat,sans-serif',fontSize:12,marginBottom:10,boxSizing:'border-box'}}/>
      )}

      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:10}}>
        <input type="checkbox" checked={esAsistente} onChange={e=>setEsAsistente(e.target.checked)} style={{accentColor:color.bg,width:14,height:14}}/>
        <span style={{fontSize:11,fontWeight:700,color:'#4A5568'}}>Es asistente</span>
      </label>

      <label style={{display:'block',fontSize:10,fontWeight:700,color:'#718096',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Prioridad (0 = primero)</label>
      <input type="number" min="0" max="99" value={nivel} onChange={e=>setNivel(e.target.value)}
        style={{width:'100%',padding:'7px 10px',borderRadius:9,border:`1.5px solid ${color.border}`,fontFamily:'Montserrat,sans-serif',fontSize:12,marginBottom:12,boxSizing:'border-box'}}/>

      <div style={{display:'flex',gap:8}}>
        <button onClick={onCerrar} style={{flex:1,padding:'8px',borderRadius:9,border:`1px solid ${color.border}`,background:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,color:'#718096'}}>Cancelar</button>
        <button onClick={guardar} style={{flex:2,padding:'8px',borderRadius:9,border:'none',background:color.bg,color:color.text,cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12}}>✓ Guardar</button>
      </div>
    </div>
  );
}

function ModalOrgEmpleado({ emp, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={{background:'#fff',borderRadius:20,maxWidth:380,width:'95%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{background:'linear-gradient(135deg,#6B0F2B,#9B1540)',padding:'24px',textAlign:'center',position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:28,height:28,borderRadius:'50%',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          {emp.foto_url
            ? <img src={emp.foto_url} alt="" style={{width:90,height:90,borderRadius:'50%',objectFit:'cover',border:'4px solid #C9A84C',marginBottom:12}}/>
            : <div style={{width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,color:'#C9A84C',margin:'0 auto 12px',fontWeight:900}}>{emp.nombre?.[0]}{emp.apellido_paterno?.[0]}</div>
          }
          <div style={{fontSize:20,fontWeight:900,color:'#fff',fontFamily:'Playfair Display,serif',fontStyle:'italic'}}>{emp.nombre} {emp.apellido_paterno}</div>
          <div style={{fontSize:13,color:'#C9A84C',fontWeight:700,marginTop:4}}>{emp.cargo_funcional||emp.puesto||'—'}</div>
        </div>
        <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:10}}>
          {[['🏢 Departamento',emp.departamento],['📧 Correo',emp.email]].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
              <span style={{fontSize:13,color:'#718096',fontWeight:600}}>{l}</span>
              <span style={{fontSize:13,color:'#1a1a2e',fontWeight:700}}>{v||'—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
