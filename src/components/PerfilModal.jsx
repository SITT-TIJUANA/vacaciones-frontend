import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import CropFoto from './CropFoto';
import { useAuth } from '../context/AuthContext';
import PeriodosDetalle from './PeriodosDetalle';

export default function PerfilModal({ empleadoId, onClose, onActualizar, onVerPeriodos }) {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [fotoExpandida, setFotoExpandida] = useState(false);
  const [tab, setTab] = useState('info');
  const [verDetallePeriodos, setVerDetallePeriodos] = useState(false);

  // Estados editar perfil
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [modalBienvenida, setModalBienvenida] = useState(false);
  const [enviandoBienvenida, setEnviandoBienvenida] = useState(false);
  const [passB, setPassB] = useState('');
  const [okBienvenida, setOkBienvenida] = useState(false);
  const [errBienvenida, setErrBienvenida] = useState('');
  const [formPerfil, setFormPerfil] = useState({});
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [cropArchivo, setCropArchivo] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const fotoRef = useRef();



  // Estados contactos emergencia
  const [contactos, setContactos] = useState([]);
  const [modalContacto, setModalContacto] = useState(null); // null | 'nuevo' | objeto
  const [formContacto, setFormContacto] = useState({});
  const [guardandoContacto, setGuardandoContacto] = useState(false);

  const esAdminRRHH = ['admin','rrhh'].includes(usuario?.rol);
  const anioActual = new Date().getFullYear();

  useEffect(() => {
    api.get(`/api/solicitudes/periodos-detalle/${empleadoId}`)
      .then(r => setDatos({ empleado: r.data.empleado, periodos: r.data.periodos, solicitudes: r.data.periodos.flatMap(p=>p.solicitudes||[]), total_disponible: r.data.total_disponible }))
      .catch(console.error)
      .finally(() => setCargando(false));
    cargarContactos();
    // Cargar permisos del empleado
    api.get(`/api/permisos/empleado/${empleadoId}`)
      .then(r => setPermisos(r.data))
      .catch(console.error);
  }, [empleadoId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const cargarContactos = () => {
    api.get(`/api/contactos-emergencia/${empleadoId}`)
      .then(r => setContactos(Array.isArray(r.data) ? r.data : r.data ? [r.data] : []))
      .catch(() => setContactos([]));
  };

  const abrirEditarPerfil = () => {
    const e = datos?.empleado;
    setFormPerfil({
      nombre: e?.nombre || '',
      apellido_paterno: e?.apellido_paterno || '',
      apellido_materno: e?.apellido_materno || '',
      numero_empleado: e?.numero_empleado || '',
      puesto: e?.puesto || '',
      departamento: e?.departamento || '',
      fecha_ingreso: e?.fecha_ingreso ? e.fecha_ingreso.split('T')[0] : '',
      email: e?.email || '',
      telefono: e?.telefono || '',
    });
    setNuevaFoto(null); setPreviewFoto(null);
    setEditandoPerfil(true);
  };

  const guardarPerfil = async () => {
    setGuardandoPerfil(true);
    try {
      const fd = new FormData();
      Object.entries(formPerfil).forEach(([k,v]) => fd.append(k,v));
      if (nuevaFoto) fd.append('foto', nuevaFoto);
      if (previewFoto === 'BORRAR') fd.append('borrar_foto', 'true');
      await api.put(`/api/empleados/${empleadoId}`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      const r = await api.get(`/api/solicitudes/periodos-detalle/${empleadoId}`);
      setDatos({ empleado: r.data.empleado, periodos: r.data.periodos, solicitudes: r.data.periodos.flatMap(p=>p.solicitudes||[]), total_disponible: r.data.total_disponible });
      setEditandoPerfil(false);
      onActualizar?.();
    } catch(e) { alert(e.response?.data?.error || 'Error al guardar'); }
    finally { setGuardandoPerfil(false); }
  };



  const abrirContacto = (c = null) => {
    setFormContacto(c ? { ...c } : { nombre:'', parentesco:'', telefono:'', telefono_alt:'', correo:'', notas:'' });
    setModalContacto(c || 'nuevo');
  };

  const guardarContacto = async () => {
    if (!formContacto.nombre) { alert('El nombre es requerido'); return; }
    setGuardandoContacto(true);
    try {
      if (modalContacto === 'nuevo') {
        await api.post('/api/contactos-emergencia', { empleado_id: empleadoId, ...formContacto });
      } else {
        await api.put(`/api/contactos-emergencia/${modalContacto.id}`, formContacto);
      }
      cargarContactos();
    // Cargar permisos del empleado
    api.get(`/api/permisos/empleado/${empleadoId}`)
      .then(r => setPermisos(r.data))
      .catch(console.error);
      setModalContacto(null);
    } catch(e) { alert(e.response?.data?.error || 'Error al guardar'); }
    finally { setGuardandoContacto(false); }
  };

  const eliminarContacto = async (id) => {
    if (!window.confirm('¿Eliminar este contacto?')) return;
    try {
      await api.delete(`/api/contactos-emergencia/${id}`);
      cargarContactos();
    // Cargar permisos del empleado
    api.get(`/api/permisos/empleado/${empleadoId}`)
      .then(r => setPermisos(r.data))
      .catch(console.error);
    } catch(e) { alert('Error al eliminar'); }
  };

  if (cargando) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ padding:60 }} onClick={e=>e.stopPropagation()}>
        <div className="loader-wrapper"><div className="loader"/></div>
      </div>
    </div>
  );
  if (!datos) return null;

  const { empleado, periodos, solicitudes } = datos;
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno||''}`.trim();
  const periodoActual = periodos.find(p => p.anio === anioActual) || {};
  const pct = periodoActual.dias_correspondientes
    ? Math.round((periodoActual.dias_tomados / periodoActual.dias_correspondientes) * 100) : 0;

  const calcularInfo = () => {
    if (!empleado.fecha_ingreso) return null;
    const hoy = new Date();
    const ingreso = new Date(empleado.fecha_ingreso);
    const meses = (hoy.getFullYear()-ingreso.getFullYear())*12+(hoy.getMonth()-ingreso.getMonth());
    const periodoNum = Math.floor(meses/6)+1;
    const mesesFaltantes = 6-(meses%6);
    return { meses, periodoNum, mesesFaltantes };
  };
  const info = calcularInfo();

  const TABS = [
    { id:'info',        label:'Información',  icon:'📋' },
    { id:'solicitudes', label:'Solicitudes',  icon:'📝' },
    { id:'contactos',   label:'Contactos',    icon:'🚨' },
  ];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg fade-in" onClick={e=>e.stopPropagation()}>

          {/* HEADER */}
          <div className="perfil-header" style={{ position:'relative' }}>
            <button onClick={onClose} style={{ position:'absolute', top:12, right:12, zIndex:10, width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.25)', border:'2px solid rgba(255,255,255,0.5)', color:'#fff', fontSize:20, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>✕</button>
            {esAdminRRHH && (
              <button onClick={e=>{e.stopPropagation();abrirEditarPerfil();}} style={{ position:'absolute', top:12, left:12, zIndex:10, background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)', color:'#fff', borderRadius:20, padding:'6px 12px', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, display:'flex', alignItems:'center', gap:5 }}>
                ✏️ Editar
              </button>
            )}
            {empleado.foto_url
              ? <img src={empleado.foto_url} alt={nombre} className="perfil-foto" onClick={e=>{e.stopPropagation();setFotoExpandida(true);}} />
              : <div style={{ width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:38,border:'4px solid var(--d)',flexShrink:0 }}>👤</div>
            }
            <div style={{ flex:1, paddingRight:44 }}>
              <div className="perfil-nombre">{nombre}</div>
              <div className="perfil-puesto">{empleado.puesto||'Sin puesto'}</div>
              {empleado.departamento && <div style={{ marginTop:5,fontSize:12,opacity:.8 }}>🏢 {empleado.departamento}</div>}
              {empleado.numero_empleado && <div style={{ marginTop:3,fontSize:12,opacity:.7 }}># {empleado.numero_empleado}</div>}
              {info && <div style={{ marginTop:8,fontSize:11,opacity:.8 }}>⏳ {info.mesesFaltantes} meses para el siguiente periodo</div>}
            </div>
            <div className="dias-ring" style={{ flexShrink:0, marginLeft:'auto' }}>
              <div className="numero">{datos.total_disponible ?? periodoActual.dias_disponibles ?? '—'}</div>
              <div className="etiqueta">días disp.</div>
              <div style={{ fontSize:10,opacity:.7,marginTop:3 }}>{anioActual}</div>
            </div>
          </div>

          {/* BARRA PROGRESO */}
          <div style={{ padding:'12px 20px 0', background:'var(--w)', flexShrink:0 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g)' }}>
              <span>Vacaciones {anioActual}</span>
              <span>{periodoActual.dias_tomados||0} / {periodoActual.dias_correspondientes||0} días ({pct}%)</span>
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${pct>80?'danger':pct>50?'warning':''}`} style={{ width:`${pct}%` }} />
            </div>
          </div>

          {/* TABS */}
          <div style={{ display:'flex', gap:6, padding:'10px 16px 0', background:'var(--w)', flexWrap:'nowrap', flexShrink:0, overflowX:'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                flex:1, minWidth:80, padding:'10px 8px', borderRadius:12,
                background: tab===t.id ? 'var(--g)' : 'var(--g10)',
                border: `2px solid ${tab===t.id ? 'var(--g)' : 'var(--g20)'}`,
                color: tab===t.id ? '#fff' : 'var(--g60)',
                fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11,
                cursor:'pointer', transition:'all 0.25s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                whiteSpace:'nowrap',
              }}>
                <span style={{ fontSize:14 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* CONTENIDO */}
          <div className="modal-body" style={{ flex:'1 1 auto', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>

            {/* ── INFORMACIÓN ── */}
            {tab === 'info' && (
              <div className="form-grid" style={{ gap:12 }}>
                {[
                  { label:'Correo electrónico', value:empleado.email, icon:'✉️' },
                  { label:'Teléfono', value:empleado.telefono, icon:'📱' },
                  { label:'Fecha de ingreso', value:empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-MX',{year:'numeric',month:'long',day:'numeric'}) : null, icon:'📆' },
                  { label:'Antigüedad', value:empleado.fecha_ingreso ? calcularAntiguedad(empleado.fecha_ingreso) : null, icon:'⏱️' },
                  { label:'Periodo actual', value:info ? (() => {
                    if (!empleado.fecha_ingreso) return null;
                    const ingreso = new Date(empleado.fecha_ingreso);
                    let ini = new Date(ingreso);
                    let num = 1;
                    const hoy = new Date();
                    while (num <= 30) {
                      const fin = new Date(ini);
                      fin.setMonth(fin.getMonth() + 6);
                      fin.setDate(fin.getDate() - 1);
                      if (fin >= hoy) {
                        return `Periodo ${num}: ${ini.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})} — ${fin.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}`;
                      }
                      ini = new Date(fin); ini.setDate(ini.getDate() + 1);
                      num++;
                    }
                    return null;
                  })() : null, icon:'🔄' },
                  { label:'Periodos completados', value:info ? `${Math.floor(info.meses/6)} periodos de 6 meses` : null, icon:'✅' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background:'var(--g10)', borderRadius:12, padding:'12px 14px', borderLeft:'3px solid var(--g)' }}>
                    <div style={{ fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)',textTransform:'uppercase',marginBottom:3 }}>{icon} {label}</div>
                    <div style={{ fontWeight:600,color:'var(--txt)',fontSize:14 }}>{value||'—'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── BOTÓN ENVIAR BIENVENIDA ── */}
            {tab === 'info' && empleado?.email && (
              <div style={{ marginTop:8 }}>
                <button
                  className="btn-institucional"
                  style={{ width:'100%', fontSize:13, padding:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)', color:'#fff', border:'none' }}
                  onClick={() => setModalBienvenida(true)}>
                  <span style={{ fontSize:18 }}>📧</span>
                  <span>Enviar correo de bienvenida</span>
                </button>
              </div>
            )}

            {/* ── BOTÓN VER PERIODOS en INFO ── */}
            {tab === 'info' && onVerPeriodos && (
              <div style={{ marginTop:8 }}>
                <button
                  className="btn-institucional dorado"
                  style={{ width:'100%', fontSize:13, padding:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}
                  onClick={() => { onVerPeriodos(empleadoId); onClose(); }}>
                  <span style={{ fontSize:20 }}>📅</span>
                  <span>Ver periodos y vacaciones detalladas</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {/* ── SOLICITUDES ── */}
            {tab === 'solicitudes' && (
              <div>
                {solicitudes.length === 0 ? (
                  <p style={{ textAlign:'center',padding:40,color:'var(--g60)' }}>Sin solicitudes registradas</p>
                ) : (
                  <div className="tabla-wrapper">
                    <table>
                      <thead><tr><th>Periodo</th><th>Días</th><th>Estatus</th><th>Aprobado por</th></tr></thead>
                      <tbody>
                        {solicitudes.map(s => (
                          <tr key={s.id}>
                            <td>
                              <div style={{ fontWeight:600,fontSize:13 }}>{fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}</div>
                              <div style={{ fontSize:11,color:'var(--g60)' }}>{s.anio}</div>
                            </td>
                            <td><span style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,color:'var(--g)',fontSize:18 }}>{s.dias_solicitados}</span></td>
                            <td><span className={`badge badge-${s.estatus}`}>{s.estatus}</span></td>
                            <td style={{ fontSize:12 }}>{s.aprobado_por_username||'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── CONTACTOS DE EMERGENCIA ── */}
            {tab === 'contactos' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--g)' }}>
                    🚨 Contactos de Emergencia
                  </div>
                  <button className="btn-institucional filled btn-sm" onClick={()=>abrirContacto()}>
                    ➕ Agregar Contacto
                  </button>
                </div>

                {contactos.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 20px', background:'var(--g10)', borderRadius:14, border:'2px dashed var(--g20)' }}>
                    <div style={{ fontSize:44, marginBottom:12 }}>🚨</div>
                    <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, color:'var(--g)' }}>Sin contactos de emergencia</p>
                    <p style={{ fontSize:12, color:'var(--g60)', marginTop:6 }}>Agrega uno o más contactos para casos de emergencia</p>
                  </div>
                ) : (
                  contactos.map((c, i) => (
                    <div key={c.id||i} style={{ background:'#FFF8E1', borderRadius:14, padding:'14px 16px', border:'1.5px solid #FFE082' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <div>
                          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'var(--g)' }}>{c.nombre}</div>
                          {c.parentesco && <div style={{ fontSize:12, color:'#856404', fontWeight:600, marginTop:2 }}>💑 {c.parentesco}</div>}
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn-institucional dorado btn-sm" onClick={()=>abrirContacto(c)}>✏️ Editar</button>
                          <button className="btn-institucional peligro btn-sm" onClick={()=>eliminarContacto(c.id)}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        {[
                          { icon:'📱', label:'Teléfono principal', value:c.telefono },
                          { icon:'📞', label:'Teléfono alternativo', value:c.telefono_alt },
                          { icon:'✉️', label:'Correo electrónico', value:c.correo },
                          { icon:'📝', label:'Notas', value:c.notas },
                        ].filter(f=>f.value).map(({ icon, label, value }) => (
                          <div key={label} style={{ background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'8px 10px' }}>
                            <div style={{ fontSize:9,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#856404',textTransform:'uppercase',marginBottom:2 }}>{icon} {label}</div>
                            <div style={{ fontWeight:600,color:'#3D3A35',fontSize:13 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal editar perfil */}
      {editandoPerfil && esAdminRRHH && (
        <div className="modal-overlay" onClick={()=>setEditandoPerfil(false)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2>✏️ Editar Perfil</h2><button className="modal-close" onClick={()=>setEditandoPerfil(false)}>✕</button></div>
            <div className="modal-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 160px', gap:24, alignItems:'start' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {[
                    { titulo:'👤 Datos Personales', campos:[
                      { key:'nombre', label:'Nombre *', placeholder:'Nombre(s)' },
                      { key:'apellido_paterno', label:'Apellido Paterno *', placeholder:'Apellido paterno' },
                      { key:'apellido_materno', label:'Apellido Materno', placeholder:'Apellido materno' },
                      { key:'numero_empleado', label:'Número de Empleado', placeholder:'Ej: TJ-0042' },
                    ]},
                    { titulo:'🏢 Datos Laborales', campos:[
                      { key:'puesto', label:'Puesto', placeholder:'Ej: Director' },
                      { key:'departamento', label:'Departamento', placeholder:'Ej: Dirección' },
                      { key:'fecha_ingreso', label:'Fecha de Ingreso', type:'date' },
                    ]},
                    { titulo:'📞 Contacto', campos:[
                      { key:'email', label:'Correo', type:'email', placeholder:'correo@tijuana.gob.mx' },
                      { key:'telefono', label:'Teléfono', placeholder:'664-000-0000' },
                    ]},
                  ].map(({ titulo, campos }) => (
                    <div key={titulo}>
                      <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'var(--g)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:12,paddingBottom:8,borderBottom:'2px solid var(--g-soft)' }}>{titulo}</div>
                      <div className="form-grid">
                        {campos.map(c => (
                          <div key={c.key} className="form-group">
                            <label>{c.label}</label>
                            <input type={c.type||'text'} className="form-control" placeholder={c.placeholder||''} value={formPerfil[c.key]||''} onChange={e=>setFormPerfil({...formPerfil,[c.key]:e.target.value})} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:10,alignItems:'center',paddingTop:20 }}>
                  <div style={{ width:130,height:130,borderRadius:'50%',overflow:'hidden',border:'4px solid var(--d)',background:'var(--g10)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }} onClick={()=>fotoRef.current?.click()}>
                    {previewFoto && previewFoto!=='BORRAR'
                      ? <img src={previewFoto} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                      : empleado.foto_url && previewFoto!=='BORRAR'
                        ? <img src={empleado.foto_url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                        : <span style={{ fontSize:48 }}>👤</span>
                    }
                  </div>
                  <input ref={fotoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{const f=e.target.files[0];if(!f)return;setCropArchivo(f);e.target.value='';}} />
                  <button className="btn-institucional dorado btn-sm" onClick={()=>fotoRef.current?.click()}>📷 Cambiar foto</button>
                  {(empleado.foto_url||previewFoto)&&previewFoto!=='BORRAR'&&<button className="btn-institucional peligro btn-sm" onClick={()=>{setNuevaFoto(null);setPreviewFoto('BORRAR');}}>🗑️ Quitar foto</button>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={()=>setEditandoPerfil(false)}>Cancelar</button>
              <button className="btn-institucional filled btn-lg" onClick={guardarPerfil} disabled={guardandoPerfil}>{guardandoPerfil?'⏳ Guardando...':'💾 Guardar Cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal contacto emergencia */}
      {modalContacto !== null && (
        <div className="modal-overlay" onClick={()=>setModalContacto(null)}>
          <div className="modal" style={{ maxWidth:500 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header" style={{ background:'linear-gradient(135deg,#856404,#E65100)' }}>
              <h2>🚨 {modalContacto==='nuevo'?'Nuevo':'Editar'} Contacto de Emergencia</h2>
              <button className="modal-close" onClick={()=>setModalContacto(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div className="form-grid">
                <div className="form-group"><label>Nombre completo *</label><input className="form-control" placeholder="Ej: María González" value={formContacto.nombre||''} onChange={e=>setFormContacto({...formContacto,nombre:e.target.value})} /></div>
                <div className="form-group">
                  <label>Parentesco</label>
                  <select className="form-control" value={formContacto.parentesco||''} onChange={e=>setFormContacto({...formContacto,parentesco:e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {['Esposo/a','Padre','Madre','Hijo/a','Hermano/a','Amigo/a','Otro'].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Teléfono principal</label><input className="form-control" placeholder="664-000-0000" value={formContacto.telefono||''} onChange={e=>setFormContacto({...formContacto,telefono:e.target.value})} /></div>
                <div className="form-group"><label>Teléfono alternativo</label><input className="form-control" placeholder="664-000-0000" value={formContacto.telefono_alt||''} onChange={e=>setFormContacto({...formContacto,telefono_alt:e.target.value})} /></div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Correo electrónico</label><input type="email" className="form-control" placeholder="correo@ejemplo.com" value={formContacto.correo||''} onChange={e=>setFormContacto({...formContacto,correo:e.target.value})} /></div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Notas adicionales</label><textarea className="form-control" rows={2} placeholder="Ej: Disponible después de las 6pm..." value={formContacto.notas||''} onChange={e=>setFormContacto({...formContacto,notas:e.target.value})} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={()=>setModalContacto(null)}>Cancelar</button>
              <button className="btn-institucional filled btn-sm" style={{ background:'#E65100',borderColor:'#E65100' }} onClick={guardarContacto} disabled={guardandoContacto}>{guardandoContacto?'⏳...':'💾 Guardar Contacto'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Foto expandida */}
      {fotoExpandida && empleado.foto_url && (
        <div className="modal-overlay" style={{ zIndex:2000 }} onClick={()=>setFotoExpandida(false)}>
          <div style={{ position:'relative',maxWidth:500,width:'90%' }} onClick={e=>e.stopPropagation()}>
            <img src={empleado.foto_url} alt={nombre} className="foto-modal-img" />
            <div style={{ textAlign:'center',marginTop:12,color:'#fff',fontFamily:'Playfair Display,serif',fontStyle:'italic',fontWeight:900,fontSize:16 }}>{nombre}</div>
            <button onClick={()=>setFotoExpandida(false)} style={{ position:'absolute',top:-12,right:-12,background:'var(--g)',border:'none',color:'#fff',width:36,height:36,borderRadius:'50%',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
          </div>
        </div>
      )}
      {/* Modal bienvenida */}
      {modalBienvenida && (
        <div className="modal-overlay" style={{zIndex:1500}} onClick={()=>setModalBienvenida(false)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header" style={{background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)'}}>
              <h2>📧 Enviar Bienvenida</h2>
              <button className="modal-close" onClick={()=>setModalBienvenida(false)}>✕</button>
            </div>
            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
              {okBienvenida ? (
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  <div style={{fontSize:48,marginBottom:12}}>✅</div>
                  <div style={{fontWeight:800,fontSize:16,color:'#1B5E20'}}>¡Correo enviado!</div>
                  <div style={{fontSize:13,color:'#718096',marginTop:6}}>Se envió a {empleado?.email}</div>
                </div>
              ) : (
                <>
                  <div style={{background:'#EEF2FF',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#3730a3',fontWeight:600}}>
                    📧 Se enviará a: <strong>{empleado?.email}</strong>
                  </div>
                  {errBienvenida && <div style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:8,padding:'10px',color:'#B71C1C',fontSize:13}}>⚠️ {errBienvenida}</div>}
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Nueva contraseña *</label>
                    <input type="text" value={passB} onChange={e=>setPassB(e.target.value)} placeholder="Contraseña que recibirá el usuario"
                      style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
                    <p style={{fontSize:11,color:'#718096',marginTop:4}}>Se actualizará la contraseña y se incluirá en el correo.</p>
                  </div>
                </>
              )}
            </div>
            {!okBienvenida && (
              <div className="modal-footer">
                <button className="btn-institucional btn-sm" onClick={()=>setModalBienvenida(false)}>Cancelar</button>
                <button disabled={enviandoBienvenida} onClick={async()=>{
                  if (!passB || passB.length < 6) { setErrBienvenida('Mínimo 6 caracteres'); return; }
                  setEnviandoBienvenida(true); setErrBienvenida('');
                  try {
                    const usersResp = await api.get('/api/usuarios');
                    const u = usersResp.data.find(x=>x.empleado_id===empleadoId);
                    if (!u) { setErrBienvenida('Este empleado no tiene usuario en el sistema'); setEnviandoBienvenida(false); return; }
                    await api.post(`/api/usuarios/${u.id}/bienvenida`, { password: passB });
                    setOkBienvenida(true);
                    setTimeout(()=>{ setModalBienvenida(false); setOkBienvenida(false); setPassB(''); },2500);
                  } catch(e) { setErrBienvenida(e.response?.data?.error||'Error al enviar'); }
                  finally { setEnviandoBienvenida(false); }
                }}
                  style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
                  {enviandoBienvenida?'⏳ Enviando...':'📧 Enviar correo'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {cropArchivo && (
        <CropFoto
          archivo={cropArchivo}
          onConfirmar={file => {
            setNuevaFoto(file);
            const r=new FileReader();r.onload=ev=>setPreviewFoto(ev.target.result);r.readAsDataURL(file);
            setCropArchivo(null);
          }}
          onCancelar={() => setCropArchivo(null)}
        />
      )}
    </>
  );
}

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'});
}

function calcularAntiguedad(fechaIngreso) {
  const hoy = new Date();
  const ingreso = new Date(fechaIngreso);
  let anios = hoy.getFullYear()-ingreso.getFullYear();
  let meses = hoy.getMonth()-ingreso.getMonth();
  if (meses<0){anios--;meses+=12;}
  const partes=[];
  if(anios>0)partes.push(`${anios} año${anios!==1?'s':''}`);
  if(meses>0)partes.push(`${meses} mes${meses!==1?'es':''}`);
  return partes.length?partes.join(' y '):'Menos de 1 mes';
}
