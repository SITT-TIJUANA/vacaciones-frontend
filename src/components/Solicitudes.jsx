import { useState, useEffect } from 'react';
import api from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

async function generarPermiso(s) {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'letter' });

  const GUINDA = [107,15,43];
  const DORADO = [201,168,76];
  const BLANCO = [255,255,255];
  const GRIS   = [248,245,245];

  // Obtener foto del empleado si tiene
  let fotoBase64 = null;
  let logoBase64 = null;

  try {
    const logoRes = await fetch('/vacaciones-frontend/logo-sitt.png');
    const logoBlob = await logoRes.blob();
    logoBase64 = await new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(logoBlob); });
  } catch(e) {}

  if (s.foto_url) {
    try {
      const r = await fetch(`/api/proxy-imagen?url=${encodeURIComponent(s.foto_url)}`);
      const blob = await r.blob();
      fotoBase64 = await new Promise(res => { const fr = new FileReader(); fr.onload = e => res(e.target.result); fr.readAsDataURL(blob); });
    } catch(e) {}
  }

  const pageW = 215.9;
  const pageH = 279.4;
  const hoy = new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});

  // ── HEADER GUINDA ──
  doc.setFillColor(...GUINDA);
  doc.rect(0, 0, pageW, 48, 'F');
  doc.setFillColor(...DORADO);
  doc.rect(0, 48, pageW, 2.5, 'F');

  // Logo
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', 8, 6, 30, 30); } catch(e) {}
  }

  // Foto empleado
  if (fotoBase64) {
    try {
      doc.addImage(fotoBase64, 'JPEG', pageW-46, 4, 36, 36);
      doc.setDrawColor(...DORADO);
      doc.setLineWidth(1);
      doc.rect(pageW-46, 4, 36, 36);
    } catch(e) {}
  }

  // Textos header
  doc.setTextColor(...BLANCO);
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.text('H. XXV Ayuntamiento de Tijuana', 44, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica','normal');
  doc.text('Sistema Integral de Transporte de Tijuana — SITT', 44, 21);
  doc.text('Dirección de Operaciones', 44, 27);
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.setTextColor(...DORADO);
  doc.text('PERMISO DE VACACIONES', 44, 35);
  doc.setTextColor(...BLANCO);
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.text(`Expedido el: ${hoy}`, 44, 41);

  // ── DATOS EMPLEADO ──
  let y = 62;

  // Recuadro datos
  doc.setFillColor(...GRIS);
  doc.setDrawColor(...GUINDA);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, pageW-28, 44, 3, 3, 'FD');

  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.setTextColor(...GUINDA);
  doc.text('DATOS DEL EMPLEADO', 20, y+8);

  doc.setDrawColor(...DORADO);
  doc.setLineWidth(0.5);
  doc.line(20, y+10, pageW-20, y+10);

  const datos = [
    ['Nombre completo:', `${s.nombre||''} ${s.apellido_paterno||''} ${s.apellido_materno||''}`.trim()],
    ['Puesto:', s.puesto || '—'],
    ['Departamento:', s.departamento || '—'],
    ['No. de empleado:', s.numero_empleado || '—'],
  ];

  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(50,50,50);
  datos.forEach(([label, valor], i) => {
    const col = i < 2 ? 20 : 115;
    const row = y + 16 + (i % 2) * 12;
    doc.setFont('helvetica','bold');
    doc.setTextColor(...GUINDA);
    doc.text(label, col, row);
    doc.setFont('helvetica','normal');
    doc.setTextColor(50,50,50);
    doc.text(valor, col + 36, row);
  });

  // ── PERIODO VACACIONAL ──
  y += 56;

  doc.setFillColor(...GUINDA);
  doc.roundedRect(14, y, pageW-28, 10, 2, 2, 'F');
  doc.setTextColor(...BLANCO);
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.text('PERIODO VACACIONAL AUTORIZADO', pageW/2, y+7, { align:'center' });

  y += 18;

  // Fechas en grande
  const fi = (() => { const f=s.fecha_inicio; if(!f)return'—'; const[yr,m,d]=f.substring(0,10).split('-'); return new Date(parseInt(yr),parseInt(m)-1,parseInt(d)).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}); })();
  const ff = (() => { const f=s.fecha_fin; if(!f)return'—'; const[yr,m,d]=f.substring(0,10).split('-'); return new Date(parseInt(yr),parseInt(m)-1,parseInt(d)).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}); })();

  // 3 cajas: inicio, flechita, fin
  const cajaW = 60;
  doc.setFillColor(240,235,235);
  doc.setDrawColor(...GUINDA);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, cajaW, 28, 3, 3, 'FD');
  doc.roundedRect(pageW-14-cajaW, y, cajaW, 28, 3, 3, 'FD');

  doc.setFont('helvetica','bold');
  doc.setFontSize(8);
  doc.setTextColor(...GUINDA);
  doc.text('FECHA DE INICIO', 14+cajaW/2, y+8, {align:'center'});
  doc.text('FECHA DE FIN', pageW-14-cajaW/2, y+8, {align:'center'});

  doc.setFontSize(9);
  doc.setTextColor(30,30,30);
  doc.text(fi, 14+cajaW/2, y+18, {align:'center'});
  doc.text(ff, pageW-14-cajaW/2, y+18, {align:'center'});

  // Flecha central
  doc.setFont('helvetica','bold');
  doc.setFontSize(18);
  doc.setTextColor(...GUINDA);
  doc.text('→', pageW/2, y+18, {align:'center'});

  // Total días
  y += 36;
  doc.setFillColor(...GUINDA);
  doc.roundedRect(pageW/2-30, y, 60, 16, 3, 3, 'F');
  doc.setTextColor(...DORADO);
  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.text(`${s.dias_solicitados} días hábiles`, pageW/2, y+10, {align:'center'});

  // ── FIRMAS ──
  y += 36;

  doc.setDrawColor(180,180,180);
  doc.setLineWidth(0.3);

  const firma1X = 30, firma2X = pageW/2-20, firma3X = pageW-70;
  const firmaY = y + 24;

  [firma1X, firma2X, firma3X].forEach(x => {
    doc.line(x, firmaY, x+60, firmaY);
  });

  doc.setFont('helvetica','bold');
  doc.setFontSize(8);
  doc.setTextColor(...GUINDA);
  doc.text('Firma del Empleado', firma1X+30, firmaY+6, {align:'center'});
  doc.text('Vo.Bo. Recursos Humanos', firma2X+30, firmaY+6, {align:'center'});
  doc.text('Vo.Bo. Administración', firma3X+30, firmaY+6, {align:'center'});

  doc.setFont('helvetica','normal');
  doc.setFontSize(7);
  doc.setTextColor(150,150,150);
  doc.text(`${s.nombre||''} ${s.apellido_paterno||''}`.trim(), firma1X+30, firmaY+11, {align:'center'});

  // ── FOOTER ──
  doc.setFillColor(...GUINDA);
  doc.rect(0, pageH-14, pageW, 14, 'F');
  doc.setFillColor(...DORADO);
  doc.rect(0, pageH-16, pageW, 2, 'F');
  doc.setTextColor(...BLANCO);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7);
  doc.text('Sistema de Control de Vacaciones — SITT · H. XXV Ayuntamiento de Tijuana', pageW/2, pageH-6, {align:'center'});

  doc.save(`Permiso_${(s.nombre||'').replace(/\s/g,'_')}_${s.fecha_inicio?.substring(0,10)||''}.pdf`);
}

