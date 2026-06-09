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
    const matchBusqueda = nombre.includes(busqueda.toLowerCase()) ||
      (e.numero_empleado || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchDepto = !filtroDepto || e.departamento === filtroDepto;
    return matchBusqueda && matchDepto;
  });

  if (cargando) return (
    <div className="loader-wrapper">
      <div className="loader" />
      <p style={{ color: 'var(--gris-texto)', fontFamily: 'Montserrat', fontWeight: 600 }}>Cargando personal...</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Personal SITT</h2>
        <span style={{ fontFamily: 'Montserrat', fontSize: 13, color: 'var(--gris-texto)', fontWeight: 600 }}>
          {filtrados.length} empleado{filtrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="input__container" style={{ marginTop: 16 }}>
          <button className="input__button__shadow" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <input
            className="input__search"
            placeholder="Nombre o número..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div className="shadow__input" />
        </div>

        <div className="form-group" style={{ minWidth: 180 }}>
          <label style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 12, color: 'var(--guinda)', textTransform: 'uppercase' }}>
            Departamento
          </label>
          <select
            className="form-control"
            value={filtroDepto}
            onChange={e => setFiltroDepto(e.target.value)}
          >
            <option value="">Todos</option>
            {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gris-texto)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 16 }}>No se encontraron empleados</p>
        </div>
      ) : (
        <div className="grid-empleados">
          {filtrados.map(emp => (
            <TarjetaEmpleado
              key={emp.id}
              empleado={emp}
              onVerPerfil={() => setSeleccionado(emp.id)}
            />
          ))}
        </div>
      )}

      {seleccionado && (
        <PerfilModal
          empleadoId={seleccionado}
          onClose={() => setSeleccionado(null)}
          onActualizar={() => {
            api.get('/api/empleados').then(r => setEmpleados(r.data));
          }}
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
        {/* Frente */}
        <div className="empleado-card-front">
          {empleado.foto_url
            ? <img src={empleado.foto_url} alt={nombre} loading="lazy" />
            : <div className="avatar-placeholder">👤</div>
          }
          <div className="nombre-overlay">
            <h3>{nombre}</h3>
            <p>{empleado.puesto || empleado.departamento || 'Sin puesto'}</p>
          </div>
        </div>

        {/* Reverso */}
        <div className="empleado-card-back">
          <div className="dias-badge">{diasDisp}</div>
          <p>días disponibles</p>
          <p style={{ fontSize: 10, opacity: 0.7 }}>{diasTom} tomados este año</p>
          {empleado.numero_empleado && (
            <p style={{ fontSize: 10, opacity: 0.6 }}>#{empleado.numero_empleado}</p>
          )}
          <div className="ver-perfil">Ver Perfil →</div>
        </div>
      </div>
    </div>
  );
}
