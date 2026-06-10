import { useState, useEffect } from 'react';
import api from '../services/api';
import PerfilModal from './PerfilModal';
import { useAuth } from '../context/AuthContext';

export default function Tablero({ onVerPeriodos }) {
  const { rolEfectivo } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [modalBaja, setModalBaja] = useState(null);
  const [formBaja, setFormBaja] = useState({ motivo_baja:'', notas_baja:'' });
  const [enviando, setEnviando] = useState(false);

  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);

  const cargar = () => {
    setCargando(true);
    api.get('/api/empleados').then(r => setEmpleados(r.data)).catch(console.error).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const departamentos = [...new Set(empleados.map(e => e.departamento).filter(Boolean))];
  const filtrados = empleados.filter(e => {
    const nombre = `${e.nombre} ${e.apellido_paterno} ${e.apellido_materno||''}`.toLowerCase();
    return nombre.includes(busqueda.toLowerCase()) || (e.numero_empleado||'').toLowerCase().includes(busqueda.toLowerCase())
      && (!filtroDepto || e.departamento === filtroDepto);
  }).filter(e => !filtroDepto || e.departamento === filtroDepto);

  const darDeBaja = async () => {
    if (!modalBaja) return;
    setEnviando(true);
    try {
      await api.post(`/api/bajas/${modalBaja.id}`, formBaja);
      cargar();
      setModalBaja(null);
      setFormBaja({ motivo_baja:'', notas_baja:'' });
    } catch(e) { alert(e.response?.data?.error || 'Error al dar de baja'); }
    finally { setEnviando(false); }
  };

  if (cargando) return (
    <div className="loader-wrapper">
      <div className="loader" />
      <p style={{ color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:13 }}>Cargando personal SITT...</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom:36 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">Personal SITT</h2>
            <p style={{ color:'var(--g60)', fontSize:14, marginTop:6 }}>
              {filtrados.length} empleado{filtrados.length!==1?'s':''} · Hover para ver días disponibles
            </p>
          </div>
          <span style={{ background:'var(--g-soft)', color:'var(--g)', padding:'8px 18px', borderRadius:30, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, border:'1px solid rgba(107,15,43,0.15)' }}>
            {new Date().getFullYear()}
          </span>
        </div>

        <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-end', marginTop:8 }}>
          <div className="input__container" style={{ marginTop:18 }}>
            <button className="input__button__shadow" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <input className="input__search" placeholder="Nombre o número..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          </div>
          <div className="form-group" style={{ minWidth:180 }}>
            <label>Departamento</label>
            <select className="form-control" value={filtroDepto} onChange={e=>setFiltroDepto(e.target.value)}>
              <option value="">Todos</option>
              {departamentos.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--g60)' }}>
          <div style={{ fontSize:64, marginBottom:20 }} className="float-anim">🔍</div>
          <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:20, color:'var(--g)' }}>Sin resultados</p>
        </div>
      ) : (
        <div className="grid-empleados">
          {filtrados.map((emp, i) => (
            <div key={emp.id} style={{ animation:`slideUp 0.4s var(--ease) ${i*0.05}s both`, position:'relative' }}>
              {/* Botón dar de baja */}
              {esAdmin && (
                <button
                  onClick={e => { e.stopPropagation(); setModalBaja(emp); }}
                  title="Dar de baja"
                  style={{ position:'absolute', top:6, right:6, zIndex:10, background:'rgba(183,28,28,0.85)', border:'none', color:'#fff', width:26, height:26, borderRadius:'50%', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', backdropFilter:'blur(4px)' }}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.15)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                >
                  🚫
                </button>
              )}
              <TarjetaEmpleado empleado={emp} onVerPerfil={() => setSeleccionado(emp.id)} />
            </div>
          ))}
        </div>
      )}

      {seleccionado && (
        <PerfilModal empleadoId={seleccionado} onClose={() => setSeleccionado(null)} onActualizar={cargar} onVerPeriodos={onVerPeriodos} />
      )}

      {/* Modal dar de baja */}
      {modalBaja && (
        <div className="modal-overlay" onClick={() => setModalBaja(null)}>
          <div className="modal" style={{ maxWidth:480 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header" style={{ background:'linear-gradient(135deg,#7F0000,#B71C1C)' }}>
              <h2>🚫 Dar de Baja</h2>
              <button className="modal-close" onClick={() => setModalBaja(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:'rgba(183,28,28,0.06)', borderRadius:12, border:'1px solid rgba(183,28,28,0.15)' }}>
                {modalBaja.foto_url
                  ? <img src={modalBaja.foto_url} alt="" style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:'3px solid #E53935' }} />
                  : <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>👤</div>
                }
                <div>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:16, color:'var(--g)' }}>{modalBaja.nombre} {modalBaja.apellido_paterno}</div>
                  <div style={{ fontSize:12, color:'var(--g60)' }}>{modalBaja.puesto || '—'}</div>
                </div>
              </div>
              <div className="form-group">
                <label>Motivo de baja</label>
                <select className="form-control" value={formBaja.motivo_baja} onChange={e=>setFormBaja({...formBaja,motivo_baja:e.target.value})}>
                  <option value="">Seleccionar motivo...</option>
                  <option value="Renuncia voluntaria">Renuncia voluntaria</option>
                  <option value="Término de contrato">Término de contrato</option>
                  <option value="Jubilación">Jubilación</option>
                  <option value="Despido">Despido</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notas adicionales</label>
                <textarea className="form-control" rows={3} placeholder="Información relevante sobre la baja..." value={formBaja.notas_baja} onChange={e=>setFormBaja({...formBaja,notas_baja:e.target.value})} />
              </div>
              <div style={{ padding:'10px 14px', background:'rgba(230,81,0,0.08)', borderRadius:10, border:'1px solid rgba(230,81,0,0.2)', fontSize:13, color:'#BF360C', fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>
                ⚠️ El empleado dejará de aparecer en el tablero. Los días adeudados quedarán registrados en la sección de Bajas.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => setModalBaja(null)}>Cancelar</button>
              <button className="btn-institucional peligro btn-sm" onClick={darDeBaja} disabled={enviando}>
                {enviando ? '⏳...' : '🚫 Confirmar Baja'}
              </button>
            </div>
          </div>
        </div>
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
          {empleado.foto_url ? <img src={empleado.foto_url} alt={nombre} loading="lazy" /> : <div className="avatar-placeholder">👤</div>}
          <div className="nombre-overlay">
            <h3>{nombre}</h3>
            <p>{empleado.puesto || empleado.departamento || 'SITT Tijuana'}</p>
          </div>
        </div>
        <div className="empleado-card-back">
          <div className="dias-badge">{diasDisp}</div>
          <p>días disponibles</p>
          <p style={{ fontSize:10, opacity:.65 }}>{diasTom} usados este año</p>
          {empleado.numero_empleado && <p style={{ fontSize:10, opacity:.55 }}>#{empleado.numero_empleado}</p>}
          <div className="ver-perfil">Ver Perfil →</div>
        </div>
      </div>
    </div>
  );
}
