import { useState, useEffect } from 'react';
import api from '../services/api';

const ICONOS_ACCION = {
  alta_empleado:      { icon:'➕', color:'#1B5E20', bg:'#E8F5E9', label:'Alta de empleado' },
  baja_empleado:      { icon:'🚫', color:'#B71C1C', bg:'#FFEBEE', label:'Baja de empleado' },
  reactivar_empleado: { icon:'🔄', color:'#E65100', bg:'#FFF3E0', label:'Reactivación' },
  vacaciones_manual:  { icon:'📅', color:'#1565C0', bg:'#E3F2FD', label:'Vacaciones manual' },
  aprobar_solicitud:  { icon:'✅', color:'#1B5E20', bg:'#E8F5E9', label:'Solicitud aprobada' },
  rechazar_solicitud: { icon:'❌', color:'#B71C1C', bg:'#FFEBEE', label:'Solicitud rechazada' },
  editar_periodo:     { icon:'✏️', color:'#6B0F2B', bg:'#FCE4EC', label:'Edición de periodo' },
  editar_empleado:    { icon:'👤', color:'#4A148C', bg:'#F3E5F5', label:'Edición de empleado' },
  vincular_cuenta:    { icon:'🔗', color:'#006064', bg:'#E0F7FA', label:'Cuenta vinculada' },
  login:              { icon:'🔑', color:'#37474F', bg:'#ECEFF1', label:'Inicio de sesión' },
};

const getAccion = (accion) => ICONOS_ACCION[accion] || { icon:'📋', color:'var(--g)', bg:'var(--g-soft)', label: accion };

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

export default function Historial() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');

  useEffect(() => {
    api.get('/api/historial')
      .then(r => setRegistros(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const filtrados = registros.filter(r => {
    const texto = `${r.usuario_nombre || ''} ${r.empleado_nombre || ''} ${r.empleado_apellido || ''} ${r.detalle || ''}`.toLowerCase();
    const matchBusq = !busqueda || texto.includes(busqueda.toLowerCase());
    const matchAccion = !filtroAccion || r.accion === filtroAccion;
    return matchBusq && matchAccion;
  });

  const accionesUnicas = [...new Set(registros.map(r => r.accion))];

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Historial de Actividad</h2>
        <span style={{ background:'var(--g-soft)', color:'var(--g)', padding:'8px 18px', borderRadius:30, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, border:'1px solid rgba(107,15,43,0.15)' }}>
          {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom:24, padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div className="form-group" style={{ flex:1, minWidth:180 }}>
            <label>Buscar</label>
            <input className="form-control" placeholder="Usuario, empleado, detalle..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          </div>
          <div className="form-group" style={{ minWidth:200 }}>
            <label>Tipo de acción</label>
            <select className="form-control" value={filtroAccion} onChange={e=>setFiltroAccion(e.target.value)}>
              <option value="">Todas las acciones</option>
              {accionesUnicas.map(a => <option key={a} value={a}>{getAccion(a).label}</option>)}
            </select>
          </div>
          {(busqueda || filtroAccion) && (
            <button className="btn-institucional btn-sm" onClick={() => { setBusqueda(''); setFiltroAccion(''); }}>✕ Limpiar</button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="loader-wrapper"><div className="loader" /></div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:64, marginBottom:16 }} className="float-anim">📋</div>
          <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:22, color:'var(--g)' }}>
            {busqueda || filtroAccion ? 'Sin resultados' : 'Sin actividad registrada'}
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtrados.map((r, i) => {
            const a = getAccion(r.accion);
            return (
              <div key={r.id || i} className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                {/* Icono acción */}
                <div style={{ width:44, height:44, borderRadius:12, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, border:`1px solid ${a.color}22` }}>
                  {a.icon}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:a.color }}>{a.label}</span>
                    <span style={{ background:a.bg, color:a.color, padding:'2px 10px', borderRadius:20, fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, border:`1px solid ${a.color}33` }}>
                      {r.accion}
                    </span>
                  </div>
                  {r.detalle && (
                    <div style={{ fontSize:13, color:'var(--g60)', marginTop:4, lineHeight:1.5 }}>{r.detalle}</div>
                  )}
                  <div style={{ display:'flex', gap:12, marginTop:5, flexWrap:'wrap' }}>
                    {r.usuario_nombre && (
                      <span style={{ fontSize:11, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>
                        👤 {r.usuario_nombre}
                      </span>
                    )}
                    {(r.empleado_nombre || r.empleado_apellido) && (
                      <span style={{ fontSize:11, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>
                        🏢 {r.empleado_nombre} {r.empleado_apellido}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fecha */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>
                    {fmtFecha(r.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
