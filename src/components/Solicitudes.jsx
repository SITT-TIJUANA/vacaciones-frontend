import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Solicitudes({ onActualizarNotif }) {
  const { usuario, rolEfectivo } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [resolviendo, setResolviendo] = useState(null);
  const [modalPeriodo, setModalPeriodo] = useState(null); // { id, empleado_id }

  const esAdmin = ['admin', 'rrhh'].includes(rolEfectivo);

  const cargar = () => {
    setCargando(true);
    // En modo empleado solo ver las propias solicitudes
    const endpoint = rolEfectivo === 'empleado' && usuario?.empleado_id
      ? `/api/solicitudes?empleado_id=${usuario.empleado_id}`
      : '/api/solicitudes';
    api.get(endpoint)
      .then(r => setSolicitudes(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [rolEfectivo]);

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
          <select className="form-control" style={{ width:150 }} value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}>
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
                  {s.motivo && <div style={{ fontSize:12, color:'var(--g60)', marginTop:3 }}>💬 {s.motivo}</div>}
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
                {esAdmin && s.estatus === 'pendiente' && (
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-institucional dorado btn-sm" onClick={() => setModalPeriodo({ id: s.id, empleado_id: s.empleado_id })}>✅ Aprobar</button>
                    <button className="btn-institucional peligro btn-sm" onClick={() => setResolviendo({ id:s.id })}>❌ Rechazar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNueva && (
        <FormNuevaSolicitud
          onClose={() => setModalNueva(false)}
          onCreada={() => { cargar(); setModalNueva(false); onActualizarNotif?.(); }}
        />
      )}

      {modalPeriodo && (
        <ModalAsignarPeriodo
          solicitudId={modalPeriodo.id}
          empleadoId={modalPeriodo.empleado_id}
          onClose={() => setModalPeriodo(null)}
          onConfirmado={() => { cargar(); setModalPeriodo(null); onActualizarNotif?.(); }}
        />
      )}

      {resolviendo && (
        <ModalRechazar
          onClose={() => setResolviendo(null)}
          onConfirmar={(c) => resolver(resolviendo.id, 'rechazada', c)}
        />
      )}
    </div>
  );
}

// Formulario completamente nuevo — sin modal, inline en la página
function FormNuevaSolicitud({ onClose, onCreada }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const calcDias = () => {
    if (!fechaInicio || !fechaFin) return 0;
    const ini = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (fin < ini) return 0;
    let dias = 0;
    const cur = new Date(ini);
    while (cur <= fin) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) dias++;
      cur.setDate(cur.getDate() + 1);
    }
    return dias;
  };

  const dias = calcDias();

  const enviar = async () => {
    if (!fechaInicio || !fechaFin) { setError('Selecciona las fechas'); return; }
    if (dias === 0) { setError('No hay días hábiles en ese rango'); return; }
    setEnviando(true); setError('');
    try {
      await api.post('/api/solicitudes', { fecha_inicio: fechaInicio, fecha_fin: fechaFin, motivo });
      onCreada();
    } catch(e) {
      setError(e.response?.data?.error || 'Error al enviar');
      setEnviando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '20px 16px 40px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--w)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 480,
        marginTop: 60,
        overflow: 'visible',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--g-dk), var(--g))',
          borderRadius: '20px 20px 0 0',
          padding: '18px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:18, color:'#fff' }}>
            📝 Nueva Solicitud
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
            color: '#fff', width: 36, height: 36, borderRadius: '50%',
            cursor: 'pointer', fontSize: 18, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background:'#FFF3CD', border:'1px solid #FFEEBA', borderLeft:'4px solid #856404', padding:'10px 14px', borderRadius:8, fontSize:13, color:'#856404', fontWeight:600 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label>Fecha Inicio *</label>
            <input type="date" className="form-control"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Fecha Fin *</label>
            <input type="date" className="form-control"
              value={fechaFin}
              min={fechaInicio}
              onChange={e => setFechaFin(e.target.value)} />
          </div>

          {dias > 0 && (
            <div style={{ background:'var(--g-soft)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(107,15,43,0.15)', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:40, color:'var(--g)', lineHeight:1 }}>{dias}</div>
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)' }}>días hábiles</div>
                <div style={{ fontSize:11, color:'var(--g60)' }}>se descontarán de tu periodo</div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Motivo (opcional)</label>
            <textarea className="form-control" rows={3}
              placeholder="Describe el motivo de tus vacaciones..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)} />
          </div>
        </div>

        {/* Botones */}
        <div style={{ padding: '16px 20px 20px', display: 'flex', gap: 10 }}>
          <button className="btn-institucional" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-institucional filled" style={{ flex: 2 }} onClick={enviar} disabled={enviando}>
            {enviando ? '⏳ Enviando...' : '📤 Enviar Solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}


// Calcular periodos reales desde fecha ingreso
function calcularPeriodosReales(fechaIngreso) {
  if (!fechaIngreso) return [];
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const periodos = [];
  let inicio = new Date(ingreso);
  let num = 1;
  while (inicio <= hoy && num <= 20) {
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + 6);
    fin.setDate(fin.getDate() - 1);
    // Solo periodos COMPLETADOS
    if (fin < hoy) {
      periodos.push({
        numero: num,
        inicio: new Date(inicio),
        fin: new Date(fin),
        anio: inicio.getFullYear(),
        semestre: num % 2 === 1 ? 1 : 2,
        label: `Periodo ${num}: ${inicio.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})} — ${fin.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}`,
      });
    }
    inicio = new Date(fin);
    inicio.setDate(inicio.getDate() + 1);
    num++;
  }
  return periodos;
}

function ModalAsignarPeriodo({ solicitudId, empleadoId, onClose, onConfirmado }) {
  const [periodos, setPeriodos] = useState([]);
  const [periodoIdx, setPeriodoIdx] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get(`/api/empleados/${empleadoId}`)
      .then(r => {
        const emp = r.data?.empleado || r.data;
        const ps = calcularPeriodosReales(emp?.fecha_ingreso);
        setPeriodos(ps);
        // Seleccionar el último periodo por defecto
        if (ps.length) setPeriodoIdx(ps.length - 1);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [empleadoId]);

  const confirmar = async () => {
    setGuardando(true);
    const p = periodos[periodoIdx];
    try {
      await api.put(`/api/solicitudes/${solicitudId}/resolver`, {
        estatus: 'aprobada',
        periodo_semestre: p?.semestre,
        anio_periodo: p?.anio,
      });
      onConfirmado();
    } catch(e) {
      alert(e.response?.data?.error || 'Error al aprobar');
    } finally { setGuardando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:460 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{ background:'linear-gradient(135deg,#1B5E20,#27ae60)' }}>
          <h2>✅ Aprobar Solicitud</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:'12px 14px', background:'#E8F5E9', borderRadius:10, border:'1px solid #C8E6C9', fontSize:13, color:'#1B5E20', fontWeight:600 }}>
            ✅ Estás a punto de aprobar esta solicitud. ¿A qué periodo de vacaciones pertenecen estos días?
          </div>
          {cargando ? (
            <div style={{ textAlign:'center', padding:20, color:'var(--g60)' }}>Cargando periodos...</div>
          ) : periodos.length === 0 ? (
            <div style={{ padding:'12px 14px', background:'#FFF8E1', borderRadius:10, border:'1px solid #FFE082', fontSize:13, color:'#856404', fontWeight:600 }}>
              ⚠️ Este empleado no tiene fecha de ingreso registrada. Se aprobará sin asignar periodo.
            </div>
          ) : (
            <div className="form-group">
              <label>Periodo al que pertenecen los días</label>
              <select className="form-control" value={periodoIdx}
                onChange={e => setPeriodoIdx(parseInt(e.target.value))}>
                {periodos.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
              {periodos[periodoIdx] && (
                <div style={{ marginTop:8, padding:'10px 12px', background:'var(--g-soft)', borderRadius:8, fontSize:12, color:'var(--g)', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>
                  📅 {periodos[periodoIdx].label}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional filled btn-sm"
            style={{ background:'#1B5E20', borderColor:'#1B5E20' }}
            onClick={confirmar} disabled={guardando}>
            {guardando ? '⏳ Aprobando...' : '✅ Confirmar Aprobación'}
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
              placeholder="El empleado verá este motivo..."
              value={comentario} onChange={e => setComentario(e.target.value)} />
          </div>
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
