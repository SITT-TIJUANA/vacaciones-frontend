import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});
}

function calcDias(ini, fin) {
  if (!ini || !fin) return 0;
  const [iy,im,id] = ini.split('-').map(Number);
  const [fy,fm,fd] = fin.split('-').map(Number);
  let d=0, c=new Date(iy,im-1,id), end=new Date(fy,fm-1,fd);
  while(c<=end){if(c.getDay()!==0&&c.getDay()!==6)d++;c.setDate(c.getDate()+1);}
  return d;
}

const STATUS_COLORS = { pendiente:{bg:'#fef3c7',color:'#92400e',border:'#fbbf24'}, aprobada:{bg:'#d1fae5',color:'#065f46',border:'#34d399'}, rechazada:{bg:'#fee2e2',color:'#7f1d1d',border:'#f87171'} };

export default function MobileSolicitudes() {
  const { usuario, rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modalNueva, setModalNueva] = useState(false);
  const [modalResolver, setModalResolver] = useState(null);
  const [form, setForm] = useState({ fecha_inicio:'', fecha_fin:'', motivo:'' });
  const [enviando, setEnviando] = useState(false);
  const [comentario, setComentario] = useState('');

  const cargar = () => {
    setCargando(true);
    const url = esAdmin ? '/api/solicitudes' : `/api/solicitudes?empleado_id=${usuario?.empleado_id}`;
    api.get(url).then(r=>setSolicitudes(r.data)).catch(()=>{}).finally(()=>setCargando(false));
  };

  useEffect(()=>{ cargar(); }, []);

  const filtradas = solicitudes.filter(s => filtro==='todos' || s.estatus===filtro);

  const enviarSolicitud = async () => {
    if (!form.fecha_inicio || !form.fecha_fin) return;
    setEnviando(true);
    try {
      await api.post('/api/solicitudes', { fecha_inicio:form.fecha_inicio, fecha_fin:form.fecha_fin, motivo:form.motivo });
      setModalNueva(false);
      setForm({fecha_inicio:'',fecha_fin:'',motivo:''});
      cargar();
    } catch(e) { alert(e.response?.data?.error||'Error'); }
    setEnviando(false);
  };

  const resolver = async (id, estatus) => {
    try {
      await api.put(`/api/solicitudes/${id}/resolver`, { estatus, comentario_resolucion: comentario });
      setModalResolver(null); setComentario(''); cargar();
    } catch(e) { alert(e.response?.data?.error||'Error'); }
  };

  const dias = calcDias(form.fecha_inicio, form.fecha_fin);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Header con botón nuevo */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#1f2937' }}>
          {esAdmin ? 'Todas las solicitudes' : 'Mis solicitudes de vacaciones'}
        </div>
        {!esAdmin && (
          <button onClick={()=>setModalNueva(true)} style={{ background:'linear-gradient(135deg,#6B0F2B,#9B1540)', color:'#fff', border:'none', borderRadius:12, padding:'9px 16px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>
            + Nueva
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        {['todos','pendiente','aprobada','rechazada'].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)}
            style={{ padding:'7px 14px', borderRadius:20, border:`1.5px solid ${filtro===f?'#6B0F2B':'#e5e7eb'}`, background:filtro===f?'#6B0F2B':'#fff', color:filtro===f?'#fff':'#6b7280', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11, whiteSpace:'nowrap', flexShrink:0 }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? <div style={{textAlign:'center',padding:32}}><div className="loader"/></div> : (
        filtradas.length === 0
          ? <div style={{ background:'#fff', borderRadius:16, padding:32, textAlign:'center', color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>Sin solicitudes</div>
          : filtradas.map(s => {
            const st = STATUS_COLORS[s.estatus] || STATUS_COLORS.pendiente;
            return (
              <div key={s.id} style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:`1px solid ${st.border}30` }}>
                {esAdmin && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    {s.foto_url ? <img src={s.foto_url} style={{ width:38,height:38,borderRadius:'50%',objectFit:'cover',border:`2px solid ${st.border}` }}/> : <div style={{ width:38,height:38,borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>👤</div>}
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1f2937' }}>{s.nombre} {s.apellido_paterno}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{s.departamento}</div>
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:12, color:'#6b7280', marginBottom:4 }}>
                      📅 {fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}
                    </div>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:22, color:'#6B0F2B' }}>{s.dias_solicitados} días</div>
                    {s.motivo && <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>{s.motivo}</div>}
                  </div>
                  <div style={{ padding:'5px 12px', borderRadius:20, background:st.bg, color:st.color, fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', border:`1px solid ${st.border}`, flexShrink:0 }}>
                    {s.estatus}
                  </div>
                </div>
                {esAdmin && s.estatus==='pendiente' && (
                  <div style={{ display:'flex', gap:8, marginTop:12 }}>
                    <button onClick={()=>setModalResolver({...s,accion:'aprobada'})} style={{ flex:1, background:'#064e3b', color:'#fff', border:'none', borderRadius:10, padding:'10px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      ✅ Aprobar
                    </button>
                    <button onClick={()=>setModalResolver({...s,accion:'rechazada'})} style={{ flex:1, background:'#7f1d1d', color:'#fff', border:'none', borderRadius:10, padding:'10px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      ❌ Rechazar
                    </button>
                  </div>
                )}
              </div>
            );
          })
      )}

      {/* Modal nueva solicitud */}
      {modalNueva && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setModalNueva(false)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%', maxHeight:'85vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#6B0F2B', marginBottom:20 }}>🏖️ Nueva solicitud de vacaciones</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6 }}>Fecha de inicio *</label>
                <input type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))}
                  style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:14, boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6 }}>Fecha de fin *</label>
                <input type="date" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))}
                  style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:14, boxSizing:'border-box' }}/>
              </div>
              {dias > 0 && (
                <div style={{ background:'#f0fdf4', border:'1.5px solid #34d399', borderRadius:12, padding:'12px', textAlign:'center' }}>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:28, color:'#065f46' }}>{dias}</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:12, color:'#065f46', fontWeight:700 }}>días hábiles</div>
                </div>
              )}
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6 }}>Motivo (opcional)</label>
                <textarea value={form.motivo} onChange={e=>setForm(f=>({...f,motivo:e.target.value}))} rows={3} placeholder="Describe el motivo..."
                  style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, resize:'none', boxSizing:'border-box' }}/>
              </div>
              <button onClick={enviarSolicitud} disabled={enviando||!form.fecha_inicio||!form.fecha_fin}
                style={{ background:'linear-gradient(135deg,#6B0F2B,#9B1540)', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer', opacity:(!form.fecha_inicio||!form.fecha_fin)?0.5:1 }}>
                {enviando ? '⏳ Enviando...' : '📤 Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal resolver */}
      {modalResolver && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setModalResolver(null)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:modalResolver.accion==='aprobada'?'#065f46':'#7f1d1d', marginBottom:16 }}>
              {modalResolver.accion==='aprobada'?'✅ Aprobar solicitud':'❌ Rechazar solicitud'}
            </div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:13, color:'#6b7280', marginBottom:16 }}>
              {modalResolver.nombre} {modalResolver.apellido_paterno} · {modalResolver.dias_solicitados} días
            </div>
            <textarea value={comentario} onChange={e=>setComentario(e.target.value)} rows={3} placeholder="Comentario (opcional)..."
              style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, resize:'none', boxSizing:'border-box', marginBottom:14 }}/>
            <button onClick={()=>resolver(modalResolver.id, modalResolver.accion)}
              style={{ width:'100%', background:modalResolver.accion==='aprobada'?'#064e3b':'#7f1d1d', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer' }}>
              Confirmar {modalResolver.accion==='aprobada'?'aprobación':'rechazo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
