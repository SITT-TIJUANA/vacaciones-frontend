import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function calcularDias(fechaIngreso) {
  if (!fechaIngreso) return 0;
  const hoy = new Date();
  const ingreso = new Date(fechaIngreso);
  if (ingreso > hoy) return 0;
  const meses = (hoy.getFullYear() - ingreso.getFullYear()) * 12 + (hoy.getMonth() - ingreso.getMonth());
  return Math.floor(meses / 6) * 10;
}

export default function VincularCuenta({ onClose, onVinculado }) {
  const { usuario } = useAuth();
  const [form, setForm] = useState({
    nombre: '', apellido_paterno: '', apellido_materno: '',
    numero_empleado: '', puesto: '', departamento: '',
    fecha_ingreso: '', email: '', telefono: '',
    dias_vacaciones: '0', dias_tomados: '0',
  });
  const [diasManual, setDiasManual] = useState(false);
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [paso, setPaso] = useState(1); // 1=formulario, 2=éxito
  const fileRef = useRef();

  const handleFechaIngreso = (fecha) => {
    setForm(f => ({
      ...f,
      fecha_ingreso: fecha,
      dias_vacaciones: diasManual ? f.dias_vacaciones : String(calcularDias(fecha)),
    }));
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.apellido_paterno || !form.fecha_ingreso) {
      setError('Nombre, apellido paterno y fecha de ingreso son requeridos'); return;
    }
    setEnviando(true); setError('');
    try {
      // Crear empleado vinculando al usuario actual
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (foto) fd.append('foto', foto);

      const { data } = await api.post('/api/empleados', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Vincular el empleado creado al usuario actual
      await api.put(`/api/usuarios/${usuario.id}`, {
        empleado_id: data.empleado.id
      });

      setPaso(2);
      setTimeout(() => { onVinculado?.(); }, 2500);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al vincular cuenta');
    } finally { setEnviando(false); }
  };

  const infoPeriodo = form.fecha_ingreso ? (() => {
    const hoy = new Date();
    const ingreso = new Date(form.fecha_ingreso);
    if (ingreso > hoy) return null;
    const meses = (hoy.getFullYear() - ingreso.getFullYear()) * 12 + (hoy.getMonth() - ingreso.getMonth());
    const periodosCompletos = Math.floor(meses / 6);
    return { meses, periodosCompletos, diasCalculados: periodosCompletos * 10 };
  })() : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔗 Vincular mi Cuenta</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {paso === 2 ? (
          <div style={{ padding:'60px 30px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
            <div style={{ fontSize:72 }} className="float-anim">✅</div>
            <h3 style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:26, color:'var(--g)' }}>
              ¡Cuenta vinculada!
            </h3>
            <p style={{ color:'var(--g60)', fontSize:15, maxWidth:360 }}>
              Tu usuario <strong style={{ color:'var(--g)' }}>{usuario?.username}</strong> y tu perfil de empleado ahora están vinculados.
            </p>
            <div style={{ display:'flex', gap:16, alignItems:'center', background:'var(--g-soft)', padding:'14px 24px', borderRadius:14, border:'1px solid rgba(107,15,43,0.15)' }}>
              <span style={{ fontSize:28 }}>👑</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'var(--g)' }}>{usuario?.username}</span>
              <span style={{ color:'var(--g60)' }}>↔</span>
              <span style={{ fontSize:28 }}>👤</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'var(--g)' }}>{form.nombre} {form.apellido_paterno}</span>
            </div>
            <p style={{ color:'var(--g60)', fontSize:13 }}>
              Ahora puedes cambiar entre <strong>Modo Admin</strong> y <strong>Modo Empleado</strong> con un clic desde el botón en la barra superior.
            </p>
          </div>
        ) : (
          <>
            {/* Banner explicativo */}
            <div style={{ background:'linear-gradient(135deg,var(--g-dk),var(--g))', padding:'14px 28px', display:'flex', alignItems:'center', gap:14, color:'#fff' }}>
              <span style={{ fontSize:32 }}>🔗</span>
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13 }}>Estás creando tu perfil de empleado</div>
                <div style={{ fontSize:12, opacity:.8 }}>Se vinculará automáticamente a tu usuario <strong>{usuario?.username}</strong></div>
              </div>
            </div>

            <div className="modal-body">
              {error && (
                <div style={{ background:'#FFF8E1', border:'1px solid #FFE082', borderLeft:'4px solid #E65100', padding:'11px 14px', borderRadius:10, marginBottom:20, fontSize:13, color:'#E65100', fontWeight:600 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 160px', gap:24, alignItems:'start' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

                  {/* Datos personales */}
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, paddingBottom:8, borderBottom:'2px solid var(--g-soft)' }}>
                      👤 Datos Personales
                    </div>
                    <div className="form-grid">
                      <div className="form-group"><label>Nombre *</label><input className="form-control" placeholder="Nombre(s)" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} /></div>
                      <div className="form-group"><label>Apellido Paterno *</label><input className="form-control" placeholder="Apellido paterno" value={form.apellido_paterno} onChange={e=>setForm({...form,apellido_paterno:e.target.value})} /></div>
                      <div className="form-group"><label>Apellido Materno</label><input className="form-control" placeholder="Apellido materno" value={form.apellido_materno} onChange={e=>setForm({...form,apellido_materno:e.target.value})} /></div>
                      <div className="form-group"><label>Número de Empleado</label><input className="form-control" placeholder="Ej: TJ-0042" value={form.numero_empleado} onChange={e=>setForm({...form,numero_empleado:e.target.value})} /></div>
                    </div>
                  </div>

                  {/* Datos laborales */}
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, paddingBottom:8, borderBottom:'2px solid var(--g-soft)' }}>
                      🏢 Datos Laborales
                    </div>
                    <div className="form-grid">
                      <div className="form-group"><label>Puesto</label><input className="form-control" placeholder="Ej: Director" value={form.puesto} onChange={e=>setForm({...form,puesto:e.target.value})} /></div>
                      <div className="form-group"><label>Departamento</label><input className="form-control" placeholder="Ej: Dirección" value={form.departamento} onChange={e=>setForm({...form,departamento:e.target.value})} /></div>
                      <div className="form-group">
                        <label>Fecha de Ingreso *</label>
                        <input type="date" className="form-control" value={form.fecha_ingreso} onChange={e=>handleFechaIngreso(e.target.value)} />
                      </div>
                      <div className="form-group"><label>Correo</label><input type="email" className="form-control" placeholder="correo@tijuana.gob.mx" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
                    </div>
                  </div>

                  {/* Vacaciones */}
                  {form.fecha_ingreso && (
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, paddingBottom:8, borderBottom:'2px solid var(--g-soft)' }}>
                        📅 Vacaciones
                      </div>

                      {infoPeriodo && (
                        <div style={{ background:'var(--g-soft)', borderRadius:12, padding:'12px 14px', marginBottom:14, border:'1px solid rgba(107,15,43,0.12)' }}>
                          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'var(--g)', marginBottom:8 }}>🧠 Cálculo automático</div>
                          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                            <div><div style={{ fontSize:10, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:700, textTransform:'uppercase' }}>Meses trabajados</div><div style={{ fontWeight:800, color:'var(--g)', fontSize:15 }}>{infoPeriodo.meses}</div></div>
                            <div><div style={{ fontSize:10, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:700, textTransform:'uppercase' }}>Periodos (×6 meses)</div><div style={{ fontWeight:800, color:'var(--g)', fontSize:15 }}>{infoPeriodo.periodosCompletos}</div></div>
                            <div><div style={{ fontSize:10, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:700, textTransform:'uppercase' }}>Días que corresponden</div><div style={{ fontWeight:800, color:'var(--g)', fontSize:15 }}>{infoPeriodo.diasCalculados}</div></div>
                          </div>
                        </div>
                      )}

                      <div className="form-grid">
                        <div className="form-group">
                          <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span>Días correspondientes</span>
                            <label style={{ display:'flex', alignItems:'center', gap:5, fontWeight:600, fontSize:10, cursor:'pointer', textTransform:'none', letterSpacing:0 }}>
                              <input type="checkbox" checked={diasManual} onChange={e=>{setDiasManual(e.target.checked);}} style={{ width:13, height:13 }} />
                              Manual
                            </label>
                          </label>
                          <input type="number" className="form-control" value={form.dias_vacaciones}
                            onChange={e=>setForm({...form,dias_vacaciones:e.target.value})}
                            disabled={!diasManual} min="0"
                            style={{ fontWeight:800, color:'var(--g)', fontSize:15, background: diasManual?'var(--w)':'var(--g10)' }} />
                        </div>
                        <div className="form-group">
                          <label>Días ya tomados</label>
                          <input type="number" className="form-control" value={form.dias_tomados}
                            onChange={e=>setForm({...form,dias_tomados:e.target.value})}
                            min="0" placeholder="0"
                            style={{ fontWeight:800, color:'var(--d-dk)', fontSize:15 }} />
                          <span style={{ fontSize:11, color:'var(--g60)', fontStyle:'italic' }}>Días tomados antes de este registro</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Foto */}
                <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center', paddingTop:28 }}>
                  <div className="upload-foto" style={{ width:'100%' }} onClick={()=>fileRef.current.click()}>
                    {preview
                      ? <img src={preview} alt="preview" style={{ width:130, height:130, objectFit:'cover', borderRadius:'50%', border:'4px solid var(--d)' }} />
                      : <><div style={{ fontSize:44 }}>📷</div><p style={{ fontSize:12 }}>Tu foto</p><p style={{ fontSize:10, opacity:.7 }}>JPG/PNG<br/>máx. 5MB</p></>
                    }
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFoto} />
                  {preview && <button className="btn-institucional peligro btn-sm" onClick={()=>{setFoto(null);setPreview(null);}}>🗑️</button>}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
              <button className="btn-institucional filled btn-lg" onClick={handleSubmit} disabled={enviando}>
                {enviando ? '⏳ Vinculando...' : '🔗 Vincular mi Cuenta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