export default function Solicitudes({ onActualizarNotif }) {
  const { usuario, rolEfectivo } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [resolviendo, setResolviendo] = useState(null);
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg, tipo='exito') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const esAdmin = ['admin', 'rrhh'].includes(rolEfectivo);

  const cargar = () => {
    setCargando(true);
    // En modo empleado solo ver las propias solicitudes
    const endpoint = rolEfectivo === 'empleado' && usuario?.empleado_id
      ? `/api/solicitudes?empleado_id=${usuario.empleado_id}`
      : '/api/solicitudes';
    api.get(endpoint)
      .then(r => setSolicitudes(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [rolEfectivo]);

  const resolver = async (id, estatus, comentario = '') => {
    try {
      await api.put(`/api/solicitudes/${id}/resolver`, { estatus, comentario_resolucion: comentario });
      cargar();
      onActualizarNotif?.();
      setResolviendo(null);
      mostrarToast(estatus==='aprobada' ? '✅ Solicitud aprobada — El empleado recibirá notificación por app y correo electrónico.' : '❌ Solicitud rechazada — El empleado recibirá notificación por app y correo electrónico.');
    } catch (e) {
      alert(e.response?.data?.error || 'Error al resolver');
    }
  };

  const filtradas = solicitudes.filter(s => (!filtroEstatus || s.estatus === filtroEstatus) && (!filtroEmpleado || s.empleado_id === filtroEmpleado));

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Solicitudes</h2>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select className="form-control" style={{ width:180 }} value={filtroEmpleado} onChange={e => setFiltroEmpleado(e.target.value)}>
            <option value="">Todos los empleados</option>
            {[...new Set(solicitudes.map(s => s.empleado_id).filter(Boolean))].map(id => {
              const s = solicitudes.find(x => x.empleado_id === id);
              return <option key={id} value={id}>{s?.nombre} {s?.apellido_paterno}</option>;
            })}
          </select>
          <select className="form-control" style={{ width:150 }} value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">⏳ Pendientes</option>
            <option value="aprobada">✅ Aprobadas</option>
            <option value="rechazada">❌ Rechazadas</option>
          </select>
          {usuario?.empleado_id && (
            <button className="btn-institucional filled" onClick={() => setModalNueva(true)}>
              ➕ Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="loader-wrapper"><div className="loader" /></div>
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--g60)' }}>
          <div style={{ fontSize:56, marginBottom:16 }} className="float-anim">📋</div>
          <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:20, color:'var(--g)' }}>Sin solicitudes</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtradas.map(s => (
            <div key={s.id} className="card" style={{ padding:'16px 20px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
                {esAdmin && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    {s.foto_url
                      ? <img src={s.foto_url} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--g)' }} />
                      : <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--g10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👤</div>
                    }
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--g)' }}>
                        {s.nombre} {s.apellido_paterno}
                      </div>
                      <div style={{ fontSize:11, color:'var(--g60)' }}>{s.departamento||''}</div>
                    </div>
                  </div>
                )}
                <div style={{ flex:1, minWidth:140 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--txt)', marginBottom:4 }}>
                    📅 {fmtFecha(s.fecha_inicio)} → {fmtFecha(s.fecha_fin)}
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, color:'var(--g)', fontSize:22 }}>{s.dias_solicitados}</span>
                    <span style={{ fontSize:12, color:'var(--g60)' }}>días · {s.anio}</span>
                    <span className={`badge badge-${s.estatus}`}>
                      {s.estatus === 'pendiente' && '⏳ '}
                      {s.estatus === 'aprobada' && '✅ '}
                      {s.estatus === 'rechazada' && '❌ '}
                      {s.estatus === 'cancelada' && '🚫 '}
                      {s.estatus}
                    </span>
                  </div>
                  {s.motivo && <div style={{ fontSize:12, color:'var(--g60)', marginTop:3 }}>💬 {s.motivo}</div>}
                  {s.comentario_resolucion && (
                    <div style={{ marginTop:8, padding:'8px 12px', background:'#FFEBEE', borderRadius:8, border:'1px solid #FFCDD2', fontSize:12, color:'#B71C1C', fontWeight:600 }}>
                      ❌ Motivo de rechazo: {s.comentario_resolucion}
                    </div>
                  )}
                  <div style={{ fontSize:11, color:'var(--g60)', marginTop:4 }}>
                    Solicitado: {fmtFecha(s.created_at)}
                    {s.aprobado_por_username && ` · Por: ${s.aprobado_por_username}`}
                  </div>
                </div>
                {esAdmin && s.estatus === 'pendiente' && (
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-institucional dorado btn-sm" onClick={() => resolver(s.id, 'aprobada')}>✅ Aprobar</button>
                    <button className="btn-institucional peligro btn-sm" onClick={() => setResolviendo({ id:s.id })}>❌ Rechazar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNueva && (
        <FormNuevaSolicitud
          onClose={() => setModalNueva(false)}
          onCreada={(t) => { cargar(); setModalNueva(false); onActualizarNotif?.(); if(t==='toast') mostrarToast('✅ Solicitud enviada — Se notificó a Recursos Humanos y Administración. Recibirás respuesta por app y correo electrónico.'); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)', zIndex:9999,
          background: toast.tipo==='exito' ? '#1B5E20' : '#B71C1C',
          color:'#fff', padding:'14px 24px', borderRadius:14, fontFamily:'Montserrat,sans-serif',
          fontWeight:700, fontSize:13, boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
          maxWidth:480, textAlign:'center', animation:'slideUp 0.3s ease' }}>
          {toast.msg}
        </div>
      )}

      {resolviendo && (
        <ModalRechazar
          onClose={() => setResolviendo(null)}
          onConfirmar={(c) => resolver(resolviendo.id, 'rechazada', c)}
        />
      )}
    </div>
  );
}

