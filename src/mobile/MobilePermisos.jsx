import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});
}

const TIPOS = { medico:'🏥 Médico', escolar:'📚 Escolar', personal:'👤 Personal', emergencia:'🚨 Emergencia', legal:'⚖️ Legal', otro:'📋 Otro' };
const STATUS_COLORS = {
  pendiente:  { bg:'#fef3c7', color:'#92400e', border:'#fbbf24' },
  aprobado:   { bg:'#d1fae5', color:'#065f46', border:'#34d399' },
  rechazado:  { bg:'#fee2e2', color:'#7f1d1d', border:'#f87171' },
};

export default function MobilePermisos() {
  const { usuario, rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalResolver, setModalResolver] = useState(null);
  const [form, setForm] = useState({ tipo:'medico', fecha:'', hora_salida:'', hora_regreso:'', regresa:true, motivo:'' });
  const [empleados, setEmpleados] = useState([]);
  const [empSel, setEmpSel] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [formResolver, setFormResolver] = useState({ estatus:'aprobado', con_goce:true, motivo_rechazo:'' });

  const cargar = () => {
    setCargando(true);
    const url = esAdmin ? '/api/permisos-laborales' : `/api/permisos-laborales?empleado_id=${usuario?.empleado_id}`;
    api.get(url).then(r=>setPermisos(r.data)).catch(()=>{}).finally(()=>setCargando(false));
  };

  useEffect(()=>{
    cargar();
    if (esAdmin) api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(()=>{});
  }, []);

  const enviar = async () => {
    if (!form.tipo||!form.fecha||!form.hora_salida) { setError('Tipo, fecha y hora de salida son obligatorios'); return; }
    if (form.tipo==='otro'&&!form.motivo.trim()) { setError('El motivo es obligatorio para tipo "Otro"'); return; }
    if (esAdmin && !empSel) { setError('Selecciona un empleado'); return; }
    setEnviando(true); setError('');
    try {
      await api.post('/api/permisos-laborales', { ...form, empleado_id: esAdmin ? empSel : usuario?.empleado_id });
      setModalNuevo(false);
      setForm({tipo:'medico',fecha:'',hora_salida:'',hora_regreso:'',regresa:true,motivo:''});
      setEmpSel('');
      cargar();
    } catch(e) { setError(e.response?.data?.error||'Error al enviar'); }
    setEnviando(false);
  };

  const resolver = async () => {
    if (!modalResolver) return;
    try {
      await api.put(`/api/permisos-laborales/${modalResolver.id}/resolver`, formResolver);
      setModalResolver(null);
      setFormResolver({estatus:'aprobado',con_goce:true,motivo_rechazo:''});
      cargar();
    } catch(e) { alert(e.response?.data?.error||'Error'); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#1f2937' }}>
          {esAdmin ? 'Permisos laborales' : 'Mis permisos'}
        </div>
        <button onClick={()=>{ setError(''); setModalNuevo(true); }}
          style={{ background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)', color:'#fff', border:'none', borderRadius:12, padding:'9px 16px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>
          + Nuevo
        </button>
      </div>

      {cargando ? <div style={{textAlign:'center',padding:32}}><div className="loader"/></div> : (
        permisos.length === 0
          ? <div style={{ background:'#fff', borderRadius:16, padding:32, textAlign:'center', color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>Sin permisos registrados</div>
          : permisos.map(p => {
            const st = STATUS_COLORS[p.estatus] || STATUS_COLORS.pendiente;
            return (
              <div key={p.id} style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:`1px solid ${st.border}30` }}>
                {esAdmin && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    {p.foto_url ? <img src={p.foto_url} style={{ width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'2px solid #e5e7eb' }}/> : <div style={{ width:36,height:36,borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>👤</div>}
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1f2937' }}>{p.nombre} {p.apellido_paterno}</div>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1f2937' }}>{TIPOS[p.tipo]||p.tipo}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>📅 {fmtFecha(p.fecha)}</div>
                    {p.hora_salida && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>⏰ {p.hora_salida}{p.hora_regreso?` → ${p.hora_regreso}`:''}</div>}
                    {p.estatus!=='pendiente' && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{p.con_goce?'💰 Con goce':'🚫 Sin goce'}</div>}
                    {p.motivo && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{p.motivo}</div>}
                  </div>
                  <div style={{ padding:'5px 12px', borderRadius:20, background:st.bg, color:st.color, fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', border:`1px solid ${st.border}`, flexShrink:0 }}>
                    {p.estatus}
                  </div>
                </div>
                {esAdmin && p.estatus==='pendiente' && (
                  <div style={{ display:'flex', gap:8, marginTop:12 }}>
                    <button onClick={()=>{ setFormResolver({estatus:'aprobado',con_goce:true,motivo_rechazo:''}); setModalResolver(p); }}
                      style={{ flex:1, background:'#064e3b', color:'#fff', border:'none', borderRadius:10, padding:'10px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>✅ Aprobar</button>
                    <button onClick={()=>{ setFormResolver({estatus:'rechazado',con_goce:true,motivo_rechazo:''}); setModalResolver(p); }}
                      style={{ flex:1, background:'#7f1d1d', color:'#fff', border:'none', borderRadius:10, padding:'10px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>❌ Rechazar</button>
                  </div>
                )}
              </div>
            );
          })
      )}

      {/* Modal nuevo permiso */}
      {modalNuevo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setModalNuevo(false)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%', maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#0a1f3d', marginBottom:20 }}>📄 Solicitar Permiso</div>
            {error && <div style={{ background:'#fee2e2', borderRadius:10, padding:'10px 14px', color:'#7f1d1d', fontSize:12, marginBottom:14, fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>⚠️ {error}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {esAdmin && (
                <div>
                  <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Empleado *</label>
                  <select value={empSel} onChange={e=>setEmpSel(e.target.value)} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}>
                    <option value="">Seleccionar empleado...</option>
                    {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Tipo de permiso *</label>
                <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}>
                  {Object.entries(TIPOS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Fecha *</label>
                <input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:14, boxSizing:'border-box' }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Hora salida *</label>
                  <input type="time" value={form.hora_salida} onChange={e=>setForm(f=>({...f,hora_salida:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Hora regreso</label>
                  <input type="time" value={form.hora_regreso} onChange={e=>setForm(f=>({...f,hora_regreso:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:8, textTransform:'uppercase' }}>¿Regresa ese día?</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[{v:true,l:'✅ Sí regresa'},{v:false,l:'❌ No regresa'}].map(o=>(
                    <button key={String(o.v)} onClick={()=>setForm(f=>({...f,regresa:o.v}))}
                      style={{ flex:1, padding:'11px', borderRadius:12, border:`1.5px solid ${form.regresa===o.v?'#0a1f3d':'#e5e7eb'}`, background:form.regresa===o.v?'rgba(10,31,61,0.08)':'#fff', color:form.regresa===o.v?'#0a1f3d':'#9ca3af', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Motivo {form.tipo==='otro'?'*':''}</label>
                <textarea value={form.motivo} onChange={e=>setForm(f=>({...f,motivo:e.target.value}))} rows={3} placeholder="Describe el motivo del permiso..."
                  style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, resize:'none', boxSizing:'border-box' }}/>
              </div>
              <button onClick={enviar} disabled={enviando}
                style={{ background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer' }}>
                {enviando?'⏳ Enviando...':'📤 Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal resolver — solo admin/rrhh */}
      {modalResolver && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setModalResolver(null)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#1f2937', marginBottom:4 }}>
              {formResolver.estatus==='aprobado'?'✅ Aprobar':'❌ Rechazar'} permiso
            </div>
            <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>{modalResolver.nombre} {modalResolver.apellido_paterno} · {TIPOS[modalResolver.tipo]||modalResolver.tipo}</div>

            {formResolver.estatus==='aprobado' && (
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:8, textTransform:'uppercase' }}>Goce de sueldo</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[{v:true,l:'💰 Con goce'},{v:false,l:'🚫 Sin goce'}].map(o=>(
                    <button key={String(o.v)} onClick={()=>setFormResolver(f=>({...f,con_goce:o.v}))}
                      style={{ flex:1, padding:'11px', borderRadius:12, border:`1.5px solid ${formResolver.con_goce===o.v?'#0a1f3d':'#e5e7eb'}`, background:formResolver.con_goce===o.v?'rgba(10,31,61,0.08)':'#fff', color:formResolver.con_goce===o.v?'#0a1f3d':'#9ca3af', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {formResolver.estatus==='rechazado' && (
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Motivo de rechazo</label>
                <textarea value={formResolver.motivo_rechazo} onChange={e=>setFormResolver(f=>({...f,motivo_rechazo:e.target.value}))} rows={3} placeholder="Explica el motivo..."
                  style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, resize:'none', boxSizing:'border-box' }}/>
              </div>
            )}
            <button onClick={resolver}
              style={{ width:'100%', background:formResolver.estatus==='aprobado'?'#064e3b':'#7f1d1d', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer' }}>
              Confirmar {formResolver.estatus==='aprobado'?'aprobación':'rechazo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
