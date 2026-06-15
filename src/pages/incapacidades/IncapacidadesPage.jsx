import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BtnRegresar, BtnCerrarSesion } from '../../components/BotonesNav';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TIPOS = {
  imss_general:          { label:'IMSS General',          icon:'🏥', color:'#2563EB' },
  maternidad:            { label:'Maternidad',            icon:'🤱', color:'#DB2777' },
  riesgo_trabajo:        { label:'Riesgo de Trabajo',     icon:'⚠️', color:'#D97706' },
  enfermedad_profesional:{ label:'Enfermedad Profesional',icon:'🧬', color:'#7C3AED' },
};

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-');
  return new Date(parseInt(y),parseInt(m)-1,parseInt(d)).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
}

export default function IncapacidadesPage() {
  const { rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);
  const [tab, setTab] = useState('incapacidades');
  const [incapacidades, setIncapacidades] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [modalReceta, setModalReceta] = useState(false);
  const [modalVerReceta, setModalVerReceta] = useState(null);
  const [modalPDF, setModalPDF] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [toast, setToast] = useState(null);
  const [filtroEmp, setFiltroEmp] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');
  const [stats, setStats] = useState(null);

  const mostrarToast = (msg, tipo='ok') => { setToast({msg,tipo}); setTimeout(()=>setToast(null),4000); };

  const cargar = async () => {
    setCargando(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get('/api/incapacidades'),
        api.get('/api/incapacidades/recetas'),
      ]);
      setIncapacidades(r1.data);
      setRecetas(r2.data);
      if (esAdmin) {
        const s = await api.get('/api/incapacidades/stats');
        setStats(s.data);
      }
    } catch(e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const deptos = [...new Set(incapacidades.map(i=>i.departamento).filter(Boolean))].sort();

  const filtradas = incapacidades.filter(i => {
    if (filtroEmp && !`${i.nombre} ${i.apellido_paterno}`.toLowerCase().includes(filtroEmp.toLowerCase())) return false;
    if (filtroDepto && i.departamento !== filtroDepto) return false;
    return true;
  });

  const recetasFiltradas = recetas.filter(r => {
    if (filtroEmp && !`${r.nombre} ${r.apellido_paterno}`.toLowerCase().includes(filtroEmp.toLowerCase())) return false;
    if (filtroDepto && r.departamento !== filtroDepto) return false;
    return true;
  });

  return (
    <div style={{minHeight:'100vh',background:'#F7F8FC',fontFamily:'Montserrat,sans-serif'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1B5E20,#2E7D32,#388E3C)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',fontWeight:700,letterSpacing:2,textTransform:'uppercase'}}>SITT · Control de</div>
          <div style={{fontSize:28,fontWeight:900,color:'#fff',fontFamily:'Playfair Display,serif',fontStyle:'italic'}}>Incapacidades</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          {esAdmin && tab==='incapacidades' && (
            <button onClick={()=>setModalNueva(true)} style={{padding:'8px 20px',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,background:'rgba(255,255,255,0.2)',color:'#fff'}}>
              ➕ Registrar incapacidad
            </button>
          )}
          {esAdmin && tab==='recetas' && (
            <button onClick={()=>setModalReceta(true)} style={{padding:'8px 20px',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,background:'rgba(255,255,255,0.2)',color:'#fff'}}>
              📷 Subir receta
            </button>
          )}
          <BtnRegresar />
          <BtnCerrarSesion />
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 20px',display:'flex',gap:4}}>
        {[
          {id:'incapacidades',label:'🏥 Incapacidades'},
          {id:'recetas',label:'📋 Recetas médicas'},
          ...(esAdmin?[{id:'estadisticas',label:'📊 Estadísticas'}]:[]),
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:'14px 18px',border:'none',background:'none',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,color:tab===t.id?'#1B5E20':'#718096',borderBottom:tab===t.id?'3px solid #1B5E20':'3px solid transparent',whiteSpace:'nowrap',transition:'all 0.2s'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 16px'}}>
        {toast && (
          <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',zIndex:9999,background:toast.tipo==='ok'?'#1B5E20':'#B71C1C',color:'#fff',padding:'14px 24px',borderRadius:14,fontWeight:700,fontSize:13,boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
            {toast.msg}
          </div>
        )}

        {/* Filtros */}
        {(tab==='incapacidades'||tab==='recetas') && esAdmin && (
          <div style={{background:'#fff',borderRadius:14,padding:'16px 20px',marginBottom:20,display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <input placeholder="🔍 Buscar empleado..." value={filtroEmp} onChange={e=>setFiltroEmp(e.target.value)}
              style={{flex:1,minWidth:180,padding:'8px 14px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13}}/>
            <select value={filtroDepto} onChange={e=>setFiltroDepto(e.target.value)}
              style={{padding:'8px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13}}>
              <option value="">Todos los departamentos</option>
              {deptos.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        {/* INCAPACIDADES */}
        {tab==='incapacidades' && (
          cargando ? <div style={{textAlign:'center',padding:60}}><div style={{fontSize:40}}>⏳</div><p>Cargando...</p></div>
          : filtradas.length===0 ? (
            <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:16,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:48,marginBottom:12}}>🏥</div>
              <p style={{fontWeight:700,color:'#718096'}}>No hay incapacidades registradas</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {filtradas.map(inc => (
                <TarjetaIncapacidad key={inc.id} inc={inc} esAdmin={esAdmin}
                  onEditar={()=>setModalEditar(inc)}
                  onEliminar={async()=>{ if(!window.confirm('¿Eliminar?'))return; await api.delete(`/api/incapacidades/${inc.id}`); cargar(); mostrarToast('✅ Eliminada'); }}
                  onPDF={()=>setModalPDF(inc)}
                />
              ))}
            </div>
          )
        )}

        {/* RECETAS */}
        {tab==='recetas' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
            {recetasFiltradas.map(r=>(
              <div key={r.id} style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',border:'1px solid #f0f0f0',cursor:'pointer',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)';}}>
                <div onClick={()=>setModalVerReceta(r)} style={{aspectRatio:'4/3',overflow:'hidden',background:'#f7f8fc'}}>
                  <img src={r.foto_url} alt="Receta" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
                <div style={{padding:'12px 14px'}}>
                  {esAdmin && <div style={{fontWeight:800,fontSize:13,color:'#1a1a2e'}}>{r.nombre} {r.apellido_paterno}</div>}
                  <div style={{fontSize:11,color:'#718096',marginTop:2}}>{fmtFecha(r.fecha)}</div>
                  {r.descripcion && <div style={{fontSize:11,color:'#4A5568',marginTop:4,fontStyle:'italic'}}>"{r.descripcion}"</div>}
                  <div style={{display:'flex',gap:8,marginTop:10}}>
                    <button onClick={()=>setModalVerReceta(r)} style={{flex:1,padding:'6px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:11,fontWeight:700,color:'#1B5E20',fontFamily:'Montserrat,sans-serif'}}>🔍 Ver</button>
                    {esAdmin && <button onClick={async()=>{ if(!window.confirm('¿Eliminar receta?'))return; await api.delete(`/api/incapacidades/recetas/${r.id}`); cargar(); mostrarToast('✅ Receta eliminada'); }} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #FED7D7',background:'#FFF5F5',cursor:'pointer',fontSize:11,fontWeight:700,color:'#B71C1C',fontFamily:'Montserrat,sans-serif'}}>🗑️</button>}
                  </div>
                </div>
              </div>
            ))}
            {recetasFiltradas.length===0 && (
              <div style={{gridColumn:'1/-1',textAlign:'center',padding:60,background:'#fff',borderRadius:16}}>
                <div style={{fontSize:48,marginBottom:12}}>📋</div>
                <p style={{fontWeight:700,color:'#718096'}}>No hay recetas registradas</p>
              </div>
            )}
          </div>
        )}

        {/* ESTADÍSTICAS */}
        {tab==='estadisticas' && esAdmin && stats && (
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {/* Cards resumen */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14}}>
              {[
                {label:'Total',val:stats.total,color:'#1B5E20',icon:'🏥'},
                {label:'Días totales',val:stats.total_dias||0,color:'#2563EB',icon:'📅'},
                {label:'Con goce',val:stats.con_goce,color:'#059669',icon:'💰'},
                {label:'Sin goce',val:stats.sin_goce,color:'#6B7280',icon:'🚫'},
              ].map(k=>(
                <div key={k.label} style={{background:'#fff',borderRadius:14,padding:'16px 20px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',borderTop:`3px solid ${k.color}`}}>
                  <div style={{fontSize:24,marginBottom:6}}>{k.icon}</div>
                  <div style={{fontSize:32,fontWeight:900,color:k.color,fontFamily:'Playfair Display,serif',fontStyle:'italic'}}>{k.val||0}</div>
                  <div style={{fontSize:11,color:'#718096',fontWeight:700,textTransform:'uppercase',marginTop:4}}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Gráfica por tipo */}
            <div style={{background:'#fff',borderRadius:16,padding:'20px 24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <div style={{fontWeight:800,color:'#1a1a2e',marginBottom:16,fontSize:14}}>Por tipo de incapacidad</div>
              {[
                {label:'IMSS General',val:parseInt(stats.imss_general)||0,color:'#2563EB',icon:'🏥'},
                {label:'Maternidad',val:parseInt(stats.maternidad)||0,color:'#DB2777',icon:'🤱'},
                {label:'Riesgo de Trabajo',val:parseInt(stats.riesgo_trabajo)||0,color:'#D97706',icon:'⚠️'},
                {label:'Enf. Profesional',val:parseInt(stats.enfermedad_profesional)||0,color:'#7C3AED',icon:'🧬'},
              ].map(t=>{
                const total = parseInt(stats.total)||1;
                const pct = Math.round(t.val/total*100);
                return (
                  <div key={t.label} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,alignItems:'center'}}>
                      <span style={{fontSize:13,fontWeight:700,color:'#4A5568'}}>{t.icon} {t.label}</span>
                      <span style={{fontSize:13,fontWeight:800,color:t.color}}>{t.val} ({pct}%)</span>
                    </div>
                    <div style={{height:10,background:'#f0f0f0',borderRadius:5,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:t.color,borderRadius:5,transition:'width 0.6s ease'}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gráfica goce */}
            <div style={{background:'#fff',borderRadius:16,padding:'20px 24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <div style={{fontWeight:800,color:'#1a1a2e',marginBottom:16,fontSize:14}}>Con goce vs Sin goce</div>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <div style={{flex:parseInt(stats.con_goce)||1,height:32,background:'linear-gradient(90deg,#059669,#10b981)',borderRadius:'8px 0 0 8px',display:'flex',alignItems:'center',paddingLeft:10,color:'#fff',fontSize:11,fontWeight:800,minWidth:40}}>
                  💰 {stats.con_goce}
                </div>
                <div style={{flex:parseInt(stats.sin_goce)||1,height:32,background:'linear-gradient(90deg,#6B7280,#9CA3AF)',borderRadius:'0 8px 8px 0',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:10,color:'#fff',fontSize:11,fontWeight:800,minWidth:40}}>
                  {stats.sin_goce} 🚫
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                <span style={{fontSize:11,color:'#059669',fontWeight:700}}>Con goce de sueldo</span>
                <span style={{fontSize:11,color:'#6B7280',fontWeight:700}}>Sin goce de sueldo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {modalNueva && <ModalNuevaIncapacidad onClose={()=>setModalNueva(false)} onGuardado={()=>{cargar();setModalNueva(false);mostrarToast('✅ Incapacidad registrada');}}/>}
      {modalEditar && <ModalEditarIncapacidad inc={modalEditar} onClose={()=>setModalEditar(null)} onGuardado={()=>{cargar();setModalEditar(null);mostrarToast('✅ Incapacidad actualizada');}}/>}
      {modalReceta && <ModalSubirReceta incapacidades={incapacidades} onClose={()=>setModalReceta(false)} onGuardado={()=>{cargar();setModalReceta(false);mostrarToast('✅ Receta subida');}}/>}
      {modalVerReceta && (
        <div className="modal-overlay" onClick={()=>setModalVerReceta(null)}>
          <div style={{maxWidth:700,width:'95%',background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}} onClick={e=>e.stopPropagation()}>
            <div style={{background:'linear-gradient(135deg,#1B5E20,#2E7D32)',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'#fff',fontWeight:800,fontFamily:'Montserrat,sans-serif'}}>📋 Receta médica{esAdmin?` — ${modalVerReceta.nombre} ${modalVerReceta.apellido_paterno}`:''}</span>
              <button style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}} onClick={()=>setModalVerReceta(null)}>✕</button>
            </div>
            <div style={{padding:20}}>
              <img src={modalVerReceta.foto_url} alt="Receta" style={{width:'100%',borderRadius:10,maxHeight:'70vh',objectFit:'contain'}}/>
              <div style={{marginTop:12,textAlign:'center'}}>
                <a href={modalVerReceta.foto_url} target="_blank" rel="noreferrer" style={{padding:'10px 20px',background:'#1B5E20',color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700,fontSize:13,fontFamily:'Montserrat,sans-serif'}}>🔗 Abrir en nueva pestaña</a>
              </div>
            </div>
          </div>
        </div>
      )}
      {modalPDF && <ModalPDFIncapacidad inc={modalPDF} onClose={()=>setModalPDF(null)}/>}
    </div>
  );
}

// ── Tarjeta incapacidad ───────────────────────────────────
function TarjetaIncapacidad({ inc, esAdmin, onEditar, onEliminar, onPDF }) {
  const tipo = TIPOS[inc.tipo] || { label:inc.tipo, icon:'🏥', color:'#1B5E20' };
  return (
    <div style={{background:'#fff',borderRadius:16,padding:'18px 22px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',borderLeft:`4px solid ${tipo.color}`,display:'flex',gap:16,flexWrap:'wrap',alignItems:'flex-start'}}>
      {esAdmin && (
        inc.foto_url
          ? <img src={inc.foto_url} alt="" style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',border:'2px solid #e2e8f0',flexShrink:0}}/>
          : <div style={{width:52,height:52,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>👤</div>
      )}
      <div style={{flex:1,minWidth:200}}>
        {esAdmin && <div style={{fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:17,color:'#0a1f3d'}}>{inc.nombre} {inc.apellido_paterno} <span style={{fontSize:12,fontWeight:600,color:'#718096',fontFamily:'Montserrat,sans-serif',fontStyle:'normal'}}>{inc.puesto||''}</span></div>}
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:esAdmin?4:0}}>
          <span style={{fontSize:20}}>{tipo.icon}</span>
          <span style={{fontWeight:800,fontSize:15,color:tipo.color}}>{tipo.label}</span>
          <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:800,background:`${inc.con_goce?'#E8F5E9':'#F5F5F5'}`,color:inc.con_goce?'#1B5E20':'#6B7280'}}>
            {inc.con_goce?'💰 Con goce':'🚫 Sin goce'}
          </span>
        </div>
        <div style={{marginTop:8,fontSize:13,color:'#4A5568',display:'flex',gap:16,flexWrap:'wrap'}}>
          <span>📅 {fmtFecha(inc.fecha_inicio)} → {fmtFecha(inc.fecha_fin)}</span>
          <span>🗓️ <strong>{inc.dias}</strong> días</span>
          {inc.folio_imss && <span>📄 Folio: {inc.folio_imss}</span>}
        </div>
        {inc.observaciones && <div style={{marginTop:6,fontSize:12,color:'#718096',fontStyle:'italic'}}>💬 {inc.observaciones}</div>}
      </div>
      {esAdmin && (
        <div style={{display:'flex',flexDirection:'column',gap:8,flexShrink:0}}>
          <button onClick={onPDF} style={{padding:'8px 16px',borderRadius:10,background:'#1B5E20',color:'#fff',border:'none',cursor:'pointer',fontWeight:700,fontSize:12,fontFamily:'Montserrat,sans-serif'}}>📄 PDF</button>
          <button onClick={onEditar} style={{padding:'8px 16px',borderRadius:10,background:'#2563EB',color:'#fff',border:'none',cursor:'pointer',fontWeight:700,fontSize:12,fontFamily:'Montserrat,sans-serif'}}>✏️ Editar</button>
          <button onClick={onEliminar} style={{padding:'6px 12px',borderRadius:10,background:'#FFF5F5',color:'#E53E3E',border:'1px solid #FED7D7',cursor:'pointer',fontWeight:700,fontSize:11,fontFamily:'Montserrat,sans-serif'}}>🗑️</button>
        </div>
      )}
    </div>
  );
}

// ── Modal nueva incapacidad ───────────────────────────────
function ModalNuevaIncapacidad({ onClose, onGuardado }) {
  const [form, setForm] = useState({ empleado_id:'', tipo:'imss_general', fecha_inicio:'', fecha_fin:'', dias:'', folio_imss:'', con_goce:true, observaciones:'' });
  const [empleados, setEmpleados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{ api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(()=>{}); },[]);

  // Auto calcular días
  useEffect(()=>{
    if (form.fecha_inicio && form.fecha_fin) {
      const d1 = new Date(form.fecha_inicio), d2 = new Date(form.fecha_fin);
      const diff = Math.ceil((d2-d1)/(1000*60*60*24))+1;
      if (diff > 0) setForm(f=>({...f, dias:String(diff)}));
    }
  },[form.fecha_inicio, form.fecha_fin]);

  const guardar = async () => {
    if (!form.empleado_id||!form.tipo||!form.fecha_inicio||!form.fecha_fin||!form.dias) { setError('Completa todos los campos requeridos'); return; }
    setEnviando(true); setError('');
    try { await api.post('/api/incapacidades', form); onGuardado(); }
    catch(e) { setError(e.response?.data?.error||'Error'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{background:'linear-gradient(135deg,#1B5E20,#2E7D32)'}}>
          <h2>🏥 Registrar Incapacidad</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          {error && <div style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:10,padding:'10px 14px',color:'#B71C1C',fontSize:13}}>⚠️ {error}</div>}

          <div>
            <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Empleado *</label>
            <select value={form.empleado_id} onChange={e=>setForm({...form,empleado_id:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}>
              <option value="">Seleccionar empleado...</option>
              {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>)}
            </select>
          </div>

          <div>
            <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:8,textTransform:'uppercase'}}>Tipo de incapacidad *</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {Object.entries(TIPOS).map(([k,v])=>(
                <button key={k} onClick={()=>setForm({...form,tipo:k})}
                  style={{padding:'10px 8px',borderRadius:10,border:`2px solid ${form.tipo===k?v.color:'#e2e8f0'}`,background:form.tipo===k?`${v.color}15`:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,color:form.tipo===k?v.color:'#718096',display:'flex',alignItems:'center',gap:6,transition:'all 0.2s'}}>
                  <span style={{fontSize:16}}>{v.icon}</span>{v.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:12}}>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Fecha inicio *</label>
              <input type="date" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Fecha fin *</label>
              <input type="date" value={form.fecha_fin} onChange={e=>setForm({...form,fecha_fin:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Días</label>
              <input type="number" value={form.dias} onChange={e=>setForm({...form,dias:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Folio IMSS</label>
              <input value={form.folio_imss} onChange={e=>setForm({...form,folio_imss:e.target.value})} placeholder="Número de folio" style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:8,textTransform:'uppercase'}}>Goce de sueldo</label>
              <div style={{display:'flex',gap:8}}>
                {[{v:true,l:'💰 Con goce'},{v:false,l:'🚫 Sin goce'}].map(o=>(
                  <button key={String(o.v)} onClick={()=>setForm({...form,con_goce:o.v})}
                    style={{flex:1,padding:'8px',borderRadius:10,border:`1.5px solid ${form.con_goce===o.v?'#1B5E20':'#e2e8f0'}`,background:form.con_goce===o.v?'#E8F5E9':'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,color:form.con_goce===o.v?'#1B5E20':'#718096'}}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Observaciones</label>
            <textarea value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})} rows={2} placeholder="Notas adicionales..." style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,resize:'vertical',boxSizing:'border-box'}}/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button onClick={guardar} disabled={enviando} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#1B5E20,#2E7D32)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
            {enviando?'⏳...':'✅ Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal editar incapacidad ──────────────────────────────
function ModalEditarIncapacidad({ inc, onClose, onGuardado }) {
  const [form, setForm] = useState({ tipo:inc.tipo, fecha_inicio:String(inc.fecha_inicio).substring(0,10), fecha_fin:String(inc.fecha_fin).substring(0,10), dias:String(inc.dias), folio_imss:inc.folio_imss||'', con_goce:inc.con_goce, observaciones:inc.observaciones||'' });
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    try { await api.put(`/api/incapacidades/${inc.id}`, form); onGuardado(); }
    catch(e) { console.error(e); }
    finally { setEnviando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{background:'linear-gradient(135deg,#1B5E20,#2E7D32)'}}>
          <h2>✏️ Editar Incapacidad</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,color:'#4A5568',marginBottom:5,textTransform:'uppercase'}}>Fecha inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:12,boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,color:'#4A5568',marginBottom:5,textTransform:'uppercase'}}>Fecha fin</label>
              <input type="date" value={form.fecha_fin} onChange={e=>setForm({...form,fecha_fin:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:12,boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,color:'#4A5568',marginBottom:5,textTransform:'uppercase'}}>Días</label>
              <input type="number" value={form.dias} onChange={e=>setForm({...form,dias:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:12,boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,color:'#4A5568',marginBottom:5,textTransform:'uppercase'}}>Folio IMSS</label>
              <input value={form.folio_imss} onChange={e=>setForm({...form,folio_imss:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:12,boxSizing:'border-box'}}/>
            </div>
          </div>
          <div>
            <label style={{display:'block',fontWeight:700,fontSize:11,color:'#4A5568',marginBottom:5,textTransform:'uppercase'}}>Observaciones</label>
            <textarea value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})} rows={2} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:12,resize:'vertical',boxSizing:'border-box'}}/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button onClick={guardar} disabled={enviando} style={{padding:'10px 20px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#1B5E20,#2E7D32)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
            {enviando?'⏳...':'✅ Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal subir receta ────────────────────────────────────
function ModalSubirReceta({ incapacidades, onClose, onGuardado }) {
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState({ empleado_id:'', incapacidad_id:'', descripcion:'', fecha:new Date().toISOString().substring(0,10) });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{ api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(()=>{}); },[]);

  const incEmp = incapacidades.filter(i=>i.empleado_id===form.empleado_id);

  const onFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const subir = async () => {
    if (!form.empleado_id||!file) { setError('Selecciona empleado y foto'); return; }
    setSubiendo(true); setError('');
    try {
      const fd = new FormData();
      fd.append('foto', file);
      Object.entries(form).forEach(([k,v])=>{ if(v) fd.append(k,v); });
      await api.post('/api/incapacidades/recetas', fd, {headers:{'Content-Type':'multipart/form-data'}});
      onGuardado();
    } catch(e) { setError(e.response?.data?.error||'Error al subir'); }
    finally { setSubiendo(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{background:'linear-gradient(135deg,#1B5E20,#2E7D32)'}}>
          <h2>📷 Subir Receta Médica</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          {error && <div style={{background:'#FFF5F5',borderRadius:8,padding:'10px',color:'#B71C1C',fontSize:13}}>⚠️ {error}</div>}

          <div>
            <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Empleado *</label>
            <select value={form.empleado_id} onChange={e=>setForm({...form,empleado_id:e.target.value,incapacidad_id:''})} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}>
              <option value="">Seleccionar empleado...</option>
              {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>)}
            </select>
          </div>

          {incEmp.length>0 && (
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Vincular a incapacidad (opcional)</label>
              <select value={form.incapacidad_id} onChange={e=>setForm({...form,incapacidad_id:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}>
                <option value="">Sin vincular</option>
                {incEmp.map(i=><option key={i.id} value={i.id}>{TIPOS[i.tipo]?.label} — {String(i.fecha_inicio).substring(0,10)}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Fecha</label>
            <input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
          </div>

          <div>
            <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Descripción</label>
            <input value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Ej: Receta de médico familiar" style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
          </div>

          {/* Foto */}
          <div style={{display:'flex',gap:10}}>
            <label style={{flex:1,padding:'14px',borderRadius:12,background:'#F0FFF4',border:'2px dashed #1B5E20',cursor:'pointer',textAlign:'center',fontWeight:700,fontSize:13,color:'#1B5E20',fontFamily:'Montserrat,sans-serif'}}>
              🖼️ Subir foto
              <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>onFile(e.target.files[0])}/>
            </label>
            <label style={{flex:1,padding:'14px',borderRadius:12,background:'#EEF2FF',border:'2px dashed #2563EB',cursor:'pointer',textAlign:'center',fontWeight:700,fontSize:13,color:'#2563EB',fontFamily:'Montserrat,sans-serif'}}>
              📸 Tomar foto
              <input type="file" accept="image/*" capture style={{display:'none'}} onChange={e=>onFile(e.target.files[0])}/>
            </label>
          </div>

          {preview && <img src={preview} alt="" style={{width:'100%',borderRadius:10,maxHeight:200,objectFit:'contain',background:'#f7f8fc'}}/>}
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button onClick={subir} disabled={subiendo||!file} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#1B5E20,#2E7D32)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
            {subiendo?'⏳ Subiendo...':'📤 Subir receta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal PDF incapacidad ─────────────────────────────────
function ModalPDFIncapacidad({ inc, onClose }) {
  const [recetas, setRecetas] = useState([]);
  const [recetaSel, setRecetaSel] = useState('');
  const [generando, setGenerando] = useState(false);

  useEffect(()=>{
    api.get('/api/incapacidades/recetas').then(r=>{
      setRecetas(r.data.filter(x=>x.empleado_id===inc.empleado_id));
    }).catch(()=>{});
  },[inc]);

  const tipo = TIPOS[inc.tipo]||{label:inc.tipo,icon:'🏥'};

  const generar = async () => {
    setGenerando(true);
    try {
      const doc = new jsPDF({orientation:'portrait',unit:'mm',format:'letter'});
      const pW = 215.9;
      const hoy = new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});

      // Header verde
      doc.setFillColor(27,94,32); doc.rect(0,0,pW,50,'F');
      doc.setFillColor(201,168,76); doc.rect(0,50,pW,2.5,'F');

      // Logo
      try {
        const lr = await fetch(`${window.location.origin}/vacaciones-frontend/escudo-sitt.png`);
        const lb = await lr.blob();
        const lb64 = await new Promise(r=>{ const fr=new FileReader(); fr.onload=e=>r(e.target.result); fr.readAsDataURL(lb); });
        doc.addImage(lb64,'PNG',8,8,28,28);
      } catch(e){}

      // Foto empleado
      if (inc.foto_url) {
        try {
          const tr = await fetch(`https://vacaciones-backend-7ota.onrender.com/api/proxy-imagen?url=${encodeURIComponent(inc.foto_url)}`);
          if (tr.ok) {
            const tb = await tr.blob();
            const tb64 = await new Promise(r=>{ const fr=new FileReader(); fr.onload=e=>r(e.target.result); fr.readAsDataURL(tb); });
            doc.addImage(tb64,'JPEG',pW-44,6,34,34);
            doc.setDrawColor(201,168,76); doc.setLineWidth(1); doc.rect(pW-44,6,34,34);
          }
        } catch(e){}
      }

      doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(11);
      doc.text('H. XXV Ayuntamiento de Tijuana', 42,14);
      doc.setFontSize(9); doc.setFont('helvetica','normal');
      doc.text('Sistema Integral de Transporte de Tijuana — SITT',42,21);
      doc.setFont('helvetica','bold'); doc.setFontSize(10);
      doc.setTextColor(201,168,76);
      doc.text('CONSTANCIA DE INCAPACIDAD MÉDICA',42,30);
      doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','normal');
      doc.text(`Expedida el: ${hoy}`,42,37);

      // Datos empleado
      let y = 62;
      doc.setFillColor(240,248,240); doc.setDrawColor(27,94,32); doc.setLineWidth(0.3);
      doc.roundedRect(14,y,pW-28,38,3,3,'FD');
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(27,94,32);
      doc.text('DATOS DEL EMPLEADO',20,y+8);
      doc.setDrawColor(201,168,76); doc.setLineWidth(0.5);
      doc.line(20,y+10,pW-20,y+10);
      const datosEmp = [
        ['Nombre:', `${inc.nombre||''} ${inc.apellido_paterno||''}`],
        ['Puesto:', inc.puesto||'—'],
        ['Departamento:', inc.departamento||'—'],
      ];
      datosEmp.forEach(([l,v],i)=>{
        const row = y+16+(i%2)*10;
        const col = i<2?20:115;
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(27,94,32);
        doc.text(l, col, row);
        doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
        doc.text(v, col+30, row);
      });

      // Detalles incapacidad
      y += 48;
      doc.setFillColor(27,94,32); doc.roundedRect(14,y,pW-28,10,2,2,'F');
      doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(10);
      doc.text('DETALLES DE LA INCAPACIDAD',pW/2,y+7,{align:'center'});

      y += 16;
      const detalles = [
        ['Tipo:', `${tipo.icon} ${tipo.label}`],
        ['Fecha inicio:', fmtFecha(inc.fecha_inicio)],
        ['Fecha fin:', fmtFecha(inc.fecha_fin)],
        ['Días de incapacidad:', `${inc.dias} días`],
        ['Folio IMSS:', inc.folio_imss||'—'],
        ['Goce de sueldo:', inc.con_goce?'Con goce de sueldo':'Sin goce de sueldo'],
        ...(inc.observaciones?[['Observaciones:', inc.observaciones]]:[]),
      ];
      doc.setFillColor(248,255,248); doc.setDrawColor(27,94,32); doc.setLineWidth(0.3);
      doc.roundedRect(14,y,pW-28,detalles.length*10+12,3,3,'FD');
      detalles.forEach(([l,v],i)=>{
        const row = y+10+i*10;
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(27,94,32);
        doc.text(l,22,row);
        doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
        doc.text(String(v),80,row);
      });

      // Receta médica si seleccionada
      if (recetaSel) {
        const rec = recetas.find(r=>r.id===recetaSel);
        if (rec) {
          y += detalles.length*10+24;
          doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(27,94,32);
          doc.text('RECETA MÉDICA',pW/2,y,{align:'center'});
          doc.setDrawColor(201,168,76); doc.setLineWidth(0.5);
          doc.line(14,y+2,pW-14,y+2);
          try {
            const ir = await fetch(rec.foto_url);
            if (ir.ok) {
              const ib = await ir.blob();
              const ib64 = await new Promise(r=>{ const fr=new FileReader(); fr.onload=e=>r(e.target.result); fr.readAsDataURL(ib); });
              const imgW = 120, imgH = 80;
              doc.addImage(ib64,'JPEG',(pW-imgW)/2,y+8,imgW,imgH);
              y += imgH+16;
            }
          } catch(e){}
        }
      }

      // Firmas
      y = Math.max(y + (detalles.length*10+24), 200);
      const firmas = [
        {label:'Firma del Empleado', nombre:`${inc.nombre||''} ${inc.apellido_paterno||''}`},
        {label:'Vo.Bo. Recursos Humanos', nombre:'Recursos Humanos'},
        {label:'Vo.Bo. Administración', nombre:'Administración'},
      ];
      const fw = (pW-28)/3;
      firmas.forEach((f,i)=>{
        const x = 14+i*fw+fw/2;
        doc.setDrawColor(180,180,180); doc.setLineWidth(0.3);
        doc.line(x-25,y+20,x+25,y+20);
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(27,94,32);
        doc.text(f.label,x,y+26,{align:'center'});
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,120,120);
        doc.text(f.nombre,x,y+31,{align:'center'});
      });

      // Footer
      const pH = 279.4;
      doc.setFillColor(27,94,32); doc.rect(0,pH-12,pW,12,'F');
      doc.setFillColor(201,168,76); doc.rect(0,pH-14,pW,2,'F');
      doc.setTextColor(255,255,255); doc.setFont('helvetica','normal'); doc.setFontSize(7);
      doc.text('Sistema de Incapacidades — SITT · H. XXV Ayuntamiento de Tijuana',pW/2,pH-4,{align:'center'});

      doc.save(`Incapacidad_${(inc.nombre||'').replace(/\s/g,'_')}_${String(inc.fecha_inicio).substring(0,10)}.pdf`);
      onClose();
    } catch(e) { console.error(e); }
    finally { setGenerando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{background:'linear-gradient(135deg,#1B5E20,#2E7D32)'}}>
          <h2>📄 Generar PDF</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:'#F0FFF4',borderRadius:12,padding:'12px 16px'}}>
            <div style={{fontWeight:800,color:'#1B5E20',fontSize:14}}>{inc.nombre} {inc.apellido_paterno}</div>
            <div style={{fontSize:13,color:'#4A5568',marginTop:4}}>{tipo.icon} {tipo.label} · {inc.dias} días</div>
            <div style={{fontSize:12,color:'#718096',marginTop:2}}>{fmtFecha(inc.fecha_inicio)} → {fmtFecha(inc.fecha_fin)}</div>
          </div>

          {recetas.length>0 && (
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Incluir receta médica (opcional)</label>
              <select value={recetaSel} onChange={e=>setRecetaSel(e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}>
                <option value="">Sin receta</option>
                {recetas.map(r=><option key={r.id} value={r.id}>{fmtFecha(r.fecha)} {r.descripcion?`— ${r.descripcion}`:''}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button onClick={generar} disabled={generando} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#1B5E20,#2E7D32)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
            {generando?'⏳ Generando...':'📄 Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
