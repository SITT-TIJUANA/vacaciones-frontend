import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
}

export default function MobilePerfil() {
  const { usuario, rolEfectivo, logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [modalPass, setModalPass] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNuevo, setPassNuevo] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (usuario?.empleado_id) {
      api.get(`/api/empleados/${usuario.empleado_id}`).then(r=>setPerfil(r.data)).catch(()=>{});
      api.get(`/api/solicitudes/periodos-detalle/${usuario.empleado_id}`).then(r=>setResumen(r.data)).catch(()=>{});
    }
  }, [usuario]);

  const cambiarPass = async () => {
    if (passNuevo !== confirmar) { setMsg('Las contraseñas no coinciden'); return; }
    if (passNuevo.length < 6) { setMsg('Mínimo 6 caracteres'); return; }
    setEnviando(true); setMsg('');
    try {
      await api.post('/api/auth/cambiar-password', { password_actual:passActual, password_nuevo:passNuevo });
      setMsg('✅ Contraseña actualizada');
      setTimeout(()=>{ setModalPass(false); setPassActual(''); setPassNuevo(''); setConfirmar(''); setMsg(''); }, 2000);
    } catch(e) { setMsg(e.response?.data?.error||'Error'); }
    setEnviando(false);
  };

  const emp = perfil || {};
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Card foto */}
      <div style={{ background:'linear-gradient(135deg,#4A0A1E,#6B0F2B)', borderRadius:20, padding:'24px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, boxShadow:'0 8px 24px rgba(107,15,43,0.3)' }}>
        {emp.foto_url
          ? <img src={emp.foto_url} style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'3px solid #C9A84C', boxShadow:'0 4px 16px rgba(0,0,0,0.3)' }}/>
          : <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(201,168,76,0.2)', border:'3px solid #C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>👤</div>
        }
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:22, color:'#C9A84C' }}>
            {emp.nombre || usuario?.username} {emp.apellido_paterno}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:4, fontFamily:'Montserrat,sans-serif' }}>
            {emp.puesto || rolEfectivo}
          </div>
          <div style={{ marginTop:8, display:'inline-block', padding:'4px 14px', borderRadius:20, background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.3)', fontSize:11, color:'#C9A84C', fontFamily:'Montserrat,sans-serif', fontWeight:700, textTransform:'uppercase' }}>
            {rolEfectivo}
          </div>
        </div>
      </div>

      {/* Info personal */}
      {emp.nombre && (
        <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#374151', marginBottom:12 }}>📋 Información personal</div>
          {[
            ['Departamento', emp.departamento],
            ['No. Empleado', emp.numero_empleado],
            ['Fecha ingreso', fmtFecha(emp.fecha_ingreso)],
            ['Correo', emp.email],
            ['Teléfono', emp.telefono],
          ].filter(([,v])=>v).map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:12, color:'#9ca3af', fontWeight:600 }}>{l}</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:12, color:'#1f2937', fontWeight:700, textAlign:'right', maxWidth:'60%' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resumen vacaciones */}
      {resumen && !esAdmin && (
        <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#374151', marginBottom:12 }}>🏖️ Resumen de vacaciones</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
            {[
              { n:resumen.total_disponible||0, l:'Disponibles', c:'#059669' },
              { n:resumen.total_tomado||0, l:'Tomados', c:'#6B0F2B' },
              { n:resumen.total_correspondiente||0, l:'Totales', c:'#1e3a5f' },
            ].map(k=>(
              <div key={k.l} style={{ textAlign:'center', padding:'12px 8px', background:`${k.c}08`, borderRadius:12, border:`1px solid ${k.c}20` }}>
                <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:26, color:k.c, lineHeight:1 }}>{k.n}</div>
                <div style={{ fontSize:9, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#9ca3af', marginTop:3 }}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={()=>setModalPass(true)} style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:12, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', textAlign:'left', width:'100%' }}>
          <span style={{ fontSize:20 }}>🔑</span>
          <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#374151' }}>Cambiar contraseña</span>
          <span style={{ marginLeft:'auto', color:'#9ca3af' }}>›</span>
        </button>
        <button onClick={logout} style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:12, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', textAlign:'left', width:'100%' }}>
          <span style={{ fontSize:20 }}>🚪</span>
          <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#7f1d1d' }}>Cerrar sesión</span>
          <span style={{ marginLeft:'auto', color:'#fca5a5' }}>›</span>
        </button>
      </div>

      {/* Modal cambiar contraseña */}
      {modalPass && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setModalPass(false)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#1f2937', marginBottom:20 }}>🔑 Cambiar contraseña</div>
            {msg && <div style={{ padding:'10px 14px', borderRadius:10, background:msg.includes('✅')?'#d1fae5':'#fee2e2', color:msg.includes('✅')?'#065f46':'#7f1d1d', fontSize:13, marginBottom:14, fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>{msg}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[{l:'Contraseña actual',v:passActual,s:setPassActual},{l:'Nueva contraseña',v:passNuevo,s:setPassNuevo},{l:'Confirmar nueva',v:confirmar,s:setConfirmar}].map(f=>(
                <div key={f.l}>
                  <label style={{ display:'block', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#374151', marginBottom:6 }}>{f.l}</label>
                  <input type="password" value={f.v} onChange={e=>f.s(e.target.value)} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontFamily:'Montserrat,sans-serif', fontSize:14, boxSizing:'border-box' }}/>
                </div>
              ))}
              <button onClick={cambiarPass} disabled={enviando} style={{ background:'linear-gradient(135deg,#6B0F2B,#9B1540)', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer' }}>
                {enviando?'⏳...':'✅ Actualizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
