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
      await api.put(`/api/solicitudes/${id}/resolver`, { estatus, comentario });
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
        <h2 className="section-title">Solicitudes de Vacaciones</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-control" style={{ width: 160 }} value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}>
            <option value="">Todos los estatus</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="cancelada">Canceladas</option>
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
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gris-texto)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <p style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 16 }}>Sin solicitudes</p>
        </div>
      ) : (
        <div className="tabla-wrapper card">
          <table>
            <thead>
              <tr>
                {esAdmin && <th>Empleado</th>}
                <th>Periodo</th>
                <th>Días</th>
                <th>Motivo</th>
                <th>Estatus</th>
                <th>Fecha Solicitud</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtradas.map(s => (
                <tr key={s.id}>
                  {esAdmin && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.foto_url
                          ? <img src={s.foto_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 20 }}>👤</span>
                        }
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{s.nombre} {s.apellido_paterno}</span>
                      </div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gris-texto)' }}>{s.anio}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'Montserrat', fontWeight: 800, color: 'var(--guinda)', fontSize: 16 }}>
                      {s.dias_solicitados}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--gris-texto)', maxWidth: 160 }}>
                    {s.motivo || '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${s.estatus}`}>
                      {s.estatus === 'pendiente' && '⏳ '}
                      {s.estatus === 'aprobada' && '✅ '}
                      {s.estatus === 'rechazada' && '❌ '}
                      {s.estatus === 'cancelada' && '🚫 '}
                      {s.estatus}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gris-texto)' }}>
                    {fmtFecha(s.created_at)}
                  </td>
                  {esAdmin && (
                    <td>
                      {s.estatus === 'pendiente' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-institucional dorado btn-sm"
                            onClick={() => resolver(s.id, 'aprobada')}
                          >✅ Aprobar</button>
                          <button
                            className="btn-institucional peligro btn-sm"
                            onClick={() => setResolviendo({ id: s.id, accion: 'rechazada' })}
                          >❌ Rechazar</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva solicitud */}
      {modalNueva && (
        <ModalNuevaSolicitud
          onClose={() => setModalNueva(false)}
          onCreada={() => { cargar(); setModalNueva(false); }}
        />
      )}

      {/* Modal rechazar con comentario */}
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
  const [form, setForm] = useState({ fecha_inicio: '', fecha_fin: '', motivo: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.fecha_inicio || !form.fecha_fin) { setError('Selecciona las fechas'); return; }
    setEnviando(true); setError('');
    try {
      await api.post('/api/solicitudes', form);
      onCreada();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al enviar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📝 Nueva Solicitud de Vacaciones</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ background: '#FFF3CD', border: '1px solid #FFEEBA', borderLeft: '4px solid #856404', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#856404', fontWeight: 600 }}>⚠️ {error}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>Fecha Inicio</label>
              <input type="date" className="form-control" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Fecha Fin</label>
              <input type="date" className="form-control" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} min={form.fecha_inicio} />
            </div>
          </div>
          <div className="form-group">
            <label>Motivo (opcional)</label>
            <textarea className="form-control" rows={3} placeholder="Describe el motivo de tus vacaciones..." value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional filled btn-sm" onClick={handleSubmit} disabled={enviando}>
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
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>❌ Rechazar Solicitud</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Motivo del rechazo</label>
            <textarea className="form-control" rows={3} placeholder="Indica el motivo del rechazo..." value={comentario} onChange={e => setComentario(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional peligro btn-sm" onClick={() => onConfirmar(comentario)}>Confirmar Rechazo</button>
        </div>
      </div>
    </div>
  );
}

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}
