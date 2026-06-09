import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', rol: 'empleado', empleado_id: '' });
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
    } finally {
      setEnviando(false);
    }
  };

  const toggleActivo = async (id, activo) => {
    try {
      await api.put(`/api/usuarios/${id}`, { activo: !activo });
      cargar();
    } catch (e) { alert('Error al actualizar'); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try { await api.delete(`/api/usuarios/${id}`); cargar(); }
    catch (e) { alert(e.response?.data?.error || 'Error al eliminar'); }
  };

  const ROL_BADGE = { admin: '#e74c3c', rrhh: '#3498db', empleado: '#27ae60' };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Gestión de Usuarios</h2>
        <button className="btn-institucional filled" onClick={() => setModal(true)}>
          ➕ Nuevo Usuario
        </button>
      </div>

      {cargando ? (
        <div className="loader-wrapper"><div className="loader" /></div>
      ) : (
        <div className="tabla-wrapper card">
          <table>
            <thead>
              <tr><th>Usuario</th><th>Rol</th><th>Empleado vinculado</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong></td>
                  <td>
                    <span style={{ background: ROL_BADGE[u.rol] + '22', color: ROL_BADGE[u.rol], padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat', textTransform: 'uppercase' }}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.nombre ? `${u.nombre} ${u.apellido_paterno}` : '—'}</td>
                  <td>
                    <span style={{ background: u.activo ? '#D4EDDA' : '#F8D7DA', color: u.activo ? '#155724' : '#721C24', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat' }}>
                      {u.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gris-texto)' }}>
                    {new Date(u.created_at).toLocaleDateString('es-MX')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={`btn-institucional btn-sm ${u.activo ? 'peligro' : 'dorado'}`}
                        onClick={() => toggleActivo(u.id, u.activo)}
                      >
                        {u.activo ? '🔒 Desactivar' : '🔓 Activar'}
                      </button>
                      <button className="btn-institucional peligro btn-sm" onClick={() => eliminar(u.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                  <option value="empleado">Empleado</option>
                  <option value="rrhh">RRHH</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Vincular con empleado (opcional)</label>
                <select className="form-control" value={form.empleado_id} onChange={e => setForm({ ...form, empleado_id: e.target.value })}>
                  <option value="">— Sin vincular —</option>
                  {empleados.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} {e.apellido_paterno}</option>
                  ))}
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
  );
}
