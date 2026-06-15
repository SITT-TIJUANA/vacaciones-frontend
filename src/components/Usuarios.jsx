import { useState, useEffect } from 'react';
import api from '../services/api';

const ROLES_INFO = [
  {
    rol: 'admin',
    emoji: '👑',
    color: 'var(--guinda)',
    bg: 'rgba(107,15,43,0.06)',
    border: 'var(--guinda)',
    permisos: [
      'Acceso completo al sistema',
      'Alta, baja y edición de empleados',
      'Gestión de usuarios y roles',
      'Aprobar y rechazar solicitudes',
      'Ver todos los reportes',
      'Configurar periodos de vacaciones',
    ]
  },
  {
    rol: 'rrhh',
    emoji: '📋',
    color: 'var(--dorado-dark)',
    bg: 'rgba(201,168,76,0.06)',
    border: 'var(--dorado-dark)',
    permisos: [
      'Ver todos los empleados',
      'Dar de alta empleados',
      'Aprobar y rechazar solicitudes',
      'Ver y exportar reportes',
      'Configurar periodos de vacaciones',
      'NO puede gestionar usuarios',
    ]
  },
  {
    rol: 'empleado',
    emoji: '👤',
    color: '#27ae60',
    bg: 'rgba(39,174,96,0.06)',
    border: '#27ae60',
    permisos: [
      'Ver su propio perfil',
      'Solicitar vacaciones',
      'Ver historial de sus solicitudes',
      'Ver sus días disponibles',
      'NO puede ver otros empleados',
      'NO puede aprobar solicitudes',
    ]
  }
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', rol: 'empleado', empleado_id: '' });
  const [modalPassword, setModalPassword] = useState(null);
  const [modalVincular, setModalVincular] = useState(null);
  const [modalBienvenida, setModalBienvenida] = useState(null); // {id, username}
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    setCargando(true);
    Promise.all([api.get('/api/usuarios'), api.get('/api/empleados')])
      .then(([u, e]) => { setUsuarios(u.data); setEmpleados(e.data); })
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const crearUsuario = async () => {
    if (!form.username || !form.password) { setError('Usuario y contraseña requeridos'); return; }
    setEnviando(true); setError('');
    try {
      await api.post('/api/usuarios', form);
      cargar(); setModal(false);
      setForm({ username: '', password: '', rol: 'empleado', empleado_id: '' });
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear usuario');
    } finally { setEnviando(false); }
  };

  const toggleActivo = async (id, activo) => {
    try { await api.put(`/api/usuarios/${id}`, { activo: !activo }); cargar(); }
    catch (e) { alert('Error al actualizar'); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try { await api.delete(`/api/usuarios/${id}`); cargar(); }
    catch (e) { alert(e.response?.data?.error || 'Error al eliminar'); }
  };

  return (
    <>
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Gestión de Usuarios</h2>
        <button className="btn-institucional filled" onClick={() => setModal(true)}>➕ Nuevo Usuario</button>
      </div>

      {/* Descripción de roles */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 15, color: 'var(--guinda)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          🔐 ¿Qué puede hacer cada rol?
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {ROLES_INFO.map(r => (
            <div key={r.rol} className="rol-card" style={{ borderColor: r.border, background: r.bg }}>
              <h3 style={{ color: r.color, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{r.emoji}</span>
                {r.rol.toUpperCase()}
              </h3>
              <ul style={{ color: r.color }}>
                {r.permisos.map(p => (
                  <li key={p} style={{ color: p.startsWith('NO') ? '#e74c3c' : 'var(--gris-texto)' }}>
                    <span style={{ color: p.startsWith('NO') ? '#e74c3c' : r.color }}>{p.startsWith('NO') ? '✗' : '✓'}</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla usuarios */}
      {cargando ? (
        <div className="loader-wrapper"><div className="loader" /></div>
      ) : (
        <div className="tabla-wrapper card">
          <table>
            <thead>
              <tr><th>Usuario</th><th>Rol</th><th>Empleado vinculado</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const rolInfo = ROLES_INFO.find(r => r.rol === u.rol);
                return (
                  <tr key={u.id}>
                    <td><strong style={{ fontFamily: 'Montserrat' }}>{u.username}</strong></td>
                    <td>
                      <span style={{ background: rolInfo?.bg, color: rolInfo?.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, fontFamily: 'Montserrat', textTransform: 'uppercase', border: `1px solid ${rolInfo?.border}` }}>
                        {rolInfo?.emoji} {u.rol}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.nombre ? `${u.nombre} ${u.apellido_paterno}` : '—'}</td>
                    <td>
                      <span style={{ background: u.activo ? '#D4EDDA' : '#F8D7DA', color: u.activo ? '#155724' : '#721C24', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat' }}>
                        {u.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gris-texto)' }}>{new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className={`btn-institucional btn-sm ${u.activo ? 'peligro' : 'dorado'}`} onClick={() => toggleActivo(u.id, u.activo)}>
                          {u.activo ? '🔒' : '🔓'}
                        </button>
                        <button style={{padding:"4px 8px",borderRadius:8,border:"1px solid #1B5E20",background:"rgba(27,94,32,0.08)",color:"#1B5E20",cursor:"pointer",fontWeight:700,fontSize:11}} onClick={()=>setModalVincular({id:u.id,username:u.username,empleado_id:u.empleado_id||""})}>🔗</button>
                        <button style={{padding:"4px 8px",borderRadius:8,border:"1px solid #C9A84C",background:"rgba(201,168,76,0.1)",color:"#92400E",cursor:"pointer",fontWeight:700,fontSize:11}} onClick={()=>setModalPassword({id:u.id,username:u.username})}>🔑</button>
                        <button className="btn-institucional peligro btn-sm" onClick={() => eliminar(u.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔐 Nuevo Usuario</h2>
              <button className="modal-close" onClick={() => { setModal(false); setError(''); }}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div style={{ background: '#FFF3CD', border: '1px solid #FFEEBA', borderLeft: '4px solid #856404', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#856404', fontWeight: 600 }}>⚠️ {error}</div>}
              <div className="form-group">
                <label>Username</label>
                <input className="form-control" placeholder="nombre.apellido" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="password" className="form-control" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select className="form-control" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                  <option value="empleado">👤 Empleado</option>
                  <option value="rrhh">📋 RRHH</option>
                  <option value="admin">👑 Admin</option>
                </select>
                {form.rol && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: ROLES_INFO.find(r => r.rol === form.rol)?.bg, fontSize: 12, color: 'var(--gris-texto)' }}>
                    {ROLES_INFO.find(r => r.rol === form.rol)?.permisos.slice(0,3).map(p => <div key={p}>• {p}</div>)}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Vincular con empleado (opcional)</label>
                <select className="form-control" value={form.empleado_id} onChange={e => setForm({ ...form, empleado_id: e.target.value })}>
                  <option value="">— Sin vincular —</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => { setModal(false); setError(''); }}>Cancelar</button>
              <button className="btn-institucional filled btn-sm" onClick={crearUsuario} disabled={enviando}>
                {enviando ? '⏳...' : '💾 Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    {modalPassword && (
      <ModalCambiarPassword usuario={modalPassword} onClose={()=>setModalPassword(null)}/>
    )}
    {modalVincular && (
      <ModalVincularEmpleado usuario={modalVincular} empleados={empleados} onClose={()=>setModalVincular(null)} onGuardado={()=>{ cargar(); setModalVincular(null); }}/>
    )}
    </>
  );
}

function ModalCambiarPassword({ usuario, onClose }) {
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const guardar = async () => {
    if (!pass || pass.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (pass !== confirmPass) { setError('Las contraseñas no coinciden'); return; }
    setEnviando(true); setError('');
    try {
      await api.post(`/api/auth/reset-password/${usuario.id}`, { password_nuevo: pass });
      setOk(true);
      setTimeout(() => onClose(), 2000);
    } catch(e) { setError(e.response?.data?.error || 'Error al actualizar'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔑 Cambiar Contraseña</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:'#EEF2FF',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#3730a3',fontWeight:600}}>
            👤 Usuario: <strong>{usuario.username}</strong>
          </div>
          {error && <div style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:8,padding:'10px',color:'#B71C1C',fontSize:13}}>⚠️ {error}</div>}
          {ok && <div style={{background:'#F0FFF4',border:'1px solid #c6f6d5',borderRadius:8,padding:'10px',color:'#1B5E20',fontSize:13,fontWeight:700}}>✅ Contraseña actualizada correctamente</div>}
          <div>
            <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Nueva contraseña</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Mínimo 6 caracteres"
              style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Confirmar contraseña</label>
            <input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Repetir contraseña"
              style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}
              onKeyDown={e=>e.key==='Enter'&&guardar()}/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button onClick={guardar} disabled={enviando||ok}
            style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#6B0F2B,#9B1540)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
            {enviando?'⏳...':'✅ Actualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEnviarBienvenida({ usuario, onClose }) {
  const [pass, setPass] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    if (!pass || pass.length < 6) { setError('Ingresa una contraseña (mínimo 6 caracteres)'); return; }
    setEnviando(true); setError('');
    try {
      const r = await api.post(`/api/usuarios/${usuario.id}/bienvenida`, { password: pass });
      setOk(true);
      setTimeout(() => onClose(), 2500);
    } catch(e) { setError(e.response?.data?.error || 'Error al enviar'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)'}}>
          <h2>📧 Enviar Bienvenida</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          {ok ? (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:48,marginBottom:12}}>✅</div>
              <div style={{fontWeight:800,fontSize:16,color:'#1B5E20'}}>¡Correo enviado!</div>
            </div>
          ) : (
            <>
              <div style={{background:'#EEF2FF',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#3730a3',fontWeight:600}}>
                📧 Se enviará a: <strong>{usuario.email || 'Sin correo registrado'}</strong>
              </div>
              {error && <div style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:8,padding:'10px',color:'#B71C1C',fontSize:13}}>⚠️ {error}</div>}
              <div>
                <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Nueva contraseña para enviar *</label>
                <input type="text" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Contraseña que recibirá el usuario"
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}/>
                <p style={{fontSize:11,color:'#718096',marginTop:4}}>Esta contraseña se actualizará y se incluirá en el correo.</p>
              </div>
            </>
          )}
        </div>
        {!ok && (
          <div className="modal-footer">
            <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
            <button onClick={enviar} disabled={enviando}
              style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#0a1f3d,#1a3a6b)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
              {enviando?'⏳ Enviando...':'📧 Enviar correo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalVincularEmpleado({ usuario, empleados, onClose, onGuardado }) {
  const [empId, setEmpId] = useState(usuario.empleado_id || '');
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    try {
      await api.put(`/api/usuarios/${usuario.id}`, { empleado_id: empId || null });
      setOk(true);
      setTimeout(() => onGuardado(), 1500);
    } catch(e) { alert(e.response?.data?.error || 'Error'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{background:'linear-gradient(135deg,#1B5E20,#2E7D32)'}}>
          <h2>🔗 Vincular Empleado</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          {ok ? (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:48}}>✅</div>
              <div style={{fontWeight:800,color:'#1B5E20',marginTop:8}}>¡Vinculado correctamente!</div>
            </div>
          ) : (
            <>
              <div style={{background:'#EEF2FF',borderRadius:10,padding:'12px',fontSize:13,color:'#3730a3',fontWeight:600}}>
                👤 Usuario: <strong>{usuario.username}</strong>
              </div>
              <div>
                <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Vincular con empleado</label>
                <select value={empId} onChange={e=>setEmpId(e.target.value)}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}>
                  <option value="">— Sin vincular —</option>
                  {empleados.map(e=>(
                    <option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno} — {e.puesto||'Sin puesto'}</option>
                  ))}
                </select>
                <p style={{fontSize:11,color:'#718096',marginTop:4}}>Puedes vincular o desvincular en cualquier momento.</p>
              </div>
            </>
          )}
        </div>
        {!ok && (
          <div className="modal-footer">
            <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
            <button onClick={guardar} disabled={enviando}
              style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#1B5E20,#2E7D32)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
              {enviando?'⏳...':'🔗 Guardar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
