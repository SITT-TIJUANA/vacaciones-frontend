import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});
}

const TIPOS = { smm_general:'🏥 SMM General', maternidad:'🤱 Maternidad', riesgo_trabajo:'⚠️ Riesgo de Trabajo', enfermedad_profesional:'🦠 Enf. Profesional' };

export default function MobileIncapacidades() {
  const { usuario, rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);
  const [incapacidades, setIncapacidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ tipo:'smm_general', fecha_inicio:'', fecha_fin:'', dias:'', con_goce:false, folio_smm:'' });
  const [empleados, setEmpleados] = useState([]);
  const [empId, setEmpId] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargar = () => {
    setCargando(true);
    const url = esAdmin ? '/api/incapacidades' : `/api/incapacidades?empleado_id=${usuario?.empleado_id}`;
    api.get(url).then(r=>setIncapacidades(r.data)).catch(()=>{}).finally(()=>setCargando(false));
    if (esAdmin) api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(()=>{});
  };

  useEffect(()=>{ cargar(); }, []);

  const enviar = async () => {
    setEnviando(true);
    try {
      await api.post('/api/incapacidades', { ...form, empleado_id: esAdmin ? empId : usuario?.empleado_id });
      setModal(false); setForm({tipo:'smm_general',fecha_inicio:'',fecha_fin:'',dias:'',con_goce:false,folio_smm:''}); cargar();
    } catch(e) { alert(e.response?.data?.error||'Error'); }
    setEnviando(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#1f2937' }}>
          {esAdmin ? 'Incapacidades' : 'Mis incapacidades'}
        </div>
        {esAdmin && (
          <button onClick={()=>setModal(true)} style={{ background:'linear-gradient(135deg,#064e3b,#059669)', color:'#fff', border:'none', borderRadius:12, padding:'9px 16px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>
            + Nueva
          </button>
        )}
      </div>

      {cargando ? <div style={{textAlign:'center',padding:32}}><div className="loader"/></div> : (
        incapacidades.length === 0
          ? <div style={{ background:'#fff', borderRadius:16, padding:32, textAlign:'center', color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>Sin incapacidades</div>
          : incapacidades.map(inc => (
            <div key={inc.id} style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              {esAdmin && (
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1f2937', marginBottom:8 }}>
                  {inc.nombre} {inc.apellido_paterno}
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#1e3a5f' }}>{TIPOS[inc.tipo]||inc.tipo}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>📅 {fmtFecha(inc.fecha_inicio)} → {fmtFecha(inc.fecha_fin)}</div>
                  {inc.folio_smm && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Folio SMM: {inc.folio_smm}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:24, color:'#064e3b' }}>{inc.dias}</div>
                  <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'Montserrat,sans-serif' }}>días</div>
                  <div style={{ marginTop:4, fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:inc.con_goce?'#059669':'#9ca3af' }}>
                    {inc.con_goce?'✅ Con goce':'❌ Sin goce'}
                  </div>
                </div>
              </div>
            </div>
          ))
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setModal(false)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%', maxHeight:'85vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#064e3b', marginBottom:20 }}>🏥 Nueva incapacidad</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {esAdmin && (
                <div>
                  <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6 }}>Empleado *</label>
                  <select value={empId} onChange={e=>setEmpId(e.target.value)} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}>
                    <option value="">Seleccionar...</option>
                    {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6 }}>Tipo</label>
                <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}>
                  {Object.entries(TIPOS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {[{label:'Fecha inicio',key:'fecha_inicio'},{label:'Fecha fin',key:'fecha_fin'}].map(f=>(
                <div key={f.key}>
                  <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6 }}>{f.label} *</label>
                  <input type="date" value={form[f.key]} onChange={e=>setForm(ff=>({...ff,[f.key]:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:14, boxSizing:'border-box' }}/>
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6 }}>Días</label>
                <input type="number" value={form.dias} onChange={e=>setForm(f=>({...f,dias:e.target.value}))} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:14, boxSizing:'border-box' }}/>
              </div>
              <button onClick={enviar} disabled={enviando} style={{ background:'linear-gradient(135deg,#064e3b,#059669)', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer' }}>
                {enviando?'⏳...':'💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
