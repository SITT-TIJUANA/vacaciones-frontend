import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import api from '../services/api';
import ConfigPDF from './ConfigPDF';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Colores institucionales ──────────────────────────────
const GUINDA  = [107, 15, 43];
const DORADO  = [201, 168, 76];
const BLANCO  = [255, 255, 255];
const GRIS_LT = [248, 245, 245];
const GRIS_MID= [212, 200, 200];

// ── Helpers PDF ──────────────────────────────────────────
function addHeaderPDF(doc, titulo, subtitulo, logoBase64) {
  // Fondo guinda
  doc.setFillColor(...GUINDA);
  doc.rect(0, 0, 210, 42, 'F');
  // Línea dorada
  doc.setFillColor(...DORADO);
  doc.rect(0, 42, 210, 2.5, 'F');

  // Logo
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', 8, 6, 28, 28); } catch(e) {}
  }

  // Textos header
  doc.setTextColor(...BLANCO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('H. XXV Ayuntamiento de Tijuana', 42, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema Integral de Transporte de Tijuana — SITT', 42, 21);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 42, 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(subtitulo, 42, 35);
}

function addFooterPDF(doc) {
  const pags = doc.getNumberOfPages();
  for (let i = 1; i <= pags; i++) {
    doc.setPage(i);
    doc.setFillColor(...GUINDA);
    doc.rect(0, 284, 210, 2, 'F');
    doc.setFillColor(74, 10, 30);
    doc.rect(0, 286, 210, 12, 'F');
    doc.setTextColor(...DORADO);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SITT — Sistema de Control de Vacaciones', 14, 293);
    doc.setTextColor(...BLANCO);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pags}  ·  Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, 120, 293);
  }
}

async function getLogoBase64() {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `${window.location.origin}/vacaciones-frontend/escudo-sitt.png?t=${Date.now()}`;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; setTimeout(res, 3000); });
    if (!img.complete || img.naturalWidth === 0) return null;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  } catch(e) { return null; }
}

