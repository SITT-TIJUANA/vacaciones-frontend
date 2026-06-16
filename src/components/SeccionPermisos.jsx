import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = String(f).substring(0,10).split('-');
  return new Date(parseInt(y),parseInt(m)-1,parseInt(d)).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
}

export default function SeccionPermisos() {
  const { usuario, rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(null);
  const [verFoto, setVerFoto] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const inputRef = useRef({});

  const cargar = () => {
    setCargando(true);
    const url = esAdmin ? '/api/permisos' : `/api/permisos/empleado/${usuario?.empleado_id}`;
    api.get(url)
      .then(r => setPermisos(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const subirFoto = async (permisoId, file) => {
    if (!file) return;
    setSubiendo(permisoId);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      await api.post(`/api/permisos/${permisoId}/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      cargar();
    } catch(e) {
      alert(e.response?.data?.error || 'Error al subir foto');
    } finally { setSubiendo(null); }
  };

  const quitarFoto = async (permisoId) => {
    if (!window.confirm('¿Quitar la foto del permiso firmado?')) return;
    try {
      await api.delete(`/api/permisos/${permisoId}/foto`);
      cargar();
    } catch(e) { alert('Error al quitar foto'); }
  };

  const filtrados = permisos.filter(p => {
    const nombre = `${p.nombre||''} ${p.apellido_paterno||''}`.toLowerCase();
    const matchBusqueda = !busqueda || nombre.includes(busqueda.toLowerCase());
    const matchFiltro = filtro === 'todos' || (filtro === 'firmados' && p.firmado) || (filtro === 'pendientes' && !p.firmado);
    return matchBusqueda && matchFiltro;
  });

  const pendientes = permisos.filter(p => !p.firmado).length;
  const firmados = permisos.filter(p => p.firmado).length;

  if (cargando) return <div className="loader-wrapper"><div className="loader"/></div>;

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Permisos de Vacaciones</h2>
      </div>

      {/* Resumen */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total permisos', value:permisos.length, color:'var(--g)', bg:'var(--g-soft)', icon:'📋' },
          { label:'Firmados', value:firmados, color:'#1B5E20', bg:'#E8F5E9', icon:'✅' },
          { label:'Pendientes firma', value:pendientes, color:'#856404', bg:'#FFF8E1', icon:'⏳' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:12, border:`1px solid ${k.color}22` }}>
            <span style={{ fontSize:28 }}>{k.icon}</span>
            <div>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:32, color:k.color, lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:k.color, opacity:.8, marginTop:2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding:'16px 20px', marginBottom:20, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        {esAdmin && <input className="form-control" style={{ flex:1, minWidth:180 }} placeholder="Buscar empleado..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />}
        <div style={{ display:'flex', gap:8 }}>
          {[['todos','Todos'],['pendientes','⏳ Pendientes'],['firmados','✅ Firmados']].map(([v,l]) => (
            <button key={v} onClick={()=>setFiltro(v)}
              style={{ padding:'8px 14px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer',
                background: filtro===v ? 'var(--g)' : 'var(--g10)',
                color: filtro===v ? '#fff' : 'var(--g60)',
                border: `2px solid ${filtro===v ? 'var(--g)' : 'var(--g20)'}` }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista permisos */}
      {filtrados.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g60)' }}>
            {permisos.length === 0 ? 'No hay permisos aún — se crean automáticamente al aprobar solicitudes' : 'Sin resultados'}
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtrados.map(p => (
            <div key={p.id} className="card" style={{ padding:'20px 24px',
              borderLeft: `4px solid ${p.firmado ? '#27ae60' : '#C9A84C'}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                {/* Foto empleado */}
                <div style={{ flexShrink:0 }}>
                  {p.emp_foto ? (
                    <img src={p.emp_foto} alt="" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--g)' }} />
                  ) : (
                    <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, border:'2px solid var(--g20)' }}>👤</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:17, color:'var(--g)' }}>
                    {p.nombre} {p.apellido_paterno}
                  </div>
                  <div style={{ fontSize:12, color:'var(--g60)', marginTop:2 }}>{p.puesto||'—'} · {p.departamento||'—'}</div>
                  <div style={{ fontSize:13, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'var(--g)', marginTop:6 }}>
                    📅 {fmtFecha(p.fecha_inicio)} → {fmtFecha(p.fecha_fin)}
                    <span style={{ marginLeft:10, color:'var(--g60)', fontWeight:600 }}>{p.dias_solicitados} días hábiles</span>
                  </div>
                </div>

                {/* Estado + acciones */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, flexShrink:0 }}>
                  <span style={{ padding:'5px 14px', borderRadius:20, fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800,
                    background: p.firmado ? '#D4EDDA' : '#FFF3CD',
                    color: p.firmado ? '#155724' : '#856404',
                    border: `1px solid ${p.firmado ? '#C3E6CB' : '#FFEEBA'}` }}>
                    {p.firmado ? '✅ Firmado' : '⏳ Pendiente firma'}
                  </span>

                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
                    {/* Ver foto */}
                    {p.firmado && p.foto_url && (
                      <button className="btn-institucional btn-sm" style={{ fontSize:11 }}
                        onClick={() => setVerFoto(p.foto_url)}>
                        🖼️ Ver permiso
                      </button>
                    )}

                    {/* Subir/quitar foto — solo admin/rrhh */}
                    {esAdmin && <>
                      <div style={{ position:'relative' }}>
                        <input
                          ref={el => inputRef.current[p.id] = el}
                          type="file"
                          accept="image/*,application/pdf"
                          style={{ display:'none' }}
                          onChange={e => subirFoto(p.id, e.target.files[0])}
                        />
                        <button className="btn-institucional dorado btn-sm" style={{ fontSize:11 }}
                          disabled={subiendo === p.id}
                          onClick={() => { if(inputRef.current[p.id]) { inputRef.current[p.id].removeAttribute('capture'); inputRef.current[p.id].click(); } }}>
                          {subiendo === p.id ? '⏳...' : p.firmado ? '🔄 Cambiar foto' : '📤 Subir firmado'}
                        </button>
                      </div>
                      <div style={{ position:'relative' }}>
                        <input type="file" accept="image/*,application/pdf" style={{ display:'none' }}
                          id={`cam-${p.id}`} onChange={e => subirFoto(p.id, e.target.files[0])} />
                        <button className="btn-institucional btn-sm" style={{ fontSize:11 }}
                          disabled={subiendo === p.id}
                          onClick={() => document.getElementById(`cam-${p.id}`)?.click()}>
                          📸 Tomar foto
                        </button>
                      </div>
                      {p.firmado && (
                        <button className="btn-institucional peligro btn-sm" style={{ fontSize:11 }}
                          onClick={() => quitarFoto(p.id)}>🗑️</button>
                      )}
                    </>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ver foto */}
      {verFoto && (
        <div className="modal-overlay" onClick={() => setVerFoto(null)}>
          <div style={{ maxWidth:700, width:'95%', background:'var(--w)', borderRadius:16, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background:'linear-gradient(135deg,#4A0A1E,#6B0F2B)', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#C9A84C', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14 }}>📄 Permiso firmado</span>
              <button className="modal-close" onClick={() => setVerFoto(null)}>✕</button>
            </div>
            <div style={{ padding:20 }}>
              {(() => {
                const esPDF = verFoto && verFoto.toLowerCase().includes('.pdf');
                // Cloudinary auto: PDF stored as /image/upload/*.pdf, preview via fl_pages
                const previewUrl = esPDF
                  ? verFoto.replace('/upload/', '/upload/pg_1,f_jpg/').replace('.pdf', '.jpg')
                  : verFoto;
                return (
                  <>
                    <div style={{ maxHeight:500, overflow:'auto', borderRadius:10, border:'1px solid #e2e8f0' }}>
                      <img src={previewUrl} alt="Permiso firmado"
                        style={{ width:'100%', display:'block', borderRadius:10 }}
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                      />
                      <div style={{ display:'none', textAlign:'center', padding:'32px 20px' }}>
                        <div style={{ fontSize:48, marginBottom:12 }}>📄</div>
                        <div style={{ fontSize:13, color:'#718096', fontFamily:'Montserrat,sans-serif' }}>Vista previa no disponible</div>
                      </div>
                    </div>
                    <div style={{ marginTop:12, textAlign:'center', display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                      <a href={previewUrl} download="permiso-firmado.jpg" className="btn-institucional filled btn-sm">
                        📥 Descargar imagen
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
