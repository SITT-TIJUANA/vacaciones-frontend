import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTATUS_STYLE = {
  aprobada:  { bg:'#E8F5E9', color:'#1B5E20', border:'#C8E6C9', icon:'✅' },
  pendiente: { bg:'#FFF8E1', color:'#E65100', border:'#FFE082', icon:'⏳' },
  rechazada: { bg:'#FFEBEE', color:'#B71C1C', border:'#FFCDD2', icon:'❌' },
  cancelada: { bg:'var(--g10)', color:'var(--g60)', border:'var(--g20)', icon:'🚫' },
};

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}

export default function PeriodosDetalle({ empleadoId, periodos }) {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [guardando, setGuardando] = useState(false);
  const esAdmin = ['admin','rrhh'].includes(usuario?.rol);

  const cargar = () => {
    setCargando(true);
    api.get(`/api/solicitudes/detalle/${empleadoId}`)
      .then(r => setSolicitudes(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [empleadoId]);

  const abrirEditar = (s) => {
    setFormEdit({
      fecha_inicio: s.fecha_inicio?.split('T')[0] || '',
      fecha_fin: s.fecha_fin?.split('T')[0] || '',
      dias_solicitados: s.dias_solicitados,
      anio: s.anio,
      motivo: s.motivo || '',
      estatus: s.estatus,
    });
    setEditando(s.id);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put(`/api/solicitudes/${editando}/editar`, formEdit);
      cargar();
      setEditando(null);
    } catch(e) {
      alert(e.response?.data?.error || 'Error al guardar');
    } finally { setGuardando(false); }
  };

  // Agrupar por año
  const porAnio = solicitudes.reduce((acc, s) => {
    const anio = s.anio || new Date(s.fecha_inicio).getFullYear();
    if (!acc[anio]) acc[anio] = [];
    acc[anio].push(s);
    return acc;
  }, {});

  const anios = Object.keys(porAnio).sort((a,b) => b - a);

  if (cargando) return <div style={{ padding:20, textAlign:'center', color:'var(--g60)' }}>Cargando...</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Resumen por año desde periodos */}
      {periodos && periodos.length > 0 && (
        <div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>
            📊 Resumen por Periodo
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {periodos.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--g10)', borderRadius:12, border:'1px solid var(--g20)', flexWrap:'wrap' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'var(--g)', minWidth:50 }}>{p.anio}</div>
                <div style={{ display:'flex', gap:16, flex:1, flexWrap:'wrap' }}>
                  {[
                    { label:'Correspondieron', value:p.dias_correspondientes, color:'var(--g)' },
                    { label:'Tomados', value:p.dias_tomados, color:'var(--d-dk)' },
                    { label:'Disponibles', value:p.dias_disponibles, color: p.dias_disponibles > 0 ? '#1B5E20' : '#B71C1C' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color, lineHeight:1 }}>{value}</div>
                      <div style={{ fontSize:9, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:700, textTransform:'uppercase', marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {/* Barra progreso */}
                <div style={{ width:'100%', marginTop:4 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: p.dias_correspondientes > 0 ? `${Math.round(p.dias_tomados/p.dias_correspondientes*100)}%` : '0%',
                      background: p.dias_tomados >= p.dias_correspondientes
                        ? 'linear-gradient(90deg,#922020,#c0392b)'
                        : 'linear-gradient(90deg,var(--g),var(--g-lt))'
                    }} />
                  </div>
                  <div style={{ fontSize:9, color:'var(--g60)', marginTop:2, textAlign:'right', fontFamily:'Montserrat,sans-serif' }}>
                    {p.dias_correspondientes > 0 ? Math.round(p.dias_tomados/p.dias_correspondientes*100) : 0}% usado
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de solicitudes */}
      <div>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>
          📋 Historial de Vacaciones
        </div>

        {solicitudes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 20px', color:'var(--g60)' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📅</div>
            <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13 }}>Sin vacaciones registradas</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {anios.map(anio => (
              <div key={anio}>
                {/* Separador de año */}
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'6px 0' }}>
                  <div style={{ width:40, height:2, background:'linear-gradient(90deg,var(--d),var(--g))', borderRadius:1 }} />
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'var(--g)', letterSpacing:'1px' }}>{anio}</span>
                  <div style={{ flex:1, height:2, background:'var(--g20)', borderRadius:1 }} />
                  <span style={{ fontSize:11, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>
                    {porAnio[anio].filter(s=>s.estatus==='aprobada').reduce((s,r)=>s+r.dias_solicitados,0)} días tomados
                  </span>
                </div>

                {porAnio[anio].map(s => {
                  const est = ESTATUS_STYLE[s.estatus] || ESTATUS_STYLE.cancelada;
                  const esManual = s.motivo?.includes('manual') || s.motivo?.includes('administración');
                  return (
                    <div key={s.id} style={{
                      padding:'12px 14px', borderRadius:12,
                      background: est.bg, border:`1.5px solid ${est.border}`,
                      display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
                    }}>
                      {/* Icono estatus */}
                      <div style={{ fontSize:20, flexShrink:0 }}>{est.icon}</div>

                      {/* Info principal */}
                      <div style={{ flex:1, minWidth:140 }}>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:est.color }}>
                          {fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}
                        </div>
                        <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap', alignItems:'center' }}>
                          <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:18, color:est.color }}>{s.dias_solicitados}</span>
                          <span style={{ fontSize:11, color:'var(--g60)' }}>días</span>
                          {esManual && <span style={{ background:'rgba(107,15,43,0.1)', color:'var(--g)', fontSize:9, padding:'2px 8px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>MANUAL</span>}
                          {s.aprobado_por_username && <span style={{ fontSize:10, color:'var(--g60)' }}>por {s.aprobado_por_username}</span>}
                        </div>
                        {s.motivo && <div style={{ fontSize:11, color:'var(--g60)', marginTop:3 }}>💬 {s.motivo}</div>}
                        {s.comentario_resolucion && (
                          <div style={{ fontSize:11, color:'#B71C1C', marginTop:3, fontWeight:600 }}>❌ {s.comentario_resolucion}</div>
                        )}
                      </div>

                      {/* Botón editar — solo admin/rrhh */}
                      {esAdmin && (
                        <button className="btn-institucional dorado btn-sm" onClick={() => abrirEditar(s)}>✏️</button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal editar solicitud */}
      {editando && esAdmin && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Registro de Vacaciones</h2>
              <button className="modal-close" onClick={() => setEditando(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input type="date" className="form-control" value={formEdit.fecha_inicio}
                    onChange={e => setFormEdit({...formEdit, fecha_inicio:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Fecha Fin</label>
                  <input type="date" className="form-control" value={formEdit.fecha_fin}
                    onChange={e => setFormEdit({...formEdit, fecha_fin:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Días</label>
                  <input type="number" className="form-control" value={formEdit.dias_solicitados}
                    onChange={e => setFormEdit({...formEdit, dias_solicitados:e.target.value})} min="1" />
                </div>
                <div className="form-group">
                  <label>Año</label>
                  <input type="number" className="form-control" value={formEdit.anio}
                    onChange={e => setFormEdit({...formEdit, anio:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Estatus</label>
                  <select className="form-control" value={formEdit.estatus}
                    onChange={e => setFormEdit({...formEdit, estatus:e.target.value})}>
                    <option value="aprobada">✅ Aprobada</option>
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="rechazada">❌ Rechazada</option>
                    <option value="cancelada">🚫 Cancelada</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Motivo / Notas</label>
                  <input className="form-control" value={formEdit.motivo}
                    onChange={e => setFormEdit({...formEdit, motivo:e.target.value})}
                    placeholder="Notas sobre este registro..." />
                </div>
              </div>
              <div style={{ padding:'10px 12px', background:'#FFF8E1', borderRadius:8, border:'1px solid #FFE082', fontSize:12, color:'#856404', fontWeight:600 }}>
                ⚠️ Si cambias los días, el periodo se ajustará automáticamente.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn-institucional filled btn-sm" onClick={guardar} disabled={guardando}>
                {guardando ? '⏳...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