// Formulario completamente nuevo — sin modal, inline en la página
function FormNuevaSolicitud({ onClose, onCreada }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const calcDias = () => {
    if (!fechaInicio || !fechaFin) return 0;
    const ini = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (fin < ini) return 0;
    let dias = 0;
    const cur = new Date(ini);
    while (cur <= fin) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) dias++;
      cur.setDate(cur.getDate() + 1);
    }
    return dias;
  };

  const dias = calcDias();

  const enviar = async () => {
    if (!fechaInicio || !fechaFin) { setError('Selecciona las fechas'); return; }
    if (dias === 0) { setError('No hay días hábiles en ese rango'); return; }
    setEnviando(true); setError('');
    try {
      await api.post('/api/solicitudes', { fecha_inicio: fechaInicio, fecha_fin: fechaFin, motivo });
      onCreada('toast');
    } catch(e) {
      setError(e.response?.data?.error || 'Error al enviar');
      setEnviando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '20px 16px 40px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--w)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 480,
        marginTop: 60,
        overflow: 'visible',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--g-dk), var(--g))',
          borderRadius: '20px 20px 0 0',
          padding: '18px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:18, color:'#fff' }}>
            📝 Nueva Solicitud
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
            color: '#fff', width: 36, height: 36, borderRadius: '50%',
            cursor: 'pointer', fontSize: 18, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background:'#FFF3CD', border:'1px solid #FFEEBA', borderLeft:'4px solid #856404', padding:'10px 14px', borderRadius:8, fontSize:13, color:'#856404', fontWeight:600 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label>Fecha Inicio *</label>
            <input type="date" className="form-control"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Fecha Fin *</label>
            <input type="date" className="form-control"
              value={fechaFin}
              min={fechaInicio}
              onChange={e => setFechaFin(e.target.value)} />
          </div>

          {dias > 0 && (
            <div style={{ background:'var(--g-soft)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(107,15,43,0.15)', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900, fontSize:40, color:'var(--g)', lineHeight:1 }}>{dias}</div>
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)' }}>días hábiles</div>
                <div style={{ fontSize:11, color:'var(--g60)' }}>se descontarán de tu periodo</div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Motivo (opcional)</label>
            <textarea className="form-control" rows={3}
              placeholder="Describe el motivo de tus vacaciones..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)} />
          </div>
        </div>

        {/* Botones */}
        <div style={{ padding: '16px 20px 20px', display: 'flex', gap: 10 }}>
          <button className="btn-institucional" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-institucional filled" style={{ flex: 2 }} onClick={enviar} disabled={enviando}>
            {enviando ? '⏳ Enviando...' : '📤 Enviar Solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}


function ModalAsignarPeriodo({ solicitudId, empleadoId, onClose, onConfirmado }) {
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/solicitudes/${solicitudId}/preview-aprobacion`)
      .then(r => setPreview(r.data))
      .catch(e => setError(e.response?.data?.error || 'Error al cargar'))
      .finally(() => setCargando(false));
  }, [solicitudId]);

  const confirmar = async () => {
    setGuardando(true);
    try {
      await api.put(`/api/solicitudes/${solicitudId}/resolver`, { estatus: 'aprobada' });
      onConfirmado();
    } catch(e) {
      setError(e.response?.data?.error || 'Error al aprobar');
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:500 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{ background:'linear-gradient(135deg,#1B5E20,#27ae60)' }}>
          <h2>✅ Aprobar Solicitud</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {cargando ? (
            <div style={{ textAlign:'center', padding:30, color:'var(--g60)' }}>Calculando días disponibles...</div>
          ) : error ? (
            <div style={{ padding:'12px 14px', background:'#FFEBEE', borderRadius:10, border:'1px solid #FFCDD2', color:'#B71C1C', fontSize:13, fontWeight:600 }}>
              ❌ {error}
            </div>
          ) : preview && (
            <>
              {/* Info solicitud */}
              <div style={{ padding:'12px 14px', background:'#E8F5E9', borderRadius:10, border:'1px solid #C8E6C9', fontSize:13, color:'#1B5E20', fontWeight:600 }}>
                ✅ Solicitud de <strong>{preview.dias_pedidos} días</strong> — {preview.empleado.nombre} {preview.empleado.apellido_paterno}
              </div>

              {/* Distribución por periodos */}
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  Así se descontarán los días:
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {preview.distribucion.map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--g-soft)', borderRadius:10, border:'1px solid rgba(107,15,43,0.15)' }}>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'var(--g)', minWidth:32 }}>{item.dias_a_usar}</div>
                      <div>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)' }}>
                          Periodo {item.numero}
                        </div>
                        <div style={{ fontSize:11, color:'var(--g60)', marginTop:1 }}>
                          {new Date(item.inicio).toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})} → {new Date(item.fin).toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}
                        </div>
                        <div style={{ fontSize:11, color:'var(--g60)', marginTop:1 }}>
                          Tenía {item.dias_disponibles} días disponibles → quedará con <strong style={{ color: item.dias_disponibles-item.dias_a_usar > 0 ? '#1B5E20' : '#B71C1C' }}>{item.dias_disponibles - item.dias_a_usar} días</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding:'10px 14px', background:'#FFF8E1', borderRadius:10, border:'1px solid #FFE082', fontSize:12, color:'#856404', fontWeight:600 }}>
                📊 Total disponible antes: <strong>{preview.total_disponible} días</strong> → después: <strong>{preview.total_disponible - preview.dias_pedidos} días</strong>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional filled btn-sm"
            style={{ background:'#1B5E20', borderColor:'#1B5E20' }}
            onClick={confirmar}
            disabled={guardando || cargando || !!error}>
            {guardando ? '⏳ Aprobando...' : '✅ Confirmar Aprobación'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalRechazar({ onClose, onConfirmar }) {
  const [comentario, setComentario] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>❌ Rechazar Solicitud</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Motivo del rechazo</label>
            <textarea className="form-control" rows={3}
              placeholder="El empleado verá este motivo..."
              value={comentario} onChange={e => setComentario(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-institucional peligro btn-sm" onClick={() => onConfirmar(comentario)}>
            ❌ Confirmar Rechazo
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}