export default function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [empleadoFiltro, setEmpleadoFiltro] = useState('');
  const [exportando, setExportando] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.all([
      api.get(`/api/reportes/resumen?anio=${anio}`),
      api.get(`/api/reportes/empleados-detalle?anio=${anio}`),
    ]).then(([r, d]) => { setResumen(r.data); setDetalle(d.data); })
      .catch(console.error).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [anio]);

  const detalleFiltrado = detalle.filter(e => {
    if (!busqueda) return true;
    return `${e.apellido_paterno} ${e.nombre} ${e.apellido_materno||''}`.toLowerCase().includes(busqueda.toLowerCase());
  });

  const empSeleccionado = empleadoFiltro ? detalle.find(e => e.id === empleadoFiltro) : null;

  // ── EXPORTAR PDF ─────────────────────────────────────
  const exportarPDF = async (cfg) => {
    setExportando(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const logo = await getLogoBase64();
      const tot = resumen?.totales || {};
      const fecha = new Date().toLocaleDateString('es-MX', { dateStyle: 'full' });
      const tituloDoc = empSeleccionado
        ? `Reporte Individual: ${empSeleccionado.apellido_paterno} ${empSeleccionado.nombre}`
        : `Reporte General de Vacaciones ${anio}`;

      // Aplicar colores de configuración
      const CP = cfg.hexToRgb(cfg.colorPrimario);
      const CS = cfg.hexToRgb(cfg.colorSecundario);
      // Override colores globales temporalmente
      const origGuinda = [...GUINDA];
      GUINDA.splice(0,3,...CP);
      const origDorado = [...DORADO];
      DORADO.splice(0,3,...CS);

      addHeaderPDF(doc, cfg.titulo || tituloDoc, cfg.subtitulo || cfg.institucion || fecha, logo);

      let y = 54;

      // ── KPIs ────────────────────────────────────────
      const kpis = empSeleccionado ? [
        ['Empleado', `${empSeleccionado.nombre} ${empSeleccionado.apellido_paterno}`],
        ['Departamento', empSeleccionado.departamento || '—'],
        ['Puesto', empSeleccionado.puesto || '—'],
        ['Días correspondientes', String(empSeleccionado.dias_correspondientes)],
        ['Días tomados', String(empSeleccionado.dias_tomados)],
        ['Días disponibles', String(empSeleccionado.dias_disponibles)],
      ] : [
        ['Total empleados activos', String(tot.total_empleados || 0)],
        ['Total días asignados', String(tot.total_dias_asignados || 0)],
        ['Total días tomados', String(tot.total_dias_tomados || 0)],
        ['Total días disponibles', String(tot.total_dias_disponibles || 0)],
        ['Solicitudes pendientes', String(tot.solicitudes_pendientes || 0)],
        ['Solicitudes aprobadas', String(tot.solicitudes_aprobadas || 0)],
      ];

      // Título sección
      doc.setFillColor(...GUINDA);
      doc.rect(14, y, 182, 7, 'F');
      doc.setTextColor(...BLANCO);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN EJECUTIVO', 18, y + 4.8);
      y += 10;

      // Cards de KPIs (2 columnas)
      const colW = 88;
      kpis.forEach(([label, val], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = 14 + col * (colW + 6);
        const cy = y + row * 14;
        doc.setFillColor(...GRIS_LT);
        doc.roundedRect(cx, cy, colW, 12, 2, 2, 'F');
        doc.setDrawColor(...GUINDA);
        doc.setLineWidth(0.5);
        doc.line(cx, cy, cx, cy + 12);
        doc.setTextColor(107, 15, 43);
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 15, 43);
        doc.text(label.toUpperCase(), cx + 4, cy + 4.5);
        doc.setTextColor(26, 22, 20);
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text(val, cx + 4, cy + 10);
      });

      y += Math.ceil(kpis.length / 2) * 14 + 8;

      // ── Por departamento ────────────────────────────
      if (resumen.por_departamento.length > 0 && !empSeleccionado) {
        doc.setFillColor(...GUINDA);
        doc.rect(14, y, 182, 7, 'F');
        doc.setTextColor(...BLANCO);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('VACACIONES POR DEPARTAMENTO', 18, y + 4.8);
        y += 10;

        doc.autoTable({
          startY: y,
          head: [['Departamento', 'Empleados', 'Días Tomados', 'Días Disponibles']],
          body: resumen.por_departamento.map(d => [d.departamento, d.empleados, d.dias_tomados, d.dias_disponibles]),
          headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: GRIS_LT },
          columnStyles: { 1:{halign:'center'}, 2:{halign:'center'}, 3:{halign:'center',fontStyle:'bold'} },
          margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      // ── Detalle empleados ────────────────────────────
      const dataTabla = empSeleccionado ? [empSeleccionado] : detalleFiltrado;
      if (dataTabla.length > 0) {
        doc.setFillColor(...GUINDA);
        doc.rect(14, y, 182, 7, 'F');
        doc.setTextColor(...BLANCO);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('DETALLE POR EMPLEADO', 18, y + 4.8);
        y += 10;

        doc.autoTable({
          startY: y,
          head: [['#', 'Empleado', 'Departamento', 'Puesto', 'Corresponden', 'Tomados', 'Disponibles']],
          body: dataTabla.map((e, i) => [
            i + 1,
            `${e.apellido_paterno} ${e.nombre}`,
            e.departamento || '—',
            e.puesto || '—',
            e.dias_correspondientes,
            e.dias_tomados,
            e.dias_disponibles,
          ]),
          headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', fontSize: 8.5 },
          bodyStyles: { fontSize: 8.5 },
          alternateRowStyles: { fillColor: GRIS_LT },
          columnStyles: {
            0: { halign:'center', cellWidth:10 },
            4: { halign:'center' },
            5: { halign:'center' },
            6: { halign:'center', fontStyle:'bold', textColor: GUINDA },
          },
          margin: { left: 14, right: 14 },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 6) {
              const val = parseInt(data.cell.raw);
              if (val <= 2) data.cell.styles.textColor = [183, 28, 28];
              else if (val <= 5) data.cell.styles.textColor = [230, 81, 0];
              else data.cell.styles.textColor = GUINDA;
            }
          },
        });
      }

      // ── Firma ────────────────────────────────────────
      if (cfg.incluirFirmas && cfg.firmas?.length > 0) {
        const pageH = doc.internal.pageSize.height;
        const firmaY = pageH - 55;
        doc.setFillColor(...GUINDA);
        doc.rect(14, firmaY - 8, 182, 7, 'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(9); doc.setFont('helvetica','bold');
        doc.text('FIRMAS DE AUTORIZACIÓN', 18, firmaY - 3.5);

        const fw = 182 / cfg.firmas.length;
        cfg.firmas.forEach((f, i) => {
          const fx = 14 + i * fw;
          const lineY = firmaY + 22;
          doc.setDrawColor(...GUINDA);
          doc.setLineWidth(0.5);
          doc.line(fx + 8, lineY, fx + fw - 8, lineY);
          doc.setTextColor(107, 15, 43);
          doc.setFontSize(7.5); doc.setFont('helvetica','bold');
          doc.text(f.etiqueta || 'Firma', fx + fw/2, lineY + 4, { align:'center' });
          if (f.nombre) {
            doc.setFontSize(8); doc.setTextColor(26,22,20);
            doc.text(f.nombre, fx + fw/2, lineY + 9, { align:'center' });
          }
          doc.setFontSize(7); doc.setTextColor(107, 15, 43);
          doc.text(f.puesto || '', fx + fw/2, lineY + 13.5, { align:'center' });
        });
      }

      // ── Nota final ──────────────────────────────────
      if (cfg.notaFinal) {
        const lines = doc.splitTextToSize(cfg.notaFinal, 182);
        const lastY = doc.lastAutoTable?.finalY || 200;
        doc.setFontSize(8); doc.setTextColor(130,120,120);
        doc.setFont('helvetica','italic');
        doc.text(lines, 14, lastY + 12);
      }

      // Restaurar colores
      GUINDA.splice(0,3,...origGuinda);
      DORADO.splice(0,3,...origDorado);

      addFooterPDF(doc);
      doc.save(`Reporte_SITT_${anio}${empSeleccionado ? '_' + empSeleccionado.apellido_paterno : ''}.pdf`);
    } catch(e) {
      console.error(e);
      alert('Error al generar PDF');
    } finally { setExportando(false); }
  };

  // ── EXPORTAR EXCEL ───────────────────────────────────
  const exportarExcel = async () => {
    setExportando(true);
    try {
      // Cargar SheetJS dinámicamente desde CDN
      let XLSX = window.XLSX;
      if (!XLSX) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
        XLSX = window.XLSX;
      }
      const [empRes, solRes] = await Promise.all([
        api.get('/api/empleados'),
        api.get('/api/solicitudes'),
      ]);

      const wb = XLSX.utils.book_new();

      // Hoja 1 — Empleados
      const empData = empRes.data.map(e => ({
        'Número': e.numero_empleado || '',
        'Nombre': e.nombre,
        'Apellido Paterno': e.apellido_paterno,
        'Apellido Materno': e.apellido_materno || '',
        'Puesto': e.puesto || '',
        'Departamento': e.departamento || '',
        'Fecha Ingreso': e.fecha_ingreso ? new Date(e.fecha_ingreso).toLocaleDateString('es-MX') : '',
        'Email': e.email || '',
        'Teléfono': e.telefono || '',
        'Días Correspondientes': e.dias_correspondientes || 0,
        'Días Tomados': e.dias_tomados || 0,
        'Días Disponibles': e.dias_disponibles || 0,
      }));
      const ws1 = XLSX.utils.json_to_sheet(empData);
      ws1['!cols'] = [8,14,16,16,22,18,14,24,14,16,14,14].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws1, 'Empleados');

      // Hoja 2 — Solicitudes
      const solData = solRes.data.map(s => ({
        'Empleado': `${s.nombre || ''} ${s.apellido_paterno || ''}`.trim(),
        'Fecha Inicio': s.fecha_inicio ? new Date(s.fecha_inicio).toLocaleDateString('es-MX') : '',
        'Fecha Fin': s.fecha_fin ? new Date(s.fecha_fin).toLocaleDateString('es-MX') : '',
        'Días Solicitados': s.dias_solicitados,
        'Año': s.anio,
        'Estatus': s.estatus,
        'Motivo': s.motivo || '',
        'Comentario': s.comentario_resolucion || '',
        'Fecha Solicitud': new Date(s.created_at).toLocaleDateString('es-MX'),
      }));
      const ws2 = XLSX.utils.json_to_sheet(solData);
      ws2['!cols'] = [20,14,14,14,8,12,24,24,14].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws2, 'Solicitudes');

      // Hoja 3 — Resumen
      const tot = resumen?.totales || {};
      const resData = [
        { 'Indicador': 'Total Empleados', 'Valor': tot.total_empleados || 0 },
        { 'Indicador': 'Días Asignados', 'Valor': tot.total_dias_asignados || 0 },
        { 'Indicador': 'Días Tomados', 'Valor': tot.total_dias_tomados || 0 },
        { 'Indicador': 'Días Disponibles', 'Valor': tot.total_dias_disponibles || 0 },
        { 'Indicador': 'Solicitudes Pendientes', 'Valor': tot.solicitudes_pendientes || 0 },
        { 'Indicador': 'Solicitudes Aprobadas', 'Valor': tot.solicitudes_aprobadas || 0 },
        { 'Indicador': 'Año del Reporte', 'Valor': anio },
        { 'Indicador': 'Fecha de Exportación', 'Valor': new Date().toLocaleDateString('es-MX', { dateStyle: 'full' }) },
      ];
      const ws3 = XLSX.utils.json_to_sheet(resData);
      ws3['!cols'] = [{ wch: 28 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Resumen');

      // Hoja 4 — Por Departamento
      if (resumen?.por_departamento?.length > 0) {
        const deptData = resumen.por_departamento.map(d => ({
          'Departamento': d.departamento,
          'Empleados': d.empleados,
          'Días Tomados': d.dias_tomados,
          'Días Disponibles': d.dias_disponibles,
        }));
        const ws4 = XLSX.utils.json_to_sheet(deptData);
        ws4['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Por Departamento');
      }

      XLSX.writeFile(wb, `Respaldo_SITT_${anio}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch(e) {
      console.error(e);
      alert('Error al exportar Excel');
    } finally { setExportando(false); }
  };

  if (cargando) return <div className="loader-wrapper"><div className="loader" /></div>;
  if (!resumen) return null;

  const tot = resumen.totales;
  const chartOpts = {
    responsive: true,
    plugins: { legend: { position:'bottom', labels:{ font:{family:'Montserrat',size:11}, color:'#6B0F2B' } } },
  };

  const dataBarDepto = {
    labels: resumen.por_departamento.map(d => d.departamento),
    datasets: [
      { label:'Tomados', data:resumen.por_departamento.map(d=>d.dias_tomados), backgroundColor:'rgba(107,15,43,0.8)', borderRadius:6 },
      { label:'Disponibles', data:resumen.por_departamento.map(d=>d.dias_disponibles), backgroundColor:'rgba(201,168,76,0.8)', borderRadius:6 },
    ],
  };
  const dataDonut = {
    labels: ['Tomados','Disponibles'],
    datasets: [{ data:[tot.total_dias_tomados,tot.total_dias_disponibles], backgroundColor:['rgba(107,15,43,0.85)','rgba(201,168,76,0.85)'], borderColor:['#6B0F2B','#C9A84C'], borderWidth:2 }],
  };
  const mesesData = Array(12).fill(0);
  resumen.solicitudes_por_mes.forEach(m => { mesesData[parseInt(m.mes)-1] = parseInt(m.dias||0); });
  const dataLine = {
    labels: MESES,
    datasets: [{ label:'Días Aprobados', data:mesesData, borderColor:'#6B0F2B', backgroundColor:'rgba(107,15,43,0.08)', fill:true, tension:0.4, pointBackgroundColor:'#C9A84C', pointRadius:5 }],
  };
  const top5 = [...detalle].sort((a,b) => b.dias_disponibles - a.dias_disponibles).slice(0,5);
  const dataTop5 = {
    labels: top5.map(e => e.apellido_paterno),
    datasets: [{ label:'Días Disponibles', data:top5.map(e=>e.dias_disponibles), backgroundColor:'rgba(107,15,43,0.75)', borderRadius:8 }],
  };
  const dataSolicitudes = {
    labels: ['Aprobadas','Pendientes','Rechazadas'],
    datasets: [{ data:[tot.solicitudes_aprobadas||0, tot.solicitudes_pendientes||0, 0], backgroundColor:['rgba(39,174,96,0.8)','rgba(230,81,0,0.8)','rgba(183,28,28,0.8)'], borderWidth:0 }],
  };

  return (
    <div className="fade-in">
      {/* FILTROS ARRIBA */}
      <div style={{ background:'var(--w)', borderRadius:'var(--r-md)', border:'1px solid var(--g20)', padding:'20px 24px', marginBottom:28, boxShadow:'var(--sh-sm)' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:16 }}>
          🔍 Filtros del Reporte
        </div>
        <div style={{ display:'flex', gap:14, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div className="form-group" style={{ minWidth:110 }}>
            <label>Año</label>
            <select className="form-control" value={anio} onChange={e=>setAnio(parseInt(e.target.value))}>
              {[2023,2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex:1, minWidth:180 }}>
            <label>Filtrar por empleado</label>
            <select className="form-control" value={empleadoFiltro} onChange={e=>setEmpleadoFiltro(e.target.value)}>
              <option value="">— Todos —</option>
              {detalle.map(e=><option key={e.id} value={e.id}>{e.apellido_paterno} {e.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex:1, minWidth:180 }}>
            <label>Buscar en tabla</label>
            <input className="form-control" placeholder="Nombre..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn-institucional filled" onClick={() => setShowConfig(true)} disabled={exportando}>
              {exportando ? '⏳...' : '⚙️ PDF'}
            </button>
            <button className="btn-institucional dorado" onClick={exportarExcel} disabled={exportando}>
              {exportando ? '⏳...' : '📊 Excel'}
            </button>
            {(busqueda||empleadoFiltro) && <button className="btn-institucional btn-sm" onClick={()=>{setBusqueda('');setEmpleadoFiltro('');}}>✕</button>}
          </div>
        </div>
        {empSeleccionado && (
          <div style={{ marginTop:14, padding:'10px 14px', background:'var(--g-soft)', borderRadius:10, border:'1px solid rgba(107,15,43,0.15)', display:'flex', alignItems:'center', gap:12 }}>
            {empSeleccionado.foto_url && <img src={empSeleccionado.foto_url} alt="" style={{ width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--g)' }} />}
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--g)' }}>Viendo: {empSeleccionado.apellido_paterno} {empSeleccionado.nombre}</div>
              <div style={{ fontSize:11, color:'var(--g60)' }}>{empSeleccionado.dias_correspondientes} corresp. · {empSeleccionado.dias_tomados} tomados · <strong style={{ color:'var(--g)' }}>{empSeleccionado.dias_disponibles} disponibles</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        {[
          { label:'Total empleados', value:empSeleccionado?1:tot.total_empleados, icon:'👥', clase:'' },
          { label:'Días tomados', value:empSeleccionado?empSeleccionado.dias_tomados:tot.total_dias_tomados, icon:'📅', clase:'dorado' },
          { label:'Días disponibles', value:empSeleccionado?empSeleccionado.dias_disponibles:tot.total_dias_disponibles, icon:'✅', clase:'verde' },
          { label:'Solicitudes pendientes', value:tot.solicitudes_pendientes, icon:'⏳', clase:'' },
        ].map(({label,value,icon,clase})=>(
          <div key={label} className={`card kpi-card ${clase}`} data-icon={icon}>
            <div style={{ fontSize:26 }}>{icon}</div>
            <div className="kpi-value">{value||0}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid-2" style={{ marginBottom:28 }}>
        <div className="card"><h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16 }}>📊 Por Departamento</h3>{resumen.por_departamento.length>0?<Bar data={dataBarDepto} options={chartOpts}/>:<p style={{textAlign:'center',color:'var(--g60)',padding:40}}>Sin datos</p>}</div>
        <div className="card"><h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16 }}>🍩 Uso General</h3><div style={{maxWidth:260,margin:'0 auto'}}><Doughnut data={dataDonut} options={{...chartOpts,scales:undefined}}/></div></div>
      </div>
      <div className="grid-2" style={{ marginBottom:28 }}>
        <div className="card"><h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16 }}>🏆 Top 5 — Más Días Disponibles</h3>{top5.length>0?<Bar data={dataTop5} options={{...chartOpts,indexAxis:'y'}}/>:<p style={{textAlign:'center',color:'var(--g60)',padding:40}}>Sin datos</p>}</div>
        <div className="card"><h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16 }}>📋 Solicitudes por Estatus</h3><div style={{maxWidth:260,margin:'0 auto'}}><Doughnut data={dataSolicitudes} options={{...chartOpts,scales:undefined}}/></div></div>
      </div>
      <div className="card" style={{ marginBottom:28 }}>
        <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16 }}>📈 Días Aprobados por Mes — {anio}</h3>
        <Line data={dataLine} options={chartOpts}/>
      </div>

      {/* Tabla */}
      <div className="card">
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:12 }}>
          <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)' }}>👥 Detalle por Empleado</h3>
          <span style={{ fontSize:12,color:'var(--g60)',fontFamily:'Montserrat,sans-serif',fontWeight:600 }}>{detalleFiltrado.length} resultado{detalleFiltrado.length!==1?'s':''}</span>
        </div>
        {detalleFiltrado.length===0?(
          <p style={{textAlign:'center',padding:40,color:'var(--g60)'}}>Sin resultados</p>
        ):(
          <div className="tabla-wrapper">
            <table>
              <thead><tr><th>Empleado</th><th>Departamento</th><th>Puesto</th><th>Corresponden</th><th>Tomados</th><th>Disponibles</th></tr></thead>
              <tbody>
                {detalleFiltrado.map((e,i)=>(
                  <tr key={i} style={{background:empleadoFiltro===e.id?'var(--g-soft)':undefined}}>
                    <td><strong>{e.apellido_paterno} {e.nombre}</strong></td>
                    <td style={{fontSize:12}}>{e.departamento||'—'}</td>
                    <td style={{fontSize:12}}>{e.puesto||'—'}</td>
                    <td style={{textAlign:'center'}}>{e.dias_correspondientes}</td>
                    <td style={{textAlign:'center'}}>{e.dias_tomados}</td>
                    <td style={{textAlign:'center'}}>
                      <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,color:e.dias_disponibles<=2?'#c0392b':e.dias_disponibles<=5?'var(--d-dk)':'var(--g)',fontSize:16}}>
                        {e.dias_disponibles}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showConfig && (
        <ConfigPDF
          empSeleccionado={empSeleccionado}
          onCerrar={() => setShowConfig(false)}
          onGenerar={(cfg) => { setShowConfig(false); exportarPDF(cfg); }}
        />
      )}
    </div>
  );
}
