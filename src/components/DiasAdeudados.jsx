import { useState, useEffect } from 'react';
import api from '../services/api';

export default function DiasAdeudados() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    api.get('/api/reportes/dias-adeudados')
      .then(r => setDatos(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const filtrados = datos.filter(e => {
    if (!busqueda) return true;
    return `${e.apellido_paterno} ${e.nombre}`.toLowerCase().includes(busqueda.toLowerCase());
  });

  const totalDias = datos.reduce((s, e) => s + parseInt(e.dias_adeudados || 0), 0);

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Días Adeudados</h2>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <input className="form-control" style={{ width:240 }} placeholder="🔍 Buscar empleado..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
        </div>
      </div>

      {/* KPI total */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        <div className="card kpi-card" data-icon="📅" style={{ borderLeftColor:'#E65100' }}>
          <div style={{ fontSize:24 }}>📅</div>
          <div className="kpi-value" style={{ color:'#E65100' }}>{totalDias}</div>
          <div className="kpi-label">Total días adeudados</div>
        </div>
        <div className="card kpi-card" data-icon="👥">
          <div style={{ fontSize:24 }}>👥</div>
          <div className="kpi-value">{datos.length}</div>
          <div className="kpi-label">Empleados con días pendientes</div>
        </div>
        <div className="card kpi-card dorado" data-icon="⭐">
          <div style={{ fontSize:24 }}>⭐</div>
          <div className="kpi-value">{datos.length > 0 ? Math.max(...datos.map(e => parseInt(e.dias_adeudados))) : 0}</div>
          <div className="kpi-label">Máximo días de una persona</div>
        </div>
        <div className="card kpi-card verde" data-icon="📊">
          <div style={{ fontSize:24 }}>📊</div>
          <div className="kpi-value">{datos.length > 0 ? Math.round(totalDias / datos.length) : 0}</div>
          <div className="kpi-label">Promedio días por empleado</div>
        </div>
      </div>

      {cargando ? (
        <div className="loader-wrapper"><div className="loader" /></div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:64, marginBottom:16 }} className="float-anim">{busqueda ? '🔍' : '🎉'}</div>
          <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:22, color:'var(--g)' }}>
            {busqueda ? 'Sin resultados' : '¡Sin deudas pendientes!'}
          </p>
          <p style={{ color:'var(--g60)', marginTop:8 }}>
            {busqueda ? `No se encontró "${busqueda}"` : 'Todos los empleados tienen sus vacaciones al día'}
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtrados.map((emp, i) => {
            const pct = emp.dias_correspondientes > 0
              ? Math.round((parseInt(emp.dias_adeudados) / emp.dias_correspondientes) * 100)
              : 0;
            const urgente = parseInt(emp.dias_adeudados) >= 15;
            return (
              <div key={emp.id} className="card" style={{ padding:'20px 24px', borderLeft: `4px solid ${urgente?'#E53935':'#E65100'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
                  {emp.foto_url
                    ? <img src={emp.foto_url} alt="" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:`3px solid ${urgente?'#E53935':'#E65100'}`, flexShrink:0 }} />
                    : <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>👤</div>
                  }

                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:17, color:'var(--g)' }}>
                      {emp.apellido_paterno} {emp.nombre}
                    </div>
                    <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{emp.puesto || '—'} · {emp.departamento || '—'}</div>
                    <div style={{ marginTop:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>
                        <span>Días acumulados sin tomar</span>
                        <span style={{ color: urgente?'#B71C1C':'#E65100' }}>{emp.dias_adeudados} días</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill danger" style={{ width:`${Math.min(pct,100)}%`, background: urgente?'linear-gradient(90deg,#B71C1C,#E53935)':'linear-gradient(90deg,#E65100,#FF8F00)' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:48, lineHeight:1, color: urgente?'#B71C1C':'#E65100' }}>
                      {emp.dias_adeudados}
                    </div>
                    <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', textTransform:'uppercase', letterSpacing:'0.5px' }}>días pendientes</div>
                    {urgente && (
                      <div style={{ marginTop:6, padding:'3px 10px', background:'rgba(183,28,28,0.1)', border:'1px solid rgba(183,28,28,0.3)', borderRadius:20, fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'#B71C1C' }}>
                        ⚠️ URGENTE
                      </div>
                    )}
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
