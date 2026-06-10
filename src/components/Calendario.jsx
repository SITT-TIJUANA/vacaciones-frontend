import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}

export default function Calendario() {
  const { usuario, rolEfectivo } = useAuth();
  const esEmpleado = rolEfectivo === 'empleado';
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    setCargando(true);
    api.get(`/api/calendario?mes=${mes}&anio=${anio}`)
      .then(r => {
        const data = esEmpleado && usuario?.empleado_id
          ? r.data.filter(e => e.empleado_id === usuario.empleado_id)
          : r.data;
        setEventos(data);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [mes, anio, esEmpleado]);

  const cambiarMes = (delta) => {
    let m = mes + delta, a = anio;
    if (m > 12) { m = 1; a++; }
    if (m < 1)  { m = 12; a--; }
    setMes(m); setAnio(a);
  };

  const primerDia = new Date(anio, mes - 1, 1).getDay();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const celdas = Array(primerDia).fill(null).concat(Array.from({ length: diasEnMes }, (_, i) => i + 1));
  while (celdas.length % 7 !== 0) celdas.push(null);

  const getEventosDia = (dia) => {
    if (!dia) return [];
    const fecha = new Date(anio, mes - 1, dia);
    return eventos.filter(e => {
      const ini = new Date(e.fecha_inicio); ini.setHours(0,0,0,0);
      const fin = new Date(e.fecha_fin); fin.setHours(23,59,59,999);
      return fecha >= ini && fecha <= fin;
    });
  };

  const esHoy = (dia) => dia === hoy.getDate() && mes === hoy.getMonth()+1 && anio === hoy.getFullYear();

  const estaDeVacaciones = (ev) => {
    const ini = new Date(ev.fecha_inicio); ini.setHours(0,0,0,0);
    const fin = new Date(ev.fecha_fin); fin.setHours(23,59,59,999);
    return hoy >= ini && hoy <= fin;
  };

  const getIniciales = (n, a) => `${(n||'?')[0]}${(a||'?')[0]}`.toUpperCase();

  const activosEsteMes = eventos.filter(e => estaDeVacaciones(e));
  const proximosEsteMes = eventos.filter(e => !estaDeVacaciones(e));

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Calendario de Vacaciones</h2>
      </div>

      {/* Cards resumen arriba */}
      {eventos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
          {activosEsteMes.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#155724,#27ae60)', borderRadius:16, padding:'16px 20px', color:'#fff', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:36 }}>🏖️</div>
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:32, lineHeight:1 }}>{activosEsteMes.length}</div>
                <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:.85, marginTop:2 }}>De vacaciones hoy</div>
              </div>
            </div>
          )}
          {proximosEsteMes.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#856404,#C9A84C)', borderRadius:16, padding:'16px 20px', color:'#fff', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:36 }}>✈️</div>
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:32, lineHeight:1 }}>{proximosEsteMes.length}</div>
                <div style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, opacity:.85, marginTop:2 }}>Próximas vacaciones</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom:24, padding:'24px 24px 20px' }}>
        {/* Nav mes */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <button className="btn-institucional btn-sm" onClick={() => cambiarMes(-1)}>← Anterior</button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:32, color:'var(--g)', lineHeight:1 }}>{MESES[mes-1]}</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, color:'var(--g60)', marginTop:2 }}>{anio}</div>
          </div>
          <button className="btn-institucional btn-sm" onClick={() => cambiarMes(1)}>Siguiente →</button>
        </div>

        {/* Leyenda */}
        <div style={{ display:'flex', gap:20, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          {[
            { color:'#27ae60', bg:'rgba(39,174,96,0.1)', icon:'🏖️', label:'De vacaciones hoy' },
            { color:'#C9A84C', bg:'rgba(201,168,76,0.1)', icon:'✈️', label:'Próximo' },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:l.bg, border:`2px solid ${l.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{l.icon}</div>
              <span style={{ fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {cargando ? (
          <div className="loader-wrapper" style={{ minHeight:200 }}><div className="loader" /></div>
        ) : (
          <>
            {/* Headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
              {DIAS_SEMANA.map(d => (
                <div key={d} style={{ textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'var(--g)', padding:'8px 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas */}
            <div className="cal-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {celdas.map((dia, i) => {
                const evsDia = getEventosDia(dia);
                const esHoyDia = dia && esHoy(dia);
                const tieneActivos = evsDia.some(e => estaDeVacaciones(e));
                const tieneProximos = evsDia.some(e => !estaDeVacaciones(e));

                return (
                  <div key={i}
                    className="cal-celda"
                    onClick={() => dia && evsDia.length > 0 && setSeleccionado({ dia, eventos: evsDia })}
                    style={{
                      minHeight: 90,
                      borderRadius: 12,
                      padding: '6px 5px 5px',
                      background: !dia ? 'transparent'
                        : tieneActivos ? 'rgba(39,174,96,0.08)'
                        : tieneProximos ? 'rgba(201,168,76,0.08)'
                        : esHoyDia ? 'rgba(107,15,43,0.05)'
                        : 'var(--w-off)',
                      border: !dia ? 'none'
                        : tieneActivos ? '2px solid rgba(39,174,96,0.35)'
                        : tieneProximos ? '2px solid rgba(201,168,76,0.35)'
                        : esHoyDia ? '2px solid var(--g)'
                        : '1px solid var(--g20)',
                      cursor: evsDia.length > 0 ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    {dia && (
                      <>
                        {/* Número día */}
                        <div style={{ marginBottom:4, display:'flex', justifyContent:'center' }}>
                          {esHoyDia ? (
                            <span style={{ background:'var(--g)', color:'#fff', width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, fontFamily:'Montserrat,sans-serif' }}>{dia}</span>
                          ) : (
                            <span style={{ fontSize:12, fontWeight: evsDia.length?800:600, color: tieneActivos?'#155724':tieneProximos?'#856404':'var(--txt)', fontFamily:'Montserrat,sans-serif' }}>{dia}</span>
                          )}
                        </div>

                        {/* Fotos */}
                        <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'center' }}>
                          {evsDia.slice(0,2).map((ev, j) => {
                            const activo = estaDeVacaciones(ev);
                            return (
                              <div key={j} style={{ display:'flex', alignItems:'center', gap:3, width:'100%', justifyContent:'center' }}>
                                <div style={{ position:'relative' }}>
                                  {ev.foto_url ? (
                                    <img src={ev.foto_url} alt=""
                                      className={activo ? 'cal-foto-activo' : 'cal-foto-proximo'}
                                      style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`2px solid ${activo?'#27ae60':'#C9A84C'}`, display:'block' }} />
                                  ) : (
                                    <div
                                      className={activo ? 'cal-foto-activo' : 'cal-foto-proximo'}
                                      style={{ width:28, height:28, borderRadius:'50%', background:activo?'#27ae60':'#C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff', fontFamily:'Montserrat,sans-serif' }}>
                                      {getIniciales(ev.nombre, ev.apellido_paterno)}
                                    </div>
                                  )}
                                  <div style={{ position:'absolute', bottom:-2, right:-2, width:12, height:12, borderRadius:'50%', background:activo?'#27ae60':'#C9A84C', border:'1.5px solid white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:7 }}>
                                    {activo?'🏖️':'✈️'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {evsDia.length > 2 && (
                            <div style={{ fontSize:9, color:'var(--g)', fontFamily:'Montserrat,sans-serif', fontWeight:800, background:'var(--g-soft)', borderRadius:10, padding:'1px 5px' }}>
                              +{evsDia.length-2}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Lista vacaciones del mes */}
      {eventos.length > 0 && (
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, color:'var(--g)', marginBottom:16 }}>
            Vacaciones en {MESES[mes-1]} {anio}
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {eventos.map(ev => {
              const activo = estaDeVacaciones(ev);
              return (
                <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', borderRadius:16,
                  background: activo ? 'rgba(39,174,96,0.06)' : 'rgba(201,168,76,0.06)',
                  border:`2px solid ${activo?'rgba(39,174,96,0.3)':'rgba(201,168,76,0.3)'}` }}>
                  {/* Foto grande */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    {ev.foto_url ? (
                      <img src={ev.foto_url} alt=""
                        className={activo ? 'cal-foto-activo' : 'cal-foto-proximo'}
                        style={{ width:68, height:68, borderRadius:'50%', objectFit:'cover', border:`3px solid ${activo?'#27ae60':'#C9A84C'}` }} />
                    ) : (
                      <div className={activo ? 'cal-foto-activo' : 'cal-foto-proximo'}
                        style={{ width:68, height:68, borderRadius:'50%', background:activo?'rgba(39,174,96,0.2)':'rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:activo?'#155724':'#856404', border:`3px solid ${activo?'#27ae60':'#C9A84C'}`, fontFamily:'Montserrat,sans-serif' }}>
                        {getIniciales(ev.nombre, ev.apellido_paterno)}
                      </div>
                    )}
                    <div style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:activo?'#27ae60':'#C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, border:'2px solid white' }}>
                      {activo?'🏖️':'✈️'}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:18, color:'var(--g)' }}>
                      {ev.nombre} {ev.apellido_paterno}
                    </div>
                    <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{ev.departamento||'—'}</div>
                    <div style={{ fontSize:13, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', marginTop:6 }}>
                      📅 {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)}
                    </div>
                  </div>

                  {/* Días + badge */}
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:36, color:activo?'#27ae60':'#C9A84C', lineHeight:1 }}>{ev.dias_solicitados}</div>
                    <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)', textTransform:'uppercase', marginTop:2 }}>días</div>
                    <div style={{ marginTop:8, padding:'5px 12px', borderRadius:20, fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800,
                      background:activo?'#D4EDDA':'#FFF3CD', color:activo?'#155724':'#856404', border:`1px solid ${activo?'#C3E6CB':'#FFEEBA'}` }}>
                      {activo ? '🏖️ Ahora' : '✈️ Próximo'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal detalle día */}
      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 {seleccionado.dia} de {MESES[mes-1]} {anio}</h2>
              <button className="modal-close" onClick={() => setSeleccionado(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {seleccionado.eventos.map(ev => {
                const activo = estaDeVacaciones(ev);
                return (
                  <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', borderRadius:14,
                    background:activo?'rgba(39,174,96,0.07)':'var(--g-soft)',
                    border:`1.5px solid ${activo?'#27ae60':'rgba(107,15,43,0.15)'}` }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      {ev.foto_url ? (
                        <img src={ev.foto_url} alt="" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:`3px solid ${activo?'#27ae60':'var(--d)'}` }} />
                      ) : (
                        <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--g20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, fontFamily:'Montserrat,sans-serif', color:'var(--g)' }}>
                          {getIniciales(ev.nombre, ev.apellido_paterno)}
                        </div>
                      )}
                      <div style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:activo?'#27ae60':'#C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, border:'2px solid white' }}>
                        {activo?'🏖️':'✈️'}
                      </div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:19, color:'var(--g)' }}>
                        {ev.nombre} {ev.apellido_paterno}
                      </div>
                      <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{ev.departamento||'—'}</div>
                      <div style={{ fontSize:12, marginTop:6, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>
                        {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)}
                      </div>
                      <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
                        background:activo?'#D4EDDA':'#FFF3CD', color:activo?'#155724':'#856404', fontSize:12, fontWeight:800, fontFamily:'Montserrat,sans-serif' }}>
                        {activo ? '🏖️ De Vacaciones ahora' : '✈️ Próximamente'} · {ev.dias_solicitados} días
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
