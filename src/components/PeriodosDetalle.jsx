import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}
function fmtFechaCorta(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short' });
}

export default function PeriodosDetalle({ empleadoId }) {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [modalEditSol, setModalEditSol] = useState(null);
  const [expandido, setExpandido] = useState({});
  const esAdmin = ['admin','rrhh'].includes(usuario?.rol);

  const cargar = () => {
    setCargando(true);
    api.get(`/api/solicitudes/periodos-detalle/${empleadoId}`)
      .then(r => setDatos(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [empleadoId]);

  const toggleExpandir = (key) => setExpandido(e => ({ ...e, [key]: !e[key] }));

  if (cargando) return <div style={{ padding:20, textAlign:'center' }}><div className="loader" /></div>;
  if (!datos) return null;

  const { periodos, proximo_periodo, total_disponible } = datos;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* RESUMEN TOTAL */}
      <div style={{ background:'linear-gradient(135deg,var(--g-dk),var(--g))', borderRadius:16, padding:'18px 20px', color:'#fff', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:52, lineHeight:1, color:'var(--d)' }}>{total_disponible}</div>
          <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', opacity:.8, marginTop:2 }}>días disponibles</div>
        </div>
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, marginBottom:8 }}>Desglose por periodo:</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {periodos.map(p => (
              <div key={`${p.anio}-${p.periodo_semestre}`} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--d)', minWidth:90 }}>
                  {p.anio} P{p.periodo_semestre}
                </span>
                <span style={{ opacity:.7 }}>{p.periodo_semestre===1?'Ene-Jun':'Jul-Dic'}</span>
                <span style={{ marginLeft:'auto', fontWeight:800 }}>{p.dias_disponibles} días</span>
              </div>
            ))}
          </div>
          {proximo_periodo && (
            <div style={{ marginTop:10, fontSize:11, opacity:.75, fontStyle:'italic' }}>
              ⏳ Próximo periodo en {proximo_periodo.meses_faltantes} mes{proximo_periodo.meses_faltantes!==1?'es':''}
            </div>
          )}
        </div>
        {esAdmin && (
          <button className="btn-institucional btn-sm"
            style={{ background:'rgba(255,255,255,0.15)', borderColor:'rgba(255,255,255,0.4)', color:'#fff', fontSize:11 }}
            onClick={() => setModalHistorico(true)}>
            📥 Registrar días históricos
          </button>
        )}
      </div>

      {/* PERIODOS DETALLADOS */}
      {periodos.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--g60)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>Sin periodos registrados</p>
        </div>
      ) : (
        periodos.map(p => {
          const key = `${p.anio}-${p.periodo_semestre}`;
          const abierto = expandido[key] !== false; // abierto por defecto
          const pctUsado = p.dias_correspondientes > 0
            ? Math.round((p.dias_tomados / p.dias_correspondientes) * 100) : 0;

          return (
            <div key={key} style={{ borderRadius:14, border:'1.5px solid var(--g20)', overflow:'hidden' }}>
              {/* Header del periodo */}
              <div
                onClick={() => toggleExpandir(key)}
                style={{ background: abierto ? 'var(--g-soft)' : 'var(--g10)', padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'var(--g)' }}>
                      {p.anio} — Periodo {p.periodo_semestre} ({p.periodo_semestre===1?'Ene–Jun':'Jul–Dic'})
                    </span>
                    <span style={{ background:'var(--g)', color:'#fff', fontSize:9, padding:'2px 8px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>
                      {p.dias_disponibles} DISP.
                    </span>
                    {p.solicitudes?.some(s => s.es_historico) && (
                      <span style={{ background:'rgba(230,81,0,0.12)', color:'#E65100', fontSize:9, padding:'2px 8px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>
                        INCLUYE HISTÓRICO
                      </span>
                    )}
                  </div>
                  {/* Mini barra progreso */}
                  <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:6, background:'var(--g20)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3,
                        background: pctUsado>=100?'#c0392b':pctUsado>=70?'#E65100':'var(--g)',
                        width:`${Math.min(pctUsado,100)}%`, transition:'width 0.6s' }} />
                    </div>
                    <span style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', whiteSpace:'nowrap' }}>
                      {p.dias_tomados}/{p.dias_correspondientes} ({pctUsado}%)
                    </span>
                  </div>
                </div>
                <span style={{ fontSize:18, transition:'transform 0.3s', transform: abierto?'rotate(180deg)':'rotate(0deg)', color:'var(--g)' }}>▾</span>
              </div>

              {/* Cuerpo expandible */}
              {abierto && (
                <div style={{ padding:'12px 16px', background:'var(--w)', display:'flex', flexDirection:'column', gap:10 }}>
                  {/* Stats del periodo */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:4 }}>
                    {[
                      { label:'Correspondieron', value:p.dias_correspondientes, color:'var(--g)' },
                      { label:'Tomados', value:p.dias_tomados, color:'var(--d-dk)' },
                      { label:'Disponibles', value:p.dias_disponibles, color:p.dias_disponibles>0?'#1B5E20':'#B71C1C' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign:'center', padding:'8px 6px', background:'var(--g10)', borderRadius:10 }}>
                        <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:26, color, lineHeight:1 }}>{value}</div>
                        <div style={{ fontSize:9, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:700, textTransform:'uppercase', marginTop:2 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Lista de vacaciones tomadas en este periodo */}
                  {p.solicitudes?.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'var(--g60)', textTransform:'uppercase', letterSpacing:'0.6px' }}>
                        Vacaciones tomadas en este periodo:
                      </div>
                      {p.solicitudes.map(s => (
                        <div key={s.id} style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'9px 12px', borderRadius:10,
                          background: s.es_historico ? 'rgba(230,81,0,0.06)' : 'var(--g-soft)',
                          border: `1px solid ${s.es_historico ? 'rgba(230,81,0,0.2)' : 'rgba(107,15,43,0.12)'}`,
                          flexWrap:'wrap',
                        }}>
                          <span style={{ fontSize:16 }}>{s.es_historico ? '📂' : '✅'}</span>
                          <div style={{ flex:1, minWidth:120 }}>
                            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)' }}>
                              {fmtFechaCorta(s.fecha_inicio)} → {fmtFechaCorta(s.fecha_fin)}
                              <span style={{ marginLeft:6, background:'var(--g)', color:'#fff', padding:'1px 7px', borderRadius:8, fontSize:10 }}>{s.dias_solicitados} días</span>
                            </div>
                            <div style={{ fontSize:10, color:'var(--g60)', marginTop:2, display:'flex', gap:8, flexWrap:'wrap' }}>
                              {s.es_historico && <span style={{ color:'#E65100', fontWeight:700 }}>HISTÓRICO</span>}
                              {s.aprobado_por_username && <span>Aprobado por: {s.aprobado_por_username}</span>}
                              {s.motivo && <span>💬 {s.motivo}</span>}
                            </div>
                          </div>
                          {esAdmin && (
                            <button className="btn-institucional dorado btn-sm" style={{ fontSize:10 }}
                              onClick={() => setModalEditSol(s)}>✏️</button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'14px', color:'var(--g60)', fontSize:13 }}>
                      Sin vacaciones registradas en este periodo
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* MODAL REGISTRAR HISTÓRICO */}
      {modalHistorico && esAdmin && (
        <ModalHistorico
          empleadoId={empleadoId}
          periodos={periodos}
          onClose={() => setModalHistorico(false)}
          onGuardado={() => { cargar(); setModalHistorico(false); }}
        />
      )}

      {/* MODAL EDITAR SOLICITUD */}
      {modalEditSol && esAdmin && (
        <ModalEditarSolicitud
          solicitud={modalEditSol}
          onClose={() => setModalEditSol(null)}
          onGuardado={() => { cargar(); setModalEditSol(null); }}
        />
      )}
    </div>
  );
}

// ── Modal registrar días históricos ──────────────────────────
function ModalHistorico({ empleadoId, periodos, onClose, onGuardado }) {
  const [form, setForm] = useState({
    tipo: 'rango', // 'rango' o 'dias'
    fecha_inicio: '', fecha_fin: '', dias: '',
    anio: new Date().getFullYear(),
    periodo_semestre: 1,
    notas: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const calcDias = () => {
    if (!form.fecha_inicio || !form.fecha_fin) return 0;
    const ini = new Date(form.fecha_inicio);
    const fin = new Date(form.fecha_fin);
    if (fin < ini) return 0;
    let d = 0; const c = new Date(ini);
    while (c <= fin) { if (c.getDay()!==0&&c.getDay()!==6) d++; c.setDate(c.getDate()+1); }
    return d;
  };

  const diasCalc = form.tipo === 'rango' ? calcDias() : parseInt(form.dias||0);

  const guardar = async () => {
    if (!diasCalc || diasCalc <= 0) { setError('Indica los días correctamente'); return; }
    setGuardando(true); setError('');
    try {
      await api.post('/api/solicitudes/historico', {
        empleado_id: empleadoId,
        fecha_inicio: form.tipo === 'rango' ? form.fecha_inicio : null,
        fecha_fin: form.tipo === 'rango' ? form.fecha_fin : null,
        dias: diasCalc,
        anio: form.anio,
        periodo_semestre: parseInt(form.periodo_semestre),
        notas: form.notas,
      });
      onGuardado();
    } catch(e) { setError(e.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:500 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{ background:'linear-gradient(135deg,#4A0A1E,#E65100)' }}>
          <h2>📥 Registrar Días Históricos</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:'10px 12px', background:'#FFF8E1', borderRadius:10, border:'1px solid #FFE082', fontSize:12, color:'#856404', fontWeight:600 }}>
            📂 Usa esto para registrar vacaciones que ya ocurrieron antes de usar el sistema.
          </div>
          {error && <div style={{ padding:'10px 12px', background:'#FFEBEE', borderRadius:8, color:'#B71C1C', fontSize:12, fontWeight:600 }}>⚠️ {error}</div>}

          {/* Tipo de registro */}
          <div style={{ display:'flex', gap:8 }}>
            {[{ id:'rango', label:'📅 Por rango de fechas' }, { id:'dias', label:'🔢 Solo días (sin fecha)' }].map(t => (
              <button key={t.id} onClick={() => setForm({...form, tipo:t.id})}
                style={{ flex:1, padding:'9px 6px', borderRadius:10, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11,
                  background: form.tipo===t.id ? 'var(--g)' : 'var(--g10)',
                  border: `2px solid ${form.tipo===t.id ? 'var(--g)' : 'var(--g20)'}`,
                  color: form.tipo===t.id ? '#fff' : 'var(--g60)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {form.tipo === 'rango' ? (
            <div className="form-grid">
              <div className="form-group"><label>Fecha inicio</label><input type="date" className="form-control" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} /></div>
              <div className="form-group"><label>Fecha fin</label><input type="date" className="form-control" value={form.fecha_fin} min={form.fecha_inicio} onChange={e=>setForm({...form,fecha_fin:e.target.value})} /></div>
              {diasCalc > 0 && (
                <div style={{ gridColumn:'1/-1', background:'var(--g-soft)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:32, color:'var(--g)' }}>{diasCalc}</span>
                  <span style={{ fontSize:12, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>días hábiles calculados</span>
                </div>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label>Número de días tomados</label>
              <input type="number" className="form-control" min="1" placeholder="Ej: 5" value={form.dias} onChange={e=>setForm({...form,dias:e.target.value})} />
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label>Año</label>
              <select className="form-control" value={form.anio} onChange={e=>setForm({...form,anio:parseInt(e.target.value)})}>
                {[2022,2023,2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Periodo</label>
              <select className="form-control" value={form.periodo_semestre} onChange={e=>setForm({...form,periodo_semestre:e.target.value})}>
                <option value={1}>Periodo 1 (Ene–Jun)</option>
                <option value={2}>Periodo 2 (Jul–Dic)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notas</label>
            <input className="form-control" placeholder="Ej: Vacaciones tomadas en mayo antes del sistema..." value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional filled btn-sm" onClick={guardar} disabled={guardando}>
            {guardando ? '⏳...' : '📥 Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal editar solicitud individual ────────────────────────
function ModalEditarSolicitud({ solicitud, onClose, onGuardado }) {
  const [form, setForm] = useState({
    fecha_inicio: solicitud.fecha_inicio?.split('T')[0] || '',
    fecha_fin: solicitud.fecha_fin?.split('T')[0] || '',
    dias_solicitados: solicitud.dias_solicitados,
    anio: solicitud.anio,
    periodo_semestre: solicitud.periodo_semestre || 1,
    motivo: solicitud.motivo || '',
    estatus: solicitud.estatus,
  });
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put(`/api/solicitudes/${solicitud.id}/editar`, form);
      onGuardado();
    } catch(e) { alert(e.response?.data?.error || 'Error'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:460 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Editar Registro</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="form-grid">
            <div className="form-group"><label>Fecha inicio</label><input type="date" className="form-control" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} /></div>
            <div className="form-group"><label>Fecha fin</label><input type="date" className="form-control" value={form.fecha_fin} onChange={e=>setForm({...form,fecha_fin:e.target.value})} /></div>
            <div className="form-group"><label>Días</label><input type="number" className="form-control" value={form.dias_solicitados} onChange={e=>setForm({...form,dias_solicitados:e.target.value})} min="1" /></div>
            <div className="form-group"><label>Año</label><input type="number" className="form-control" value={form.anio} onChange={e=>setForm({...form,anio:e.target.value})} /></div>
            <div className="form-group">
              <label>Periodo</label>
              <select className="form-control" value={form.periodo_semestre} onChange={e=>setForm({...form,periodo_semestre:e.target.value})}>
                <option value={1}>P1 (Ene–Jun)</option>
                <option value={2}>P2 (Jul–Dic)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Estatus</label>
              <select className="form-control" value={form.estatus} onChange={e=>setForm({...form,estatus:e.target.value})}>
                <option value="aprobada">✅ Aprobada</option>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="rechazada">❌ Rechazada</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Notas</label><input className="form-control" value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})} /></div>
          </div>
          <div style={{ padding:'9px 12px', background:'#FFF8E1', borderRadius:8, fontSize:11, color:'#856404', fontWeight:600 }}>
            ⚠️ Cambiar los días ajusta automáticamente el periodo correspondiente.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional filled btn-sm" onClick={guardar} disabled={guardando}>
            {guardando ? '⏳...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
