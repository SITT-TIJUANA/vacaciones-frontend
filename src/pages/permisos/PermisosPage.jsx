import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TIPOS = {
  medico:     { label:'Médico',           icon:'🏥', color:'#E53E3E' },
  escolar:    { label:'Escolar/Hijo',     icon:'🏫', color:'#3182CE' },
  personal:   { label:'Personal/Familiar',icon:'🏠', color:'#805AD5' },
  emergencia: { label:'Emergencia',       icon:'⚡', color:'#DD6B20' },
  legal:      { label:'Legal/Judicial',   icon:'⚖️', color:'#2F855A' },
  otro:       { label:'Otro',             icon:'🔧', color:'#718096' },
};

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-');
  return new Date(parseInt(y),parseInt(m)-1,parseInt(d)).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
}

function fmtHora(h) {
  if (!h) return '—';
  const [hh,mm] = String(h).substring(0,5).split(':');
  const h24 = parseInt(hh);
  return `${h24%12||12}:${mm} ${h24>=12?'PM':'AM'}`;
}

// ── Componente principal ──────────────────────────────────
export default function PermisosPage() {
  const { usuario, rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seccion, setSeccion] = useState('solicitudes'); // solicitudes | nuevo | estadisticas
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalResolver, setModalResolver] = useState(null);
  const [modalFoto, setModalFoto] = useState(null);
  const [verFoto, setVerFoto] = useState(null);
  const [modalPDF, setModalPDF] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);

  const mostrarToast = (msg, tipo='ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const r = await api.get('/api/permisos-laborales');
      setPermisos(r.data);
      if (esAdmin) {
        const s = await api.get('/api/permisos-laborales/stats');
        setStats(s.data);
      }
    } catch(e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = permisos.filter(p => {
    if (filtroEstatus && p.estatus !== filtroEstatus) return false;
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    return true;
  });

  return (
    <div style={{ minHeight:'100vh', background:'#F7F8FC', fontFamily:'Montserrat,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>SITT · Control de</div>
          <div style={{ fontSize:28, fontWeight:900, color:'#fff', fontFamily:'Playfair Display,serif', fontStyle:'italic' }}>Permisos Laborales</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { id:'solicitudes', label:'📋 Solicitudes' },
            ...(esAdmin ? [{ id:'estadisticas', label:'📊 Estadísticas' }] : []),
          ].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ padding:'8px 16px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12,
                background: seccion===s.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                color: seccion===s.id ? '#fff' : 'rgba(255,255,255,0.5)',
              }}>
              {s.label}
            </button>
          ))}
          <button onClick={() => setSeccion('nuevo')}
            style={{ padding:'8px 20px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, background:'#2a5298', color:'#fff' }}>
            ➕ Nuevo permiso
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>

        {/* TOAST */}
        {toast && (
          <div style={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)', zIndex:9999,
            background: toast.tipo==='ok'?'#1B5E20':'#B71C1C', color:'#fff',
            padding:'14px 24px', borderRadius:14, fontWeight:700, fontSize:13,
            boxShadow:'0 8px 32px rgba(0,0,0,0.3)', maxWidth:480, textAlign:'center' }}>
            {toast.msg}
          </div>
        )}

        {/* NUEVO PERMISO */}
        {seccion === 'nuevo' && (
          <FormNuevoPermiso
            esAdmin={esAdmin}
            empleadoId={usuario?.empleado_id}
            onCreado={() => { cargar(); setSeccion('solicitudes'); mostrarToast('✅ Solicitud enviada — Se notificó a RRHH y Administración por app y correo.'); }}
            onCancelar={() => setSeccion('solicitudes')}
          />
        )}

        {/* ESTADÍSTICAS */}
        {seccion === 'estadisticas' && esAdmin && stats && (
          <Estadisticas stats={stats} />
        )}

        {/* SOLICITUDES */}
        {seccion === 'solicitudes' && (
          <>
            {/* Filtros */}
            <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', marginBottom:20, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <select value={filtroEstatus} onChange={e=>setFiltroEstatus(e.target.value)} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}>
                <option value="">Todos los estatus</option>
                <option value="pendiente">⏳ Pendientes</option>
                <option value="aprobado">✅ Aprobados</option>
                <option value="rechazado">❌ Rechazados</option>
              </select>
              <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}>
                <option value="">Todos los tipos</option>
                {Object.entries(TIPOS).map(([k,v])=>(
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
              <span style={{ marginLeft:'auto', fontSize:12, color:'#718096', fontWeight:600 }}>{filtrados.length} registros</span>
            </div>

            {cargando ? (
              <div style={{ textAlign:'center', padding:60 }}><div style={{ fontSize:40 }}>⏳</div><p>Cargando...</p></div>
            ) : filtrados.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                <p style={{ fontWeight:700, color:'#718096' }}>No hay permisos registrados</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {filtrados.map(p => (
                  <TarjetaPermiso key={p.id} permiso={p} esAdmin={esAdmin}
                    onResolver={() => setModalResolver(p)}
                    onSubirFoto={() => setModalFoto(p)}
                    onVerFoto={() => setVerFoto(p.foto_firmado_url)}
                    onGenerarPDF={() => setModalPDF(p)}
                    onEliminar={async () => {
                      if (!window.confirm('¿Eliminar este permiso?')) return;
                      await api.delete(`/api/permisos-laborales/${p.id}`);
                      cargar();
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal resolver */}
      {modalResolver && (
        <ModalResolver permiso={modalResolver}
          onClose={() => setModalResolver(null)}
          onGuardado={() => { cargar(); setModalResolver(null); mostrarToast(`✅ Permiso resuelto — El empleado recibirá notificación por app y correo.`); }}
        />
      )}

      {/* Modal subir foto */}
      {modalFoto && (
        <ModalFoto permiso={modalFoto}
          onClose={() => setModalFoto(null)}
          onGuardado={() => { cargar(); setModalFoto(null); mostrarToast('✅ Foto del permiso firmado subida correctamente.'); }}
        />
      )}

      {/* Modal ver foto */}
      {verFoto && (
        <div className="modal-overlay" onClick={() => setVerFoto(null)}>
          <div style={{ maxWidth:700, width:'95%', background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#fff', fontWeight:800 }}>📄 Permiso firmado</span>
              <button style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }} onClick={() => setVerFoto(null)}>✕</button>
            </div>
            <div style={{ padding:20 }}>
              <img src={verFoto} alt="Permiso firmado" style={{ width:'100%', borderRadius:10 }}/>
              <div style={{ marginTop:12, textAlign:'center' }}>
                <a href={verFoto} target="_blank" rel="noreferrer" style={{ padding:'10px 20px', background:'#1a3a6b', color:'#fff', borderRadius:8, textDecoration:'none', fontWeight:700, fontSize:13 }}>
                  🔗 Abrir en nueva pestaña
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {modalPDF && (
        <ModalConfigPDF permiso={modalPDF} onClose={() => setModalPDF(null)} />
      )}
    </div>
  );
}

// ── Tarjeta permiso ───────────────────────────────────────
function TarjetaPermiso({ permiso: p, esAdmin, onResolver, onSubirFoto, onVerFoto, onGenerarPDF, onEliminar }) {
  const tipo = TIPOS[p.tipo] || TIPOS.otro;
  const colorEstatus = p.estatus==='aprobado'?'#27ae60':p.estatus==='rechazado'?'#E53E3E':'#F59E0B';
  const labelEstatus = p.estatus==='aprobado'?'✅ Aprobado':p.estatus==='rechazado'?'❌ Rechazado':'⏳ Pendiente';

  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'18px 22px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderLeft:`4px solid ${tipo.color}`, display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-start' }}>
      {/* Foto empleado */}
      {esAdmin && (
        p.foto_url
          ? <img src={p.foto_url} alt="" style={{ width:52,height:52,borderRadius:'50%',objectFit:'cover',border:'2px solid #e2e8f0',flexShrink:0 }}/>
          : <div style={{ width:52,height:52,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>👤</div>
      )}

      {/* Info */}
      <div style={{ flex:1, minWidth:200 }}>
        {esAdmin && (
          <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:17, color:'#0a1f3d' }}>
            {p.nombre} {p.apellido_paterno}
            <span style={{ fontSize:12, fontWeight:600, color:'#718096', marginLeft:10, fontFamily:'Montserrat,sans-serif', fontStyle:'normal' }}>{p.puesto||''}</span>
          </div>
        )}
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginTop:esAdmin?4:0 }}>
          <span style={{ fontSize:20 }}>{tipo.icon}</span>
          <span style={{ fontWeight:800, fontSize:15, color:tipo.color }}>{tipo.label}</span>
          <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800, background:`${colorEstatus}15`, color:colorEstatus, border:`1px solid ${colorEstatus}30` }}>
            {labelEstatus}
          </span>
          {p.estatus==='aprobado' && (
            <span style={{ fontSize:11, fontWeight:700, color:'#2F855A', padding:'3px 10px', borderRadius:20, background:'#F0FFF4', border:'1px solid #C6F6D5' }}>
              {p.con_goce ? '💰 Con goce' : '🚫 Sin goce'}
            </span>
          )}
        </div>
        <div style={{ marginTop:8, fontSize:13, color:'#4A5568', display:'flex', gap:16, flexWrap:'wrap' }}>
          <span>📅 {fmtFecha(p.fecha)}</span>
          <span>🕐 Salida: {fmtHora(p.hora_salida)}</span>
          {p.hora_regreso && <span>🔙 Regreso: {fmtHora(p.hora_regreso)}</span>}
          {!p.regresa && <span style={{ color:'#E53E3E', fontWeight:700 }}>No regresa</span>}
        </div>
        {p.motivo && <div style={{ marginTop:6, fontSize:12, color:'#718096', fontStyle:'italic' }}>💬 {p.motivo}</div>}
        {p.motivo_rechazo && <div style={{ marginTop:6, fontSize:12, color:'#E53E3E', fontWeight:600 }}>⚠️ Motivo rechazo: {p.motivo_rechazo}</div>}
      </div>

      {/* Acciones */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0, alignItems:'flex-end' }}>
        {esAdmin && p.estatus==='pendiente' && (
          <button onClick={onResolver} style={{ padding:'8px 16px', borderRadius:10, background:'#1a3a6b', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:12, fontFamily:'Montserrat,sans-serif' }}>
            ⚖️ Resolver
          </button>
        )}
        {esAdmin && p.estatus==='aprobado' && (
          <>
            <button onClick={onGenerarPDF} style={{ padding:'8px 16px', borderRadius:10, background:'#2F855A', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:12, fontFamily:'Montserrat,sans-serif' }}>
              📄 Generar PDF
            </button>
            <button onClick={onSubirFoto} style={{ padding:'8px 16px', borderRadius:10, background:'#2a5298', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:12, fontFamily:'Montserrat,sans-serif' }}>
              {p.firmado ? '🔄 Cambiar foto' : '📤 Subir firmado'}
            </button>
            {p.firmado && (
              <button onClick={onVerFoto} style={{ padding:'8px 16px', borderRadius:10, background:'#805AD5', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:12, fontFamily:'Montserrat,sans-serif' }}>
                🖼️ Ver firmado
              </button>
            )}
          </>
        )}
        {!esAdmin && p.estatus==='aprobado' && p.firmado && (
          <button onClick={onVerFoto} style={{ padding:'8px 16px', borderRadius:10, background:'#805AD5', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:12, fontFamily:'Montserrat,sans-serif' }}>
            🖼️ Ver permiso firmado
          </button>
        )}
        {esAdmin && (
          <button onClick={onEliminar} style={{ padding:'6px 12px', borderRadius:10, background:'#FFF5F5', color:'#E53E3E', border:'1px solid #FED7D7', cursor:'pointer', fontWeight:700, fontSize:11, fontFamily:'Montserrat,sans-serif' }}>
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}

// ── Form nuevo permiso ────────────────────────────────────
function FormNuevoPermiso({ esAdmin, empleadoId, onCreado, onCancelar }) {
  const [form, setForm] = useState({ tipo:'medico', fecha:'', hora_salida:'', hora_regreso:'', regresa:true, motivo:'' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [empSel, setEmpSel] = useState(empleadoId||'');

  useEffect(() => {
    if (esAdmin) api.get('/api/empleados').then(r=>setEmpleados(r.data)).catch(()=>{});
  },[esAdmin]);

  const enviar = async () => {
    if (!form.tipo||!form.fecha||!form.hora_salida) { setError('Tipo, fecha y hora de salida son obligatorios'); return; }
    if (form.tipo==='otro'&&!form.motivo.trim()) { setError('El motivo es obligatorio para permisos de tipo "Otro"'); return; }
    if (esAdmin && !empSel) { setError('Selecciona un empleado'); return; }
    setEnviando(true); setError('');
    try {
      await api.post('/api/permisos-laborales', {
        ...form,
        empleado_id: esAdmin ? empSel : empleadoId,
      });
      onCreado();
    } catch(e) { setError(e.response?.data?.error||'Error al enviar'); }
    finally { setEnviando(false); }
  };

  return (
    <div style={{ background:'#fff', borderRadius:20, padding:'28px 28px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', maxWidth:600, margin:'0 auto' }}>
      <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:24, color:'#0a1f3d', marginBottom:6 }}>Solicitar Permiso</div>
      <div style={{ fontSize:13, color:'#718096', marginBottom:24 }}>Completa la información de tu solicitud</div>

      {error && <div style={{ background:'#FFF5F5', border:'1px solid #FED7D7', borderRadius:10, padding:'12px 16px', color:'#B71C1C', fontSize:13, fontWeight:600, marginBottom:16 }}>⚠️ {error}</div>}

      {esAdmin && (
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Empleado *</label>
          <select value={empSel} onChange={e=>setEmpSel(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13 }}>
            <option value="">Seleccionar empleado...</option>
            {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>)}
          </select>
        </div>
      )}

      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Tipo de permiso *</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {Object.entries(TIPOS).map(([k,v])=>(
            <button key={k} onClick={()=>setForm({...form,tipo:k})}
              style={{ padding:'10px 8px', borderRadius:10, border:`2px solid ${form.tipo===k?v.color:'#e2e8f0'}`, background:form.tipo===k?`${v.color}15`:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:form.tipo===k?v.color:'#718096', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 0.2s' }}>
              <span style={{ fontSize:20 }}>{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        <div>
          <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Fecha *</label>
          <input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}
            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
        </div>
        <div>
          <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Hora de salida *</label>
          <input type="time" value={form.hora_salida} onChange={e=>setForm({...form,hora_salida:e.target.value})}
            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <label style={{ fontWeight:700, fontSize:12, color:'#4A5568', textTransform:'uppercase', letterSpacing:0.5 }}>¿Regresa ese día?</label>
          <div style={{ display:'flex', gap:8 }}>
            {[{v:true,l:'Sí'},{v:false,l:'No'}].map(o=>(
              <button key={String(o.v)} onClick={()=>setForm({...form,regresa:o.v})}
                style={{ padding:'6px 16px', borderRadius:20, border:`1.5px solid ${form.regresa===o.v?'#2a5298':'#e2e8f0'}`, background:form.regresa===o.v?'#EEF2FF':'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:form.regresa===o.v?'#2a5298':'#718096' }}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
        {form.regresa && (
          <>
            <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Hora de regreso (opcional)</label>
            <input type="time" value={form.hora_regreso} onChange={e=>setForm({...form,hora_regreso:e.target.value})}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
          </>
        )}
      </div>

      {form.tipo === 'otro' && (
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#E53E3E', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Motivo * (obligatorio)</label>
          <textarea value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})} rows={3} placeholder="Describe el motivo de tu permiso..."
            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #FED7D7', fontFamily:'Montserrat,sans-serif', fontSize:13, resize:'vertical', boxSizing:'border-box' }}/>
        </div>
      )}

      <div style={{ display:'flex', gap:12, marginTop:8 }}>
        <button onClick={onCancelar} style={{ flex:1, padding:'12px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#718096' }}>
          Cancelar
        </button>
        <button onClick={enviar} disabled={enviando} style={{ flex:2, padding:'12px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#0a1f3d,#2a5298)', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14 }}>
          {enviando ? '⏳ Enviando...' : '📋 Enviar solicitud'}
        </button>
      </div>
    </div>
  );
}

// ── Modal resolver ────────────────────────────────────────
function ModalResolver({ permiso, onClose, onGuardado }) {
  const [form, setForm] = useState({ estatus:'aprobado', con_goce:true, motivo_rechazo:'' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    if (form.estatus==='rechazado'&&!form.motivo_rechazo.trim()) { setError('El motivo de rechazo es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      await api.put(`/api/permisos-laborales/${permiso.id}/resolver`, form);
      onGuardado();
    } catch(e) { setError(e.response?.data?.error||'Error'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{ background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)' }}>
          <h2>⚖️ Resolver Permiso</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#EEF2FF', borderRadius:10, padding:'12px 16px' }}>
            <div style={{ fontWeight:800, color:'#0a1f3d' }}>{permiso.nombre} {permiso.apellido_paterno}</div>
            <div style={{ fontSize:13, color:'#4A5568', marginTop:4 }}>
              {TIPOS[permiso.tipo]?.icon} {TIPOS[permiso.tipo]?.label} · {fmtFecha(permiso.fecha)} · {fmtHora(permiso.hora_salida)}
            </div>
          </div>

          {error && <div style={{ background:'#FFF5F5', borderRadius:8, padding:'10px 14px', color:'#B71C1C', fontSize:13 }}>⚠️ {error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            {[{v:'aprobado',l:'✅ Aprobar'},{v:'rechazado',l:'❌ Rechazar'}].map(o=>(
              <button key={o.v} onClick={()=>setForm({...form,estatus:o.v})}
                style={{ flex:1, padding:'10px', borderRadius:10, border:`2px solid ${form.estatus===o.v?(o.v==='aprobado'?'#27ae60':'#E53E3E'):'#e2e8f0'}`, background:form.estatus===o.v?(o.v==='aprobado'?'#F0FFF4':'#FFF5F5'):'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:form.estatus===o.v?(o.v==='aprobado'?'#27ae60':'#E53E3E'):'#718096' }}>
                {o.l}
              </button>
            ))}
          </div>

          {form.estatus === 'aprobado' && (
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:8, textTransform:'uppercase' }}>Goce de sueldo *</label>
              <div style={{ display:'flex', gap:10 }}>
                {[{v:true,l:'💰 Con goce de sueldo'},{v:false,l:'🚫 Sin goce de sueldo'}].map(o=>(
                  <button key={String(o.v)} onClick={()=>setForm({...form,con_goce:o.v})}
                    style={{ flex:1, padding:'10px', borderRadius:10, border:`2px solid ${form.con_goce===o.v?'#2a5298':'#e2e8f0'}`, background:form.con_goce===o.v?'#EEF2FF':'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:form.con_goce===o.v?'#2a5298':'#718096' }}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.estatus === 'rechazado' && (
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#E53E3E', marginBottom:6, textTransform:'uppercase' }}>Motivo del rechazo *</label>
              <textarea value={form.motivo_rechazo} onChange={e=>setForm({...form,motivo_rechazo:e.target.value})} rows={3} placeholder="Explica el motivo del rechazo..."
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #FED7D7', fontFamily:'Montserrat,sans-serif', fontSize:13, resize:'vertical', boxSizing:'border-box' }}/>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#0a1f3d,#2a5298)', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13 }}>
            {guardando?'⏳...':'✅ Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal subir foto ──────────────────────────────────────
function ModalFoto({ permiso, onClose, onGuardado }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const subir = async (file) => {
    if (!file) return;
    setSubiendo(true); setError('');
    try {
      const fd = new FormData();
      fd.append('foto', file);
      await api.post(`/api/permisos-laborales/${permiso.id}/foto`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      onGuardado();
    } catch(e) { setError(e.response?.data?.error||'Error al subir'); }
    finally { setSubiendo(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:440 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{ background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)' }}>
          <h2>📤 Subir permiso firmado</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {error && <div style={{ background:'#FFF5F5', borderRadius:8, padding:'10px', color:'#B71C1C', fontSize:13 }}>⚠️ {error}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <label style={{ flex:1, padding:'14px', borderRadius:12, background:'#EEF2FF', border:'2px dashed #2a5298', cursor:'pointer', textAlign:'center', fontWeight:700, fontSize:13, color:'#2a5298' }}>
              🖼️ Subir foto/archivo
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>subir(e.target.files[0])} disabled={subiendo}/>
            </label>
            <label style={{ flex:1, padding:'14px', borderRadius:12, background:'#F0FFF4', border:'2px dashed #27ae60', cursor:'pointer', textAlign:'center', fontWeight:700, fontSize:13, color:'#27ae60' }}>
              📸 Tomar foto
              <input type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e=>subir(e.target.files[0])} disabled={subiendo}/>
            </label>
          </div>
          {subiendo && <div style={{ textAlign:'center', color:'#718096', fontWeight:700 }}>⏳ Subiendo...</div>}
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal config PDF ──────────────────────────────────────
function ModalConfigPDF({ permiso, onClose }) {
  const COLORES = [
    { nombre:'Azul marino', valor:'#0a1f3d' },
    { nombre:'Guinda SITT', valor:'#6B0F2B' },
    { nombre:'Verde', valor:'#1B5E20' },
    { nombre:'Gris', valor:'#374151' },
    { nombre:'Morado', valor:'#4C1D95' },
  ];
  const [cfg, setCfg] = useState({
    colorHeader: '#0a1f3d',
    colorPersonal: '#0a1f3d',
    mostrarFoto: true,
    mostrarGoce: true,
    mostrarHoraRegreso: true,
    mostrarMotivo: true,
    firmaEmpleado: true,
    firmaRRHH: true,
    firmaAdmin: true,
    tituloPermiso: 'PERMISO LABORAL',
    firmaNombreEmpleado: `${permiso.nombre||''} ${permiso.apellido_paterno||''}`,
    firmaNombreRRHH: 'Recursos Humanos',
    firmaNombreAdmin: 'Administración',
  });

  const generar = async () => {
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'letter' });
    const pageW = 215.9;
    const hoy = new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});

    // Convertir hex a rgb
    const hexRGB = (hex) => {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return [r,g,b];
    };
    const [hr,hg,hb] = hexRGB(cfg.colorHeader);

    // Header
    doc.setFillColor(hr,hg,hb);
    doc.rect(0,0,pageW,50,'F');
    doc.setFillColor(201,168,76);
    doc.rect(0,50,pageW,2.5,'F');

    // Logo
    try {
      const logoRes = await fetch(`${window.location.origin}/vacaciones-frontend/escudo-sitt.png`);
      const logoBlob = await logoRes.blob();
      const logoB64 = await new Promise(r=>{ const fr=new FileReader(); fr.onload=e=>r(e.target.result); fr.readAsDataURL(logoBlob); });
      doc.addImage(logoB64,'PNG',8,8,28,28);
    } catch(e){}

    // Foto empleado
    if (cfg.mostrarFoto && permiso.foto_url) {
      try {
        const token = localStorage.getItem('token');
        const r = await fetch(`https://vacaciones-backend-7ota.onrender.com/api/proxy-imagen?url=${encodeURIComponent(permiso.foto_url)}`,{ headers:{'Authorization':`Bearer ${token}`} });
        if (r.ok) {
          const blob = await r.blob();
          const b64 = await new Promise(res=>{ const fr=new FileReader(); fr.onload=e=>res(e.target.result); fr.readAsDataURL(blob); });
          doc.addImage(b64,'JPEG',pageW-44,6,34,34);
          doc.setDrawColor(201,168,76); doc.setLineWidth(1);
          doc.rect(pageW-44,6,34,34);
        }
      } catch(e){}
    }

    // Textos header
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text('H. XXV Ayuntamiento de Tijuana', 42,14);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text('Sistema Integral de Transporte de Tijuana — SITT',42,21);
    doc.text('Dirección de Operaciones',42,27);
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.setTextColor(201,168,76);
    doc.text(cfg.tituloPermiso,42,35);
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text(`Expedido el: ${hoy}`,42,41);

    // Datos empleado
    let y = 62;
    doc.setFillColor(240,240,248); doc.setDrawColor(hr,hg,hb); doc.setLineWidth(0.3);
    doc.roundedRect(14,y,pageW-28,42,3,3,'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(hr,hg,hb);
    doc.text('DATOS DEL EMPLEADO',20,y+8);
    doc.setDrawColor(201,168,76); doc.setLineWidth(0.5);
    doc.line(20,y+10,pageW-20,y+10);
    const datosEmp = [
      ['Nombre:',`${permiso.nombre||''} ${permiso.apellido_paterno||''}`],
      ['Puesto:',permiso.puesto||'—'],
      ['Departamento:',permiso.departamento||'—'],
    ];
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(50,50,50);
    datosEmp.forEach(([l,v],i)=>{
      const col = i<2 ? 20 : 115;
      const row = y+16+(i%2)*12;
      doc.setFont('helvetica','bold'); doc.setTextColor(hr,hg,hb);
      doc.text(l,col,row);
      doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
      doc.text(v,col+30,row);
    });

    // Detalles permiso
    y += 52;
    doc.setFillColor(hr,hg,hb);
    doc.roundedRect(14,y,pageW-28,10,2,2,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.text('DETALLES DEL PERMISO',pageW/2,y+7,{align:'center'});

    y += 16;
    const TIPOS_PDF = { medico:'🏥 Médico',escolar:'🏫 Escolar/Hijo',personal:'🏠 Personal/Familiar',emergencia:'⚡ Emergencia',legal:'⚖️ Legal/Judicial',otro:'🔧 Otro' };
    const detalles = [
      ['Tipo de permiso:', TIPOS_PDF[permiso.tipo]||permiso.tipo],
      ['Fecha:', fmtFecha(permiso.fecha)],
      ['Hora de salida:', fmtHora(permiso.hora_salida)],
      ...(cfg.mostrarHoraRegreso && permiso.hora_regreso ? [['Hora de regreso:', fmtHora(permiso.hora_regreso)]] : []),
      ...(!permiso.regresa ? [['Observación:', 'No regresa ese día']] : []),
      ...(cfg.mostrarGoce ? [['Goce de sueldo:', permiso.con_goce ? '✅ Con goce de sueldo' : '❌ Sin goce de sueldo']] : []),
      ...(cfg.mostrarMotivo && permiso.motivo ? [['Motivo:', permiso.motivo]] : []),
    ];

    doc.setFillColor(248,248,255); doc.setDrawColor(hr,hg,hb); doc.setLineWidth(0.3);
    doc.roundedRect(14,y,pageW-28,detalles.length*10+12,3,3,'FD');
    detalles.forEach(([l,v],i)=>{
      const row = y+10+i*10;
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(hr,hg,hb);
      doc.text(l,22,row);
      doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
      doc.text(v,80,row);
    });

    // Firmas
    y += detalles.length*10+24;
    doc.setDrawColor(180,180,180); doc.setLineWidth(0.3);
    const firmas = [
      cfg.firmaEmpleado ? { label:'Firma del Empleado', nombre:cfg.firmaNombreEmpleado } : null,
      cfg.firmaRRHH ? { label:'Vo.Bo. Recursos Humanos', nombre:cfg.firmaNombreRRHH } : null,
      cfg.firmaAdmin ? { label:'Vo.Bo. Administración', nombre:cfg.firmaNombreAdmin } : null,
    ].filter(Boolean);

    const firmaW = (pageW-28) / firmas.length;
    firmas.forEach((f,i)=>{
      const x = 14 + i*firmaW + firmaW/2;
      doc.line(x-25, y+20, x+25, y+20);
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(hr,hg,hb);
      doc.text(f.label,x,y+26,{align:'center'});
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,120,120);
      doc.text(f.nombre,x,y+31,{align:'center'});
    });

    // Footer
    const pageH = 279.4;
    doc.setFillColor(hr,hg,hb); doc.rect(0,pageH-12,pageW,12,'F');
    doc.setFillColor(201,168,76); doc.rect(0,pageH-14,pageW,2,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','normal'); doc.setFontSize(7);
    doc.text('Sistema de Permisos Laborales — SITT · H. XXV Ayuntamiento de Tijuana',pageW/2,pageH-4,{align:'center'});

    doc.save(`Permiso_${(permiso.nombre||'').replace(/\s/g,'_')}_${permiso.fecha||''}.pdf`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:520 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{ background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)' }}>
          <h2>📄 Configurar PDF del Permiso</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16, maxHeight:'65vh', overflowY:'auto' }}>

          {/* Color header */}
          <div>
            <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:8, textTransform:'uppercase' }}>Color del encabezado</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {COLORES.map(c=>(
                <button key={c.valor} onClick={()=>setCfg({...cfg,colorHeader:c.valor})}
                  style={{ padding:'8px 14px', borderRadius:20, border:`2px solid ${cfg.colorHeader===c.valor?c.valor:'#e2e8f0'}`, background:cfg.colorHeader===c.valor?c.valor+'20':'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:14,height:14,borderRadius:'50%',background:c.valor,display:'inline-block',border:'1px solid rgba(0,0,0,0.1)' }}/>
                  {c.nombre}
                </button>
              ))}
              <input type="color" value={cfg.colorHeader} onChange={e=>setCfg({...cfg,colorHeader:e.target.value})}
                style={{ width:40,height:36,padding:2,border:'1.5px solid #e2e8f0',borderRadius:8,cursor:'pointer' }} title="Color personalizado"/>
            </div>
          </div>

          {/* Título */}
          <div>
            <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:6, textTransform:'uppercase' }}>Título del permiso</label>
            <input value={cfg.tituloPermiso} onChange={e=>setCfg({...cfg,tituloPermiso:e.target.value})}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:13, boxSizing:'border-box' }}/>
          </div>

          {/* Opciones */}
          <div>
            <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:8, textTransform:'uppercase' }}>Incluir en el PDF</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                ['mostrarFoto','📸 Foto del empleado'],
                ['mostrarGoce','💰 Con/sin goce de sueldo'],
                ['mostrarHoraRegreso','🔙 Hora de regreso'],
                ['mostrarMotivo','💬 Motivo'],
                ['firmaEmpleado','✍️ Firma empleado'],
                ['firmaRRHH','✍️ Firma RRHH'],
                ['firmaAdmin','✍️ Firma Administración'],
              ].map(([k,l])=>(
                <label key={k} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px 12px', borderRadius:10, background:cfg[k]?'#EEF2FF':'#F7F8FC', border:`1px solid ${cfg[k]?'#2a5298':'#e2e8f0'}` }}>
                  <input type="checkbox" checked={cfg[k]} onChange={e=>setCfg({...cfg,[k]:e.target.checked})} style={{ accentColor:'#2a5298' }}/>
                  <span style={{ fontSize:12, fontWeight:700, color:cfg[k]?'#2a5298':'#718096' }}>{l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nombres firmas */}
          {(cfg.firmaEmpleado||cfg.firmaRRHH||cfg.firmaAdmin) && (
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:12, color:'#4A5568', marginBottom:8, textTransform:'uppercase' }}>Nombres en firmas</label>
              {cfg.firmaEmpleado && <input value={cfg.firmaNombreEmpleado} onChange={e=>setCfg({...cfg,firmaNombreEmpleado:e.target.value})} placeholder="Nombre del empleado" style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:12, marginBottom:8, boxSizing:'border-box' }}/>}
              {cfg.firmaRRHH && <input value={cfg.firmaNombreRRHH} onChange={e=>setCfg({...cfg,firmaNombreRRHH:e.target.value})} placeholder="Nombre RRHH" style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:12, marginBottom:8, boxSizing:'border-box' }}/>}
              {cfg.firmaAdmin && <input value={cfg.firmaNombreAdmin} onChange={e=>setCfg({...cfg,firmaNombreAdmin:e.target.value})} placeholder="Nombre Administración" style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontFamily:'Montserrat,sans-serif', fontSize:12, boxSizing:'border-box' }}/>}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button onClick={generar} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#0a1f3d,#2a5298)', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13 }}>
            📄 Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Estadísticas ──────────────────────────────────────────
function Estadisticas({ stats }) {
  const total = parseInt(stats.aprobados)+parseInt(stats.rechazados)+parseInt(stats.pendientes);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
        {[
          { label:'Total', value:total, color:'#0a1f3d', icon:'📋' },
          { label:'Pendientes', value:stats.pendientes, color:'#F59E0B', icon:'⏳' },
          { label:'Aprobados', value:stats.aprobados, color:'#27ae60', icon:'✅' },
          { label:'Rechazados', value:stats.rechazados, color:'#E53E3E', icon:'❌' },
          { label:'Con goce', value:stats.con_goce, color:'#2a5298', icon:'💰' },
          { label:'Sin goce', value:stats.sin_goce, color:'#718096', icon:'🚫' },
        ].map(k=>(
          <div key={k.label} style={{ background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{k.icon}</div>
            <div style={{ fontSize:32, fontWeight:900, color:k.color, fontFamily:'Playfair Display,serif', fontStyle:'italic' }}>{k.value}</div>
            <div style={{ fontSize:11, color:'#718096', fontWeight:700, textTransform:'uppercase', marginTop:4 }}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', borderRadius:14, padding:'20px 24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight:800, color:'#0a1f3d', marginBottom:14, fontSize:14 }}>Por tipo de permiso</div>
        {Object.entries({ medico:stats.medico, escolar:stats.escolar, personal:stats.personal, emergencia:stats.emergencia, legal:stats.legal, otro:stats.otro }).map(([k,v])=>{
          const t = TIPOS[k]; const pct = total>0?Math.round(parseInt(v)/total*100):0;
          return (
            <div key={k} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#4A5568' }}>{t.icon} {t.label}</span>
                <span style={{ fontSize:13, fontWeight:800, color:t.color }}>{v} ({pct}%)</span>
              </div>
              <div style={{ height:8, background:'#f0f0f0', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:t.color, borderRadius:4, transition:'width 0.5s' }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
