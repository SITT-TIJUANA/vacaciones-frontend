import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TIPO_LABELS = {
  medico:'Médico', escolar:'Escolar', personal:'Personal',
  emergencia:'Emergencia', legal:'Legal', otro:'Otro',
};

function tiempoRelativo(fecha) {
  const diff = (Date.now() - new Date(fecha)) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff/60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`;
  return `hace ${Math.floor(diff/86400)}d`;
}

export default function Notificaciones() {
  const { rolEfectivo } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [leidas, setLeidas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notifs-leidas') || '[]'); } catch { return []; }
  });
  const ref = useRef(null);

  const cargar = () => {
    api.get('/api/notificaciones').then(r => setNotifs(r.data)).catch(() => {});
  };

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const noLeidas = notifs.filter(n => !leidas.includes(n.id)).length;

  const marcarLeida = (id) => {
    const nuevas = [...new Set([...leidas, id])];
    setLeidas(nuevas);
    localStorage.setItem('notifs-leidas', JSON.stringify(nuevas));
  };

  const marcarTodasLeidas = () => {
    const nuevas = [...new Set([...leidas, ...notifs.map(n => n.id)])];
    setLeidas(nuevas);
    localStorage.setItem('notifs-leidas', JSON.stringify(nuevas));
  };

  const irA = (notif) => {
    marcarLeida(notif.id);
    setAbierto(false);
    if (notif.tipo === 'vacacion') navigate('/dashboard');
    else if (notif.tipo === 'permiso') navigate('/permisos');
  };

  const esAdmin = ['admin', 'rrhh'].includes(rolEfectivo);

  const getIcono = (n) => {
    if (n.tipo === 'vacacion') return '🏖️';
    return { medico:'🏥', escolar:'📚', personal:'👤', emergencia:'🚨', legal:'⚖️' }[n.subtipo] || '📋';
  };

  const getMensaje = (n) => {
    if (esAdmin) {
      if (n.tipo === 'vacacion') return `Solicitud de ${n.dias_solicitados || ''} días de vacaciones`;
      if (n.tipo === 'permiso') return `Solicitud de permiso ${TIPO_LABELS[n.subtipo] || ''}`;
    } else {
      const ok = n.estatus === 'aprobada' || n.estatus === 'aprobado';
      if (n.tipo === 'vacacion') return ok ? '✅ Vacaciones aprobadas' : '❌ Vacaciones rechazadas';
      if (n.tipo === 'permiso') return ok ? '✅ Permiso aprobado' : '❌ Permiso rechazado';
    }
    return '';
  };

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      {/* Botón campana */}
      <button
        onClick={() => { setAbierto(o => !o); if (!abierto) cargar(); }}
        style={{
          position:'relative', background:'rgba(255,255,255,0.15)',
          border:'1px solid rgba(255,255,255,0.25)', borderRadius:12,
          padding:'8px 10px', cursor:'pointer', color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.2s',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {noLeidas > 0 && (
          <div style={{
            position:'absolute', top:-6, right:-6,
            background:'#CE1126', color:'#fff',
            width:18, height:18, borderRadius:'50%',
            fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif',
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid rgba(0,0,0,0.2)',
          }}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </div>
        )}
      </button>

      {/* Panel */}
      {abierto && (
        <div style={{
          position:'fixed', top:60, right:8,
          width:'min(300px, calc(100vw - 16px))', background:'#fff', borderRadius:16,
          boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
          border:'1px solid rgba(0,0,0,0.08)',
          zIndex:9999, overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fafafa' }}>
            <div style={{ fontWeight:900, fontSize:13, color:'#1a1a2e', fontFamily:'Montserrat,sans-serif' }}>
              🔔 Notificaciones
              {noLeidas > 0 && <span style={{ marginLeft:8, background:'#6B0F2B', color:'#fff', borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:800 }}>{noLeidas}</span>}
            </div>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} style={{ fontSize:11, color:'#6B0F2B', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}>
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding:'28px 20px', textAlign:'center', color:'#718096', fontSize:12, fontFamily:'Montserrat,sans-serif' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🔔</div>
                Sin notificaciones
              </div>
            ) : notifs.map(n => {
              const leida = leidas.includes(n.id);
              return (
                <div key={`${n.tipo}-${n.id}`}
                  onClick={() => irA(n)}
                  style={{
                    padding:'10px 14px', cursor:'pointer',
                    borderBottom:'1px solid #f7f8fc',
                    background: leida ? '#fff' : '#FFF8F0',
                    display:'flex', gap:10, alignItems:'flex-start',
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f8fc'}
                  onMouseLeave={e => e.currentTarget.style.background = leida ? '#fff' : '#FFF8F0'}
                >
                  {/* Avatar */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    {n.foto_url
                      ? <img src={n.foto_url} alt="" style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', border:'2px solid #e2e8f0' }}/>
                      : <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#6B0F2B,#9B1540)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#C9A84C' }}>
                          {n.nombre?.[0]}{n.apellido_paterno?.[0]}
                        </div>
                    }
                    <div style={{ position:'absolute', bottom:-2, right:-2, fontSize:11, background:'#fff', borderRadius:'50%', lineHeight:1 }}>{getIcono(n)}</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:12, color:'#1a1a2e', fontFamily:'Montserrat,sans-serif', lineHeight:1.3 }}>
                      {esAdmin ? `${n.nombre} ${n.apellido_paterno}` : getMensaje(n)}
                    </div>
                    {esAdmin && (
                      <div style={{ fontSize:11, color:'#718096', marginTop:2, fontFamily:'Montserrat,sans-serif' }}>{getMensaje(n)}</div>
                    )}
                    <div style={{ fontSize:10, color:'#a0aec0', marginTop:3, fontFamily:'Montserrat,sans-serif' }}>{tiempoRelativo(n.created_at)}</div>
                  </div>

                  {!leida && <div style={{ width:7, height:7, borderRadius:'50%', background:'#6B0F2B', flexShrink:0, marginTop:5 }}/>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
