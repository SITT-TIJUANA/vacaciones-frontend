import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Bajas() {
  const [bajas, setBajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalReactivar, setModalReactivar] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = () => {
    setCargando(true);
    api.get('/api/bajas').then(r => setBajas(r.data)).catch(console.error).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const reactivar = async (id) => {
    setEnviando(true);
    try {
      await api.post(`/api/bajas/${id}/reactivar`);
      cargar(); setModalReactivar(null);
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Bajas de Personal</h2>
        <span style={{ background:'rgba(183,28,28,0.08)', color:'#B71C1C', padding:'8px 18px', borderRadius:30, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, border:'1px solid rgba(183,28,28,0.2)' }}>
          {bajas.length} empleado{bajas.length !== 1 ? 's' : ''} dado{bajas.length !== 1 ? 's' : ''} de baja
        </span>
      </div>

      {cargando ? (
        <div className="loader-wrapper"><div className="loader" /></div>
      ) : bajas.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <div style={{ fontSize:64, marginBottom:16 }} className="float-anim">✅</div>
          <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:22, color:'var(--g)' }}>Sin bajas registradas</p>
          <p style={{ color:'var(--g60)', marginTop:8 }}>Todo el personal está activo</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {bajas.map(emp => (
            <div key={emp.id} className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'stretch' }}>
                {/* Barra lateral roja */}
                <div style={{ width:6, background:'linear-gradient(180deg,#B71C1C,#E53935)', flexShrink:0 }} />

                <div style={{ flex:1, padding:'20px 24px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                  {/* Foto */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    {emp.foto_url
                      ? <img src={emp.foto_url} alt="" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid #E53935', filter:'grayscale(40%)' }} />
                      : <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, border:'3px solid #E53935' }}>👤</div>
                    }
                    <div style={{ position:'absolute', bottom:-4, right:-4, background:'#B71C1C', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, border:'2px solid white' }}>🚫</div>
                  </div>

                  {/* Info principal */}
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:18, color:'var(--g)' }}>
                      {emp.nombre} {emp.apellido_paterno} {emp.apellido_materno || ''}
                    </div>
                    <div style={{ fontSize:13, color:'var(--g60)', marginTop:3 }}>
                      {emp.puesto || '—'} · {emp.departamento || '—'}
                    </div>
                    {emp.numero_empleado && (
                      <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}># {emp.numero_empleado}</div>
                    )}
                  </div>

                  {/* Detalles de baja */}
                  <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                    <div style={{ textAlign:'center', padding:'10px 16px', background:'rgba(183,28,28,0.06)', borderRadius:12, border:'1px solid rgba(183,28,28,0.15)' }}>
                      <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#B71C1C', textTransform:'uppercase', letterSpacing:'0.5px' }}>Fecha de Baja</div>
                      <div style={{ fontWeight:800, color:'#B71C1C', fontSize:14, marginTop:4, fontFamily:'Montserrat,sans-serif' }}>
                        {emp.fecha_baja ? new Date(emp.fecha_baja).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </div>
                    </div>

                    <div style={{ textAlign:'center', padding:'10px 16px', background:'rgba(107,15,43,0.06)', borderRadius:12, border:'1px solid rgba(107,15,43,0.15)' }}>
                      <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Días Adeudados</div>
                      <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, color: emp.dias_adeudados > 0 ? '#E65100' : '#155724', fontSize:28, lineHeight:1.1, marginTop:4 }}>
                        {emp.dias_adeudados || 0}
                      </div>
                    </div>

                    {emp.fecha_ingreso && (
                      <div style={{ textAlign:'center', padding:'10px 16px', background:'var(--g10)', borderRadius:12, border:'1px solid var(--g20)' }}>
                        <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Ingresó</div>
                        <div style={{ fontWeight:700, color:'var(--g80)', fontSize:13, marginTop:4, fontFamily:'Montserrat,sans-serif' }}>
                          {new Date(emp.fecha_ingreso).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Motivo y notas */}
                  {(emp.motivo_baja || emp.notas_baja) && (
                    <div style={{ width:'100%', marginTop:8, padding:'10px 14px', background:'var(--g10)', borderRadius:10, border:'1px solid var(--g20)' }}>
                      {emp.motivo_baja && <div style={{ fontSize:12, fontWeight:700, color:'var(--g)', fontFamily:'Montserrat,sans-serif' }}>Motivo: <span style={{ fontWeight:500, color:'var(--g60)' }}>{emp.motivo_baja}</span></div>}
                      {emp.notas_baja && <div style={{ fontSize:12, color:'var(--g60)', marginTop:4 }}>📝 {emp.notas_baja}</div>}
                    </div>
                  )}

                  {/* Botón reactivar */}
                  <div style={{ marginLeft:'auto' }}>
                    <button className="btn-institucional dorado btn-sm" onClick={() => setModalReactivar(emp)}>
                      🔄 Reactivar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmar reactivar */}
      {modalReactivar && (
        <div className="modal-overlay" onClick={() => setModalReactivar(null)}>
          <div className="modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔄 Reactivar Empleado</h2>
              <button className="modal-close" onClick={() => setModalReactivar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize:14, color:'var(--g60)', lineHeight:1.6 }}>
                ¿Estás seguro de reactivar a <strong style={{ color:'var(--g)' }}>{modalReactivar.nombre} {modalReactivar.apellido_paterno}</strong>?
                Volverá a aparecer en el tablero de personal activo.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => setModalReactivar(null)}>Cancelar</button>
              <button className="btn-institucional dorado btn-sm" onClick={() => reactivar(modalReactivar.id)} disabled={enviando}>
                {enviando ? '⏳...' : '🔄 Sí, Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
