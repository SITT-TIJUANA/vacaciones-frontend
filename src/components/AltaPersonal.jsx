import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import CropFoto from './CropFoto';
import escudoSitt from '../assets/escudo-sitt.png';

function calcularDiasCorrespondientes(fechaIngreso) {
  if (!fechaIngreso) return 0;
  const hoy = new Date();
  const ingreso = new Date(fechaIngreso);
  if (ingreso > hoy) return 0;
  const meses = (hoy.getFullYear() - ingreso.getFullYear()) * 12 + (hoy.getMonth() - ingreso.getMonth());
  const periodosCompletos = Math.floor(meses / 6);
  return periodosCompletos * 10;
}

export default function AltaPersonal({ onCreado }) {
  const [form, setForm] = useState({
    nombre: '', apellido_paterno: '', apellido_materno: '',
    numero_empleado: '', puesto: '', departamento: '',
    fecha_ingreso: '', email: '', telefono: '',
    dias_vacaciones: '0',
    username: '', password: '', modalidad: 'CONFIANZA',
  });
  const [diasAuto, setDiasAuto] = useState(0);
  const [diasManual, setDiasManual] = useState(false);
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cropArchivo, setCropArchivo] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (form.fecha_ingreso && !diasManual) {
      const dias = calcularDiasCorrespondientes(form.fecha_ingreso);
      setDiasAuto(dias);
      setForm(f => ({ ...f, dias_vacaciones: String(dias) }));
    }
  }, [form.fecha_ingreso, diasManual]);

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropArchivo(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.apellido_paterno || !form.fecha_ingreso) {
      setError('Nombre, apellido paterno y fecha de ingreso son requeridos'); return;
    }
    if (!form.email) { setError('El correo electrónico es requerido'); return; }
    if (!form.username) { setError('El usuario es requerido'); return; }
    if (!form.password || form.password.length < 6) { setError('La contraseña es requerida (mínimo 6 caracteres)'); return; }
    setEnviando(true); setError('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (foto) fd.append('foto', foto);
    try {
      await api.post('/api/empleados', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setExito(true);
      setTimeout(() => {
        setExito(false);
        setForm({ nombre:'',apellido_paterno:'',apellido_materno:'',numero_empleado:'',puesto:'',departamento:'',fecha_ingreso:'',email:'',telefono:'',dias_vacaciones:'0',username:'',password:'',modalidad:'confianza' });
        setFoto(null); setPreview(null); setDiasAuto(0); setDiasManual(false);
        onCreado?.();
      }, 2200);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al registrar empleado');
    } finally { setEnviando(false); }
  };

  if (exito) return (
    <div className="fade-in" style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:400,gap:18 }}>
      <div style={{ fontSize:80 }} className="float-anim">🎉</div>
      <h2 style={{ fontFamily:'Playfair Display,serif',fontWeight:900,fontStyle:'italic',color:'var(--g)',fontSize:28 }}>¡Empleado registrado!</h2>
      <p style={{ color:'var(--g60)' }}>El personal ha sido dado de alta correctamente.</p>
    </div>
  );

  // Info de periodos para mostrar al usuario
  const infoPeriodo = form.fecha_ingreso ? (() => {
    const hoy = new Date();
    const ingreso = new Date(form.fecha_ingreso);
    if (ingreso > hoy) return null;
    const meses = (hoy.getFullYear() - ingreso.getFullYear()) * 12 + (hoy.getMonth() - ingreso.getMonth());
    const periodosCompletos = Math.floor(meses / 6);
    const mesesFaltantes = 6 - (meses % 6);
    return { meses, periodosCompletos, mesesFaltantes, diasCalculados: periodosCompletos * 10 };
  })() : null;

  return (
    <>
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Alta de Personal</h2>
      </div>

      <div className="card" style={{ maxWidth: 860 }}>
        {error && (
          <div style={{ background:'#FFF8E1',border:'1px solid #FFE082',borderLeft:'4px solid #E65100',padding:'11px 14px',borderRadius:10,marginBottom:20,fontSize:13,color:'#E65100',fontWeight:600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display:'grid',gridTemplateColumns:'1fr 200px',gap:32,alignItems:'start' }}>
          <div style={{ display:'flex',flexDirection:'column',gap:22 }}>

            {/* Datos personales */}
            <div>
              <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'var(--g)',fontSize:13,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:14,paddingBottom:10,borderBottom:'2px solid var(--g-soft)' }}>
                👤 Datos Personales
              </h3>
              <div className="form-grid">
                <div className="form-group"><label>Nombre *</label><input className="form-control" placeholder="Nombre(s)" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} /></div>
                <div className="form-group"><label>Apellido Paterno *</label><input className="form-control" placeholder="Apellido paterno" value={form.apellido_paterno} onChange={e=>setForm({...form,apellido_paterno:e.target.value})} /></div>
                <div className="form-group"><label>Apellido Materno</label><input className="form-control" placeholder="Apellido materno" value={form.apellido_materno} onChange={e=>setForm({...form,apellido_materno:e.target.value})} /></div>
                <div className="form-group"><label>Número de Empleado</label><input className="form-control" placeholder="Ej: TJ-0042" value={form.numero_empleado} onChange={e=>setForm({...form,numero_empleado:e.target.value})} /></div>
              </div>
            </div>

            {/* Datos laborales */}
            <div>
              <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'var(--g)',fontSize:13,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:14,paddingBottom:10,borderBottom:'2px solid var(--g-soft)' }}>
                🏢 Datos Laborales
              </h3>
              <div className="form-grid">
                <div className="form-group"><label>Puesto</label><input className="form-control" placeholder="Ej: Operador de Transporte" value={form.puesto} onChange={e=>setForm({...form,puesto:e.target.value})} /></div>
                <div className="form-group"><label>Departamento</label><input className="form-control" placeholder="Ej: Operaciones" value={form.departamento} onChange={e=>setForm({...form,departamento:e.target.value})} /></div>
                <div className="form-group">
                  <label>Fecha de Ingreso *</label>
                  <input type="date" className="form-control" value={form.fecha_ingreso} onChange={e=>setForm({...form,fecha_ingreso:e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  {/* Info automática de periodos */}
                  {infoPeriodo && (
                    <div style={{ background:'var(--g-soft)',borderRadius:12,padding:'14px 16px',marginBottom:14,border:'1px solid rgba(107,15,43,0.15)' }}>
                      <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,color:'var(--g)',marginBottom:8 }}>
                        🧠 Cálculo automático de vacaciones
                      </div>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                        {[
                          { label:'Meses trabajados', value:`${infoPeriodo.meses} meses` },
                          { label:'Periodos cumplidos (×6 meses)', value:`${infoPeriodo.periodosCompletos} periodo${infoPeriodo.periodosCompletos!==1?'s':''}` },
                          { label:'Días que corresponden', value:`${infoPeriodo.diasCalculados} días (${infoPeriodo.periodosCompletos} × 10)` },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div style={{ fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'var(--g60)',textTransform:'uppercase',letterSpacing:'0.5px' }}>{label}</div>
                            <div style={{ fontWeight:800,color:'var(--g)',fontSize:14,marginTop:2 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {infoPeriodo.mesesFaltantes < 6 && (
                        <div style={{ marginTop:10,fontSize:12,color:'var(--g60)',fontStyle:'italic' }}>
                          ⏳ Faltan {infoPeriodo.mesesFaltantes} mes{infoPeriodo.mesesFaltantes!==1?'es':''} para que se acumule el próximo periodo de 10 días
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-grid">
                    <div className="form-group">
                      <label style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                        <span>Días que corresponden</span>
                        <label style={{ display:'flex',alignItems:'center',gap:6,fontWeight:600,fontSize:10,cursor:'pointer',textTransform:'none',letterSpacing:0 }}>
                          <input type="checkbox" checked={diasManual} onChange={e=>setDiasManual(e.target.checked)} style={{ width:14,height:14 }} />
                          Editar manualmente
                        </label>
                      </label>
                      <input
                        type="number" className="form-control"
                        value={form.dias_vacaciones}
                        onChange={e=>setForm({...form,dias_vacaciones:e.target.value})}
                        disabled={!diasManual}
                        min="0" max="999"
                        style={{ background: diasManual ? 'var(--w)' : 'var(--g10)', fontWeight:800, color:'var(--g)', fontSize:16 }}
                      />
                      {!diasManual && (
                        <span style={{ fontSize:11,color:'var(--g60)',fontStyle:'italic' }}>
                          Calculado automáticamente. Activa "Editar manualmente" para cambiar.
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'var(--g)',fontSize:13,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:14,paddingBottom:10,borderBottom:'2px solid var(--g-soft)' }}>
                📞 Contacto
              </h3>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Correo electrónico <span style={{ color:'#B71C1C', fontWeight:900 }}>*</span></label>
                  <div style={{ background:'#FFF8E1', border:'1px solid #FFE082', borderRadius:8, padding:'8px 12px', marginBottom:6, fontSize:12, color:'#856404', fontWeight:600 }}>
                    ⚠️ Obligatorio — el empleado recibirá notificaciones de vacaciones en este correo
                  </div>
                  <input type="email" className="form-control" placeholder="correo@tijuana.gob.mx" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
                </div>
                <div className="form-group"><label>Teléfono</label><input className="form-control" placeholder="664-000-0000" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} /></div>
              </div>
            </div>

            {/* Acceso sistema */}
            <div>
              <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'var(--g)',fontSize:13,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6,paddingBottom:10,borderBottom:'2px solid var(--g-soft)' }}>
                🔐 Acceso al Sistema
              </h3>
              <p style={{ fontSize:12,color:'var(--g60)',marginBottom:14 }}>
                Si se proporcionan, el empleado podrá iniciar sesión y solicitar vacaciones.
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Modalidad *</label>
                  <div style={{ display:'flex', gap:10 }}>
                    {['CONFIANZA','ASIMILABLE'].map(m=>(
                      <button key={m} type="button" onClick={()=>setForm({...form,modalidad:m})}
                        style={{ flex:1, padding:'10px', borderRadius:10, border:`1.5px solid ${form.modalidad===m?'#6B0F2B':'#e2e8f0'}`, background:form.modalidad===m?'rgba(107,15,43,0.08)':'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:form.modalidad===m?'#6B0F2B':'#718096' }}>
                        {m==='CONFIANZA'?'⭐ Confianza':'🔵 Asimilable'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Modalidad *</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {['confianza','asimilable'].map(m=>(
                      <button key={m} type="button" onClick={()=>setForm({...form,modalidad:m})}
                        style={{ flex:1, padding:'10px', borderRadius:10, border:`1.5px solid ${form.modalidad===m?'#6B0F2B':'#e2e8f0'}`, background:form.modalidad===m?'rgba(107,15,43,0.08)':'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:form.modalidad===m?'#6B0F2B':'#718096', textTransform:'uppercase' }}>
                        {m === 'confianza' ? '🏛️ Confianza' : '📋 Asimilable'}
                      </button>
                    ))}
                  </div>
                  {form.modalidad==='asimilable' && <p style={{fontSize:11,color:'#718096',marginTop:4}}>⚠️ Los empleados asimilables no generan períodos de vacaciones.</p>}
                </div>
                <div className="form-group"><label>Usuario *</label><input className="form-control" placeholder="usuario.apellido" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} /></div>
                <div className="form-group"><label>Contraseña temporal *</label><input type="password" className="form-control" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
              </div>
            </div>
          </div>

          {/* Foto */}
          <div style={{ display:'flex',flexDirection:'column',gap:12,alignItems:'center',paddingTop:32 }}>
            <div className="upload-foto" style={{ width:'100%' }} onClick={()=>fileRef.current.click()}>
              {preview
                ? <img src={preview} alt="preview" style={{ width:150,height:150,objectFit:'cover',borderRadius:'50%',border:'4px solid var(--d)' }} />
                : <><div style={{ fontSize:52 }}>📷</div><p>Subir foto</p><p style={{ fontSize:11,opacity:.7 }}>JPG, PNG, WEBP<br/>máx. 5MB</p></>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFoto} />
            {preview && (
              <button className="btn-institucional peligro btn-sm" onClick={()=>{setFoto(null);setPreview(null);}}>🗑️ Quitar</button>
            )}
          </div>
        </div>

        <div style={{ marginTop:28,display:'flex',justifyContent:'flex-end',gap:12,borderTop:'1px solid var(--g20)',paddingTop:22 }}>
          <button className="btn-institucional filled btn-lg" onClick={handleSubmit} disabled={enviando}>
            {enviando ? '⏳ Guardando...' : '💾 Dar de Alta'}
          </button>
        </div>
      </div>
    </div>
    {cropArchivo && (
      <CropFoto
        archivo={cropArchivo}
        onConfirmar={file => {
          setFoto(file);
          const reader = new FileReader();
          reader.onload = ev => setPreview(ev.target.result);
          reader.readAsDataURL(file);
          setCropArchivo(null);
        }}
        onCancelar={() => setCropArchivo(null)}
      />
    )}
    </>
  );
}
