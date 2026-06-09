import { useState, useRef } from 'react';
import api from '../services/api';

export default function AltaPersonal({ onCreado }) {
  const [form, setForm] = useState({
    nombre: '', apellido_paterno: '', apellido_materno: '',
    numero_empleado: '', puesto: '', departamento: '',
    fecha_ingreso: '', email: '', telefono: '',
    dias_vacaciones: '6', username: '', password: '',
  });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const fileRef = useRef();

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

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (foto) fd.append('foto', foto);

    try {
      await api.post('/api/empleados', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setExito(true);
      setTimeout(() => {
        setExito(false);
        setForm({ nombre:'',apellido_paterno:'',apellido_materno:'',numero_empleado:'',puesto:'',departamento:'',fecha_ingreso:'',email:'',telefono:'',dias_vacaciones:'6',username:'',password:'' });
        setFoto(null); setPreview(null);
        onCreado?.();
      }, 2000);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al registrar empleado');
    } finally {
      setEnviando(false);
    }
  };

  if (exito) return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div style={{ fontSize: 72 }}>🎉</div>
      <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: 'var(--guinda)', fontSize: 24 }}>¡Empleado registrado!</h2>
      <p style={{ color: 'var(--gris-texto)' }}>El personal ha sido dado de alta correctamente.</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Alta de Personal</h2>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        {error && (
          <div style={{ background: '#FFF3CD', border: '1px solid #FFEEBA', borderLeft: '4px solid #856404', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#856404', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Datos personales */}
            <div>
              <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--guinda)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid var(--guinda-soft)' }}>
                👤 Datos Personales
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input className="form-control" placeholder="Nombre(s)" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Apellido Paterno *</label>
                  <input className="form-control" placeholder="Apellido paterno" value={form.apellido_paterno} onChange={e => setForm({ ...form, apellido_paterno: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Apellido Materno</label>
                  <input className="form-control" placeholder="Apellido materno" value={form.apellido_materno} onChange={e => setForm({ ...form, apellido_materno: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Número de Empleado</label>
                  <input className="form-control" placeholder="Ej: TJ-0042" value={form.numero_empleado} onChange={e => setForm({ ...form, numero_empleado: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Datos laborales */}
            <div>
              <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--guinda)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid var(--guinda-soft)' }}>
                🏢 Datos Laborales
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Puesto</label>
                  <input className="form-control" placeholder="Ej: Operador de Transporte" value={form.puesto} onChange={e => setForm({ ...form, puesto: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Departamento</label>
                  <input className="form-control" placeholder="Ej: Operaciones" value={form.departamento} onChange={e => setForm({ ...form, departamento: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Fecha de Ingreso *</label>
                  <input type="date" className="form-control" value={form.fecha_ingreso} onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Días de Vacaciones {new Date().getFullYear()}</label>
                  <input type="number" className="form-control" min="1" max="30" value={form.dias_vacaciones} onChange={e => setForm({ ...form, dias_vacaciones: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--guinda)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid var(--guinda-soft)' }}>
                📞 Contacto
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input type="email" className="form-control" placeholder="correo@ejemplo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input className="form-control" placeholder="664-000-0000" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Acceso al sistema */}
            <div>
              <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: 'var(--guinda)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, paddingBottom: 8, borderBottom: '2px solid var(--guinda-soft)' }}>
                🔐 Acceso al Sistema <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7, textTransform: 'none' }}>(opcional)</span>
              </h3>
              <p style={{ fontSize: 12, color: 'var(--gris-texto)', marginBottom: 14 }}>Si se proporcionan, el empleado podrá iniciar sesión y solicitar vacaciones.</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Usuario</label>
                  <input className="form-control" placeholder="usuario.apellido" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Contraseña temporal</label>
                  <input type="password" className="form-control" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Columna foto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div
              className="upload-foto"
              style={{ width: '100%' }}
              onClick={() => fileRef.current.click()}
            >
              {preview ? (
                <img src={preview} alt="preview" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: '50%', border: '4px solid var(--dorado)' }} />
              ) : (
                <>
                  <div style={{ fontSize: 48 }}>📷</div>
                  <p>Subir foto</p>
                  <p style={{ fontSize: 11, opacity: 0.7 }}>JPG, PNG, WEBP<br/>máx. 5MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
            {preview && (
              <button className="btn-institucional peligro btn-sm" onClick={() => { setFoto(null); setPreview(null); }}>
                🗑️ Quitar foto
              </button>
            )}
          </div>
        </div>

        {/* Botón guardar */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--gris-medio)', paddingTop: 20 }}>
          <button
            className="btn-institucional filled btn-lg"
            onClick={handleSubmit}
            disabled={enviando}
          >
            {enviando ? '⏳ Guardando...' : '💾 Dar de Alta'}
          </button>
        </div>
      </div>
    </div>
  );
}
