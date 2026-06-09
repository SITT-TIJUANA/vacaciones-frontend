import { useState, useEffect } from 'react';
import api from '../services/api';
import PerfilModal from './PerfilModal';

export default function Tablero() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    api.get('/api/empleados')
      .then(r => setEmpleados(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const departamentos = [...new Set(empleados.map(e => e.departamento).filter(Boolean))];
  const filtrados = empleados.filter(e => {
    const nombre = `${e.nombre} ${e.apellido_paterno} ${e.apellido_materno || ''}`.toLowerCase();
    const matchBusqueda = nombre.includes(busqueda.toLowerCase()) || (e.numero_empleado || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchDepto = !filtroDepto || e.departamento === filtroDepto;
    return matchBusqueda && matchDepto;
  });

  if (cargando) return (
    <div className="loader-wrapper">
      <div className="loader" />
      <p style={{ color: 'var(--gris-60)', fontFamily: 'Montserrat', fontWeight: 600, fontSize: 13 }}>Cargando personal SITT...</p>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Hero header */}
      <div style={{ marginBottom: 36 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">Personal SITT</h2>
            <p style={{ color: 'var(--gris-60)', fontSize: 14, marginTop: 6, fontFamily: 'Inter' }}>
              {filtrados.length} empleado{filtrados.length !== 1 ? 's' : ''} · Hover sobre una tarjeta para ver sus días
            </p>
          </div>
          <span style={{ background: 'var(--guinda-soft)', color: 'var(--guinda)', padding: '8px 18px', borderRadius: 30, fontFamily: 'Montserrat', fontWeight: 800, fontSize: 13, border: '1px solid rgba(107,15,43,0.15)' }}>
            {new Date().getFullYear()}
          </span>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 8 }}>
          <div className="input__container" style={{ marginTop: 18 }}>
            <button className="input__button__shadow" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <input className="input__search" placeholder="Nombre o número..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <div className="shadow__input" />
          </div>
          <div className="form-group" style={{ minWidth: 180 }}>
            <label>Departamento</label>
            <select className="form-control" value={filtroDepto} onChange={e => setFiltroDepto(e.target.value)}>
              <option value="">Todos</option>
              {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid tarjetas */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--gris-60)' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }} className="float-anim">🔍</div>
          <p style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 18, color: 'var(--guinda)' }}>Sin resultados</p>
          <p style={{ marginTop: 8, fontSize: 14 }}>No se encontraron empleados con esos filtros</p>
        </div>
      ) : (
        <div className="grid-empleados">
          {filtrados.map((emp, i) => (
            <div key={emp.id} style={{ animation: `slideUp 0.4s var(--ease) ${i * 0.05}s both` }}>
              <TarjetaEmpleado empleado={emp} onVerPerfil={() => setSeleccionado(emp.id)} />
            </div>
          ))}
        </div>
      )}

      {seleccionado && (
        <PerfilModal
          empleadoId={seleccionado}
          onClose={() => setSeleccionado(null)}
          onActualizar={() => api.get('/api/empleados').then(r => setEmpleados(r.data))}
        />
      )}
    </div>
  );
}

function TarjetaEmpleado({ empleado, onVerPerfil }) {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno}`;
  const diasDisp = empleado.dias_disponibles ?? 0;
  const diasTom  = empleado.dias_tomados ?? 0;

  return (
    <div className="empleado-card" onClick={onVerPerfil} title={`Ver perfil de ${nombre}`}>
      <div className="empleado-card-inner">
        <div className="empleado-card-front">
          {empleado.foto_url
            ? <img src={empleado.foto_url} alt={nombre} loading="lazy" />
            : <div className="avatar-placeholder">👤</div>
          }
          <div className="nombre-overlay">
            <h3>{nombre}</h3>
            <p>{empleado.puesto || empleado.departamento || 'SITT Tijuana'}</p>
          </div>
        </div>
        <div className="empleado-card-back">
          <div className="dias-badge">{diasDisp}</div>
          <p>días disponibles</p>
          <p style={{ fontSize: 10, opacity: 0.65 }}>{diasTom} usados este año</p>
          {empleado.numero_empleado && (
            <p style={{ fontSize: 10, opacity: 0.55 }}>#{empleado.numero_empleado}</p>
          )}
          <div className="ver-perfil">Ver Perfil →</div>
        </div>
      </div>
    </div>
  );
}
