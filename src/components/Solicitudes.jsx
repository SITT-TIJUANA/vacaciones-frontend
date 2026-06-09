import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Solicitudes({ onActualizarNotif }) {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [resolviendo, setResolviendo] = useState(null);

  const esAdmin = ['admin', 'rrhh'].includes(usuario?.rol);

  const cargar = () => {
    setCargando(true);
    api.get('/api/solicitudes')
      .then(r => setSolicitudes(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const resolver = async (id, estatus, comentario = '') => {
    try {
      await api.put(`/api/solicitudes/${id}/resolver`, { estatus, comentario_resolucion: comentario });
      cargar();
      onActualizarNotif?.();
      setResolviendo(null);
    } catch (e) {
      alert(e.response?.data?.error || 'Error al resolver');
    }
  };

  const filtradas = solicitudes.filter(s => !filtroEstatus || s.estatus === filtroEstatus);

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Solicitudes</h2>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select className="form-control" style={{ width:150 }} value={filtroEstatus} onChange={e=>setFiltroEstatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">⏳ Pendientes</option>
            <option value="aprobada">✅ Aprobadas</option>
            <option value="rechazada">❌ Rechazadas</option>
            <option value="cancelada">🚫 Canceladas</option>
          </select>
          {usuario?.empleado_id && (
            <button className="btn-institucional filled" onClick={() => setModalNueva(true)}>
              ➕ Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="loader-wrapper"><div className="loader" /></div>
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--g60)' }}>
          <div style={{ fontSize:56, marginBottom:16 }} className="float-anim">📋</div>
          <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:20, color:'var(--g)' }}>Sin solicitudes</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtradas.map(s => (
            <div key={s.id} className="card" style={{ padding:'16px 20px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
                {/* Foto empleado — solo admin/rrhh */}
                {esAdmin && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    {s.foto_url
                      ? <img src={s.foto_url} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--g)' }} />
                      : <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👤</div>
                    }
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--g)' }}>
                        {s.nombre} {s.apellido_paterno}
                      </div>
                      <div style={{ fontSize:11, color:'var(--g60)' }}>{s.departamento||''}</div>
                    </div>
                  </div>
                )}

                {/* Detalles */}
                <div style={{ flex:1, minWidth:140 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--txt)', marginBottom:4 }}>
                    📅 {fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, color:'var(--g)', fontSize:22 }}>{s.dias_solicitados}</span>
                    <span style={{ fontSize:12, color:'var(--g60)' }}>días · {s.anio}</span>
                    <span className={`badge badge-${s.estatus}`}>
                      {s.estatus === 'pendiente' && '⏳ '}
                      {s.estatus === 'aprobada' && '✅ '}
                      {s.estatus === 'rechazada' && '❌ '}
                      {s.estatus === 'cancelada' && '🚫 '}
                      {s.estatus}
                    </span>
                  </div>
                  {s.motivo && (
                    <div style={{ fontSize:12, color:'var(--g60)', marginTop:3 }}>💬 {s.motivo}</div>
                  )}
                  {/* Comentario de rechazo — visible para todos */}
                  {s.comentario_resolucion && (
                    <div style={{ marginTop:8, padding:'8px 12px', background:'#FFEBEE', borderRadius:8, border:'1px solid #FFCDD2', fontSize:12, color:'#B71C1C', fontWeight:600 }}>
                      ❌ Motivo de rechazo: {s.comentario_resolucion}
                    </div>
                  )}
                  <div style={{ fontSize:11, color:'var(--g60)', marginTop:4 }}>
                    Solicitado: {fmtFecha(s.created_at)}
                    {s.aprobado_por_username && ` · Por: ${s.aprobado_por_username}`}
                  </div>
                </div>

                {/* Botones admin */}
                {esAdmin && s.estatus === 'pendiente' && (
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-institucional dorado btn-sm" onClick={() => resolver(s.id, 'aprobada')}>
                      ✅ Aprobar
                    </button>
                    <button className="btn-institucional peligro btn-sm" onClick={() => setResolviendo({ id:s.id })}>
                      ❌ Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva solicitud */}
      {modalNueva && (
        <ModalNuevaSolicitud
          onClose={() => setModalNueva(false)}
          onCreada={() => { cargar(); setModalNueva(false); onActualizarNotif?.(); }}
        />
      )}

      {/* Modal rechazar */}
      {resolviendo && (
        <ModalRechazar
          onClose={() => setResolviendo(null)}
          onConfirmar={(comentario) => resolver(resolviendo.id, 'rechazada', comentario)}
        />
      )}
    </div>
  );
}

function ModalNuevaSolicitud({ onClose, onCreada }) {
  const [form, setForm] = useState({ fecha_inicio:'', fecha_fin:'', motivo:'' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [diasCalc, setDiasCalc] = useState(0);

  // Calcular días hábiles
  useEffect(() => {
    if (!form.fecha_inicio || !form.fecha_fin) { setDiasCalc(0); return; }
    const ini = new Date(form.fecha_inicio);
    const fin = new Date(form.fecha_fin);
    if (fin < ini) { setDiasCalc(0); return; }
    let dias = 0;
    const cur = new Date(ini);
    while (cur <= fin) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) dias++;
      cur.setDate(cur.getDate() + 1);
    }
    setDiasCalc(dias);
  }, [form.fecha_inicio, form.fecha_fin]);

  const handleSubmit = async () => {
    if (!form.fecha_inicio || !form.fecha_fin) { setError('Selecciona las fechas'); return; }
    if (diasCalc === 0) { setError('Las fechas seleccionadas no tienen días hábiles'); return; }
    setEnviando(true); setError('');
    try {
      await api.post('/api/solicitudes', form);
      onCreada();
    } catch(e) {
      setError(e.response?.data?.error || 'Error al enviar');
    } finally { setEnviando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ background:'var(--w)', borderRadius:'24px 24px 0 0', width:'100%', padding:'0 0 env(safe-area-inset-bottom,0px)' }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:40, height:4, background:'var(--g20)', borderRadius:2 }} />
        </div>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 20px 16px' }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:20, color:'var(--g)' }}>
            Nueva Solicitud
          </div>
          <button onClick={onClose} style={{ background:'var(--g-soft)', border:'none', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--g)', fontWeight:900 }}>✕</button>
        </div>
        {/* Contenido */}
        <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:14 }}>
          {error && <div style={{ background:'#FFF3CD', border:'1px solid #FFEEBA', borderLeft:'4px solid #856404', padding:'10px 14px', borderRadius:8, fontSize:13, color:'#856404', fontWeight:600 }}>⚠️ {error}</div>}
          <div className="form-group">
            <label>Fecha Inicio</label>
            <input type="date" className="form-control" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio:e.target.value})} />
          </div>
          <div className="form-group">
            <label>Fecha Fin</label>
            <input type="date" className="form-control" value={form.fecha_fin} min={form.fecha_inicio} onChange={e => setForm({...form, fecha_fin:e.target.value})} />
          </div>
          {diasCalc > 0 && (
            <div style={{ background:'var(--g-soft)', borderRadius:12, padding:'12px 14px', border:'1px solid rgba(107,15,43,0.15)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:36, color:'var(--g)', lineHeight:1 }}>{diasCalc}</div>
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--g)' }}>días hábiles</div>
                <div style={{ fontSize:11, color:'var(--g60)' }}>se descontarán de tu periodo</div>
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Motivo (opcional)</label>
            <textarea className="form-control" rows={2} placeholder="Describe el motivo..." value={form.motivo} onChange={e => setForm({...form, motivo:e.target.value})} />
          </div>
        </div>
        {/* BOTONES — siempre al fondo */}
        <div style={{ display:'flex', gap:10, padding:'16px 20px 20px' }}>
          <button className="btn-institucional" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
          <button className="btn-institucional filled" style={{ flex:2 }} onClick={handleSubmit} disabled={enviando}>
            {enviando ? '⏳ Enviando...' : '📤 Enviar Solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalRechazar({ onClose, onConfirmar }) {
  const [comentario, setComentario] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>❌ Rechazar Solicitud</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Motivo del rechazo</label>
            <textarea className="form-control" rows={3}
              placeholder="Indica el motivo del rechazo... (el empleado lo verá)"
              value={comentario} onChange={e => setComentario(e.target.value)} />
          </div>
          <p style={{ fontSize:11, color:'var(--g60)', marginTop:8 }}>
            💡 El empleado verá este motivo en su sección de solicitudes.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional peligro btn-sm" onClick={() => onConfirmar(comentario)}>
            ❌ Confirmar Rechazo
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}
