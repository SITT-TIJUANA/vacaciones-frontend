import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});
}

const TIPOS = {
  smm_general: '🏥 Servicios Médicos Municipales',
  maternidad: '🤱 Maternidad',
  riesgo_trabajo: '⚠️ Riesgo de Trabajo',
  enfermedad_profesional: '🦠 Enfermedad Profesional',
};

export default function MobileIncapacidades() {
  const { usuario, rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);
  const [incapacidades, setIncapacidades] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ empleado_id:'', tipo:'smm_general', fecha_inicio:'', fecha_fin:'', dias:'', folio_smm:'', con_goce:true, observaciones:'' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    setCargando(true);
    const url = esAdmin ? '/api/incapacidades' : `/api/incapacidades?empleado_id=${usuario?.empleado_id}`;
    api.get(url).then(r=>setIncapacidades(r.data)).catch(()=>{}).finally(()=>setCargando(false));
  };

  useEffect(()=>{
    cargar();
    api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(()=>{});
  },[]);

  const enviar = async () => {
    if (!form.empleado_id||!form.tipo||!form.fecha_inicio||!form.fecha_fin||!form.dias) {
      setError('Completa todos los campos requeridos'); return;
    }
    setEnviando(true); setError('');
    try {
      await api.post('/api/incapacidades', form);
      setModal(false);
      setForm({empleado_id:'',tipo:'smm_general',fecha_inicio:'',fecha_fin:'',dias:'',folio_smm:'',con_goce:true,observaciones:''});
      cargar();
    } catch(e) { setError(e.response?.data?.error||'Error al registrar'); }
    setEnviando(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#1f2937' }}>
          {esAdmin ? 'Incapacidades' : 'Mis incapacidades'}
        </div>
        {esAdmin && (
          <button onClick={()=>{ setError(''); setModal(true); }}
            style={{ background:'linear-gradient(135deg,#064e3b,#059669)', color:'#fff', border:'none', borderRadius:12, padding:'9px 16px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>
            + Registrar
          </button>
        )}
      </div>

      {cargando ? <div style={{textAlign:'center',padding:32}}><div className="loader"/></div> : (
        incapacidades.length === 0
          ? <div style={{ background:'#fff', borderRadius:16, padding:32, textAlign:'center', color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>Sin incapacidades registradas</div>
          : incapacidades.map(inc => (
            <div key={inc.id} style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              {esAdmin && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  {inc.foto_url ? <img src={inc.foto_url} style={{ width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'2px solid #e5e7eb' }}/> : <div style={{ width:36,height:36,borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>👤</div>}
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1f2937' }}>{inc.nombre} {inc.apellido_paterno}</div>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#065f46' }}>{TIPOS[inc.tipo]||inc.tipo}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>📅 {fmtFecha(inc.fecha_inicio)} → {fmtFecha(inc.fecha_fin)}</div>
                  {inc.folio_smm && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Folio SMM: {inc.folio_smm}</div>}
                  <div style={{ fontSize:11, color:inc.con_goce?'#059669':'#9ca3af', marginTop:2, fontWeight:600 }}>{inc.con_goce?'💰 Con goce':'🚫 Sin goce'}</div>
                  {inc.observaciones && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{inc.observaciones}</div>}
                </div>
                <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:28, color:'#064e3b', lineHeight:1 }}>{inc.dias}</div>
                  <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>días</div>
                </div>
              </div>
            </div>
          ))
      )}

      {/* Modal nueva incapacidad — solo admin/rrhh */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setModal(false)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%', maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#064e3b', marginBottom:20 }}>🏥 Registrar Incapacidad</div>
            {error && <div style={{ background:'#fee2e2', borderRadius:10, padding:'10px 14px', color:'#7f1d1d', fontSize:12, marginBottom:14, fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>⚠️ {error}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Empleado *</label>
                <select value={form.empleado_id} onChange={e=>setForm(f=>({...f,empleado_id:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}>
                  <option value="">Seleccionar empleado...</option>
                  {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Tipo *</label>
                <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}>
                  {Object.entries(TIPOS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[{l:'Fecha inicio *',k:'fecha_inicio'},{l:'Fecha fin *',k:'fecha_fin'}].map(f=>(
                  <div key={f.k}>
                    <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>{f.l}</label>
                    <input type="date" value={form[f.k]} onChange={e=>setForm(ff=>({...ff,[f.k]:e.target.value}))} style={{ width:'100%', padding:'11px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Días *</label>
                  <input type="number" value={form.dias} onChange={e=>setForm(f=>({...f,dias:e.target.value}))} min="1" style={{ width:'100%', padding:'11px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Folio SMM</label>
                  <input type="text" value={form.folio_smm} onChange={e=>setForm(f=>({...f,folio_smm:e.target.value}))} style={{ width:'100%', padding:'11px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:8, textTransform:'uppercase' }}>Goce de sueldo</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[{v:true,l:'💰 Con goce'},{v:false,l:'🚫 Sin goce'}].map(o=>(
                    <button key={String(o.v)} onClick={()=>setForm(f=>({...f,con_goce:o.v}))}
                      style={{ flex:1, padding:'11px', borderRadius:12, border:`1.5px solid ${form.con_goce===o.v?'#064e3b':'#e5e7eb'}`, background:form.con_goce===o.v?'rgba(6,78,59,0.08)':'#fff', color:form.con_goce===o.v?'#064e3b':'#9ca3af', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase' }}>Observaciones</label>
                <textarea value={form.observaciones} onChange={e=>setForm(f=>({...f,observaciones:e.target.value}))} rows={3} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, resize:'none', boxSizing:'border-box' }}/>
              </div>
              <button onClick={enviar} disabled={enviando} style={{ background:'linear-gradient(135deg,#064e3b,#059669)', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer' }}>
                {enviando?'⏳ Guardando...':'💾 Registrar incapacidad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
