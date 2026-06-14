import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import api from '../services/api';
import ConfigPDF from './ConfigPDF';

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

async function getFotoBase64(url) {
  if (!url) return null;
  try {
    // Usar proxy del backend para evitar CORS con Cloudinary
    const token = localStorage.getItem('token');
    const API = 'https://vacaciones-backend-7ota.onrender.com';
    const res = await fetch(`${API}/api/proxy-imagen?url=${encodeURIComponent(url)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
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

  const empSeleccionadoBase = empleadoFiltro ? detalle.find(e => e.id === empleadoFiltro) : null;
  const [empDetalleReal, setEmpDetalleReal] = useState(null);
  
  useEffect(() => {
    if (empleadoFiltro) {
      api.get(`/api/solicitudes/periodos-detalle/${empleadoFiltro}`)
        .then(r => setEmpDetalleReal(r.data))
        .catch(() => setEmpDetalleReal(null));
    } else {
      setEmpDetalleReal(null);
    }
  }, [empleadoFiltro]);

  const empSeleccionado = empDetalleReal
    ? { ...empSeleccionadoBase, ...empDetalleReal.empleado, 
        dias_correspondientes: empDetalleReal.total_correspondiente,
        dias_tomados: empDetalleReal.total_tomado,
        dias_disponibles: empDetalleReal.total_disponible }
    : empSeleccionadoBase;

  // ── EXPORTAR PDF ─────────────────────────────────────
  const exportarPDF = async (cfg) => {
    setExportando(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const logo = await getLogoBase64();
      const fotoEmp = (cfg.incluirFoto && empSeleccionado?.foto_url)
        ? await getFotoBase64(empSeleccionado.foto_url)
        : null;
      console.log('🖼️ Foto URL:', empSeleccionado?.foto_url);
      console.log('🖼️ Foto base64 length:', fotoEmp?.length || 0);
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

      // ── Foto empleado en encabezado ──────────────────
      if (fotoEmp && empSeleccionado) {
        try {
          doc.addImage(fotoEmp, 'JPEG', 152, 5, 32, 32);
          // Borde dorado encima
          doc.setDrawColor(...CS);
          doc.setLineWidth(1.2);
          doc.rect(152, 5, 32, 32);
        } catch(e) {
          try {
            doc.addImage(fotoEmp, 'PNG', 152, 5, 32, 32);
          } catch(e2) {}
        }
      }

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

      // ── Periodos detallados cuando es reporte individual ────
      if (empSeleccionado) {
        try {
          const periodosDataRes = empDetalleReal || (await api.get(`/api/solicitudes/periodos-detalle/${empSeleccionado.id}`)).data;
          const periodosData = periodosDataRes;
          if (periodosData?.periodos?.length) {
            doc.setFillColor(...GUINDA);
            doc.rect(14, y, 182, 7, 'F');
            doc.setTextColor(...BLANCO);
            doc.setFontSize(9); doc.setFont('helvetica','bold');
            doc.text('DETALLE DE PERIODOS Y VACACIONES', 18, y + 4.8);
            y += 10;

            for (const p of periodosData.periodos) {
              // Header del periodo
              doc.setFillColor(248, 245, 245);
              doc.rect(14, y, 182, 8, 'F');
              doc.setDrawColor(...GUINDA);
              doc.setLineWidth(0.3);
              doc.rect(14, y, 182, 8);
              doc.setTextColor(...GUINDA);
              doc.setFontSize(9); doc.setFont('helvetica','bold');
              const fmtP = (f) => { if(!f)return'—'; const[yr,m,d]=f.substring(0,10).split('-'); return new Date(parseInt(yr),parseInt(m)-1,parseInt(d)).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}); };
              doc.text(`Periodo ${p.numero}: ${fmtP(p.fecha_inicio)} — ${fmtP(p.fecha_fin)}`, 18, y + 5.5);
              doc.setFont('helvetica','normal');
              doc.text(`${p.dias_correspondientes} corresp. | ${p.dias_tomados} tomados | ${p.dias_disponibles} disponibles`, 115, y + 5.5);
              y += 10;

              // Vacaciones de este periodo (solicitudes + manuales)
              const fmtD = (f) => { if(!f)return'—'; const[yr,m,d]=String(f).substring(0,10).split('-'); return new Date(parseInt(yr),parseInt(m)-1,parseInt(d)).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}); };
              const todasVacs = [
                ...(p.solicitudes||[]).map(s=>(['✅ Sistema', fmtD(s.fecha_inicio), fmtD(s.fecha_fin), `${s.dias_solicitados} días`, s.motivo||'—'])),
                ...(p.manuales||[]).map(m=>(['📂 Manual', fmtD(m.fecha_inicio), fmtD(m.fecha_fin), `${m.dias} días`, m.notas||'—'])),
              ];
              if (todasVacs.length) {
                doc.autoTable({
                  startY: y,
                  head: [['Tipo','Fecha inicio','Fecha fin','Días','Notas']],
                  body: todasVacs,
                  headStyles: { fillColor: [74,10,30], fontSize:8 },
                  bodyStyles: { fontSize:8 },
                  margin: { left:18, right:14 },
                  tableWidth: 178,
                });
                y = doc.lastAutoTable.finalY + 6;
              } else {
                doc.setTextColor(130,120,120); doc.setFontSize(8);
                doc.text('Sin vacaciones registradas en este periodo', 22, y + 4);
                y += 10;
              }
            }

            // Próximo periodo
            if (periodosData.proximo_periodo) {
              doc.setTextColor(...GUINDA);
              doc.setFontSize(8); doc.setFont('helvetica','italic');
              doc.text(`⏳ Próximo periodo en ${periodosData.proximo_periodo.meses_faltantes} mes(es)`, 14, y + 4);
              y += 10;
            }
          }
        } catch(e) {}
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
  const top5 = [...detalle].sort((a,b) => b.dias_disponibles - a.dias_disponibles).slice(0,5);
  const mesesData = Array(12).fill(0);
  resumen.solicitudes_por_mes.forEach(m => { mesesData[parseInt(m.mes)-1] = parseInt(m.dias||0); });

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

      {/* Gráfica Departamentos */}
      <div style={{marginBottom:24}}>
        <GraficaBarras3D
          titulo="📊 Días por Departamento"
          datos={resumen.por_departamento.map(d=>({
            label: d.departamento,
            tomados: parseInt(d.dias_tomados)||0,
            disponibles: parseInt(d.dias_disponibles)||0,
          }))}
        />
      </div>

      {/* Gráfica Empleados */}
      <div style={{marginBottom:24}}>
        <GraficaBarras3D
          titulo="👥 Días por Empleado"
          datos={[...detalle]
            .filter(e => e.dias_correspondientes > 0)
            .sort((a,b)=>b.dias_disponibles-a.dias_disponibles)
            .map(e=>({
              label: `${e.nombre} ${e.apellido_paterno}`,
              tomados: e.dias_tomados||0,
              disponibles: e.dias_disponibles||0,
              detalle: e,
            }))}
          onClic={(d)=>setEmpleadoFiltro(d.detalle?.id||'')}
        />
      </div>

      {/* Donut + Solicitudes */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20,marginBottom:24}}>
        <GraficaDonut3D
          titulo="🍩 Uso General de Días"
          datos={[
            {label:'Días Tomados', valor:tot.total_dias_tomados||0, color:'#6B0F2B'},
            {label:'Días Disponibles', valor:tot.total_dias_disponibles||0, color:'#C9A84C'},
          ]}
        />
        <GraficaDonut3D
          titulo="📋 Solicitudes por Estatus"
          datos={[
            {label:'Aprobadas', valor:tot.solicitudes_aprobadas||0, color:'#27ae60'},
            {label:'Pendientes', valor:tot.solicitudes_pendientes||0, color:'#F59E0B'},
          ]}
        />
      </div>

      {/* Línea */}
      <div className="card" style={{marginBottom:24}}>
        <GraficaLinea
          titulo={`📈 Días Aprobados por Mes — ${anio}`}
          datos={mesesData}
          meses={MESES}
        />
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

// ── Gráfica Barras 3D ─────────────────────────────────────
function GraficaBarras3D({ titulo, datos, onClic }) {
  const [tooltip, setTooltip] = useState(null);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    setAnimPct(0);
    const t = setTimeout(() => {
      let pct = 0;
      const interval = setInterval(() => {
        pct += 3;
        setAnimPct(Math.min(pct, 100));
        if (pct >= 100) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, 200);
    return () => clearTimeout(t);
  }, [datos]);

  if (!datos.length) return (
    <div className="card" style={{padding:24}}>
      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:12}}>{titulo}</div>
      <div style={{textAlign:'center',padding:40,color:'#718096'}}>Sin datos</div>
    </div>
  );

  const maxVal = Math.max(...datos.map(d => d.tomados + d.disponibles), 1);

  return (
    <div className="card" style={{padding:24}}>
      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:20}}>{titulo}</div>
      <div style={{display:'flex',alignItems:'flex-end',gap:12,height:200,paddingBottom:32,position:'relative'}}>
        {/* Líneas guía */}
        {[0,25,50,75,100].map(p=>(
          <div key={p} style={{position:'absolute',left:0,right:0,bottom:`${32+p*1.68}px`,borderTop:'1px dashed rgba(107,15,43,0.1)',zIndex:0}}/>
        ))}
        {datos.map((d,i) => {
          const total = d.tomados + d.disponibles;
          const pctTom = (d.tomados / maxVal) * 160 * (animPct/100);
          const pctDis = (d.disponibles / maxVal) * 160 * (animPct/100);
          return (
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,position:'relative',zIndex:1}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:3,height:168}}>
                {/* Barra tomados */}
                <div style={{position:'relative'}} onMouseEnter={()=>setTooltip({...d,i})} onMouseLeave={()=>setTooltip(null)}>
                  <div style={{
                    width:22,height:pctTom,
                    background:'linear-gradient(180deg,#9B1540,#6B0F2B)',
                    borderRadius:'4px 4px 0 0',
                    transition:'height 0.05s',
                    cursor:'pointer',
                    boxShadow:'4px 4px 0 rgba(107,15,43,0.3)',
                    position:'relative',
                  }}>
                    {/* Cara superior 3D */}
                    <div style={{position:'absolute',top:-6,left:0,width:22,height:6,background:'#B8244A',transform:'skewX(-45deg) translateX(3px)',borderRadius:'2px 2px 0 0'}}/>
                    <div style={{position:'absolute',top:-6,right:-6,width:6,height:'calc(100% + 6px)',background:'rgba(0,0,0,0.2)',transform:'skewY(-45deg) translateY(3px)'}}/>
                  </div>
                </div>
                {/* Barra disponibles */}
                <div style={{position:'relative'}} onMouseEnter={()=>setTooltip({...d,i})} onMouseLeave={()=>setTooltip(null)}>
                  <div style={{
                    width:22,height:pctDis,
                    background:'linear-gradient(180deg,#D4A84C,#C9A84C)',
                    borderRadius:'4px 4px 0 0',
                    transition:'height 0.05s',
                    cursor:'pointer',
                    boxShadow:'4px 4px 0 rgba(201,168,76,0.3)',
                    position:'relative',
                  }}>
                    <div style={{position:'absolute',top:-6,left:0,width:22,height:6,background:'#E8C060',transform:'skewX(-45deg) translateX(3px)',borderRadius:'2px 2px 0 0'}}/>
                    <div style={{position:'absolute',top:-6,right:-6,width:6,height:'calc(100% + 6px)',background:'rgba(0,0,0,0.15)',transform:'skewY(-45deg) translateY(3px)'}}/>
                  </div>
                </div>
              </div>
              <div style={{fontSize:9,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#718096',textAlign:'center',lineHeight:1.2,maxWidth:60,wordBreak:'break-word'}}>{d.label}</div>
            </div>
          );
        })}
      </div>
      {/* Leyenda */}
      <div style={{display:'flex',gap:20,justifyContent:'center',marginTop:8}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:14,height:14,background:'#6B0F2B',borderRadius:3}}/><span style={{fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#4A5568'}}>Días tomados</span></div>
        <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:14,height:14,background:'#C9A84C',borderRadius:3}}/><span style={{fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#4A5568'}}>Días disponibles</span></div>
      </div>
      {/* Tooltip */}
      {tooltip && (
        <div style={{position:'absolute',background:'#1a1a2e',color:'#fff',padding:'10px 14px',borderRadius:10,fontSize:12,fontFamily:'Montserrat,sans-serif',boxShadow:'0 8px 24px rgba(0,0,0,0.3)',zIndex:100,pointerEvents:'none',whiteSpace:'nowrap'}}>
          <div style={{fontWeight:800,marginBottom:4}}>{tooltip.label}</div>
          <div style={{color:'#C9A84C'}}>⏱️ Tomados: <strong>{tooltip.tomados}</strong> días</div>
          <div style={{color:'#66BB6A'}}>✅ Disponibles: <strong>{tooltip.disponibles}</strong> días</div>
          <div style={{color:'rgba(255,255,255,0.5)',marginTop:4,fontSize:10}}>Total: {tooltip.tomados+tooltip.disponibles} días</div>
        </div>
      )}
    </div>
  );
}

// ── Gráfica Barras Horizontales 3D ────────────────────────
function GraficaBarrasH3D({ titulo, datos }) {
  const [tooltip, setTooltip] = useState(null);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    setAnimPct(0);
    const t = setTimeout(() => {
      let pct = 0;
      const interval = setInterval(() => {
        pct += 3;
        setAnimPct(Math.min(pct, 100));
        if (pct >= 100) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(t);
  }, [datos]);

  const maxVal = Math.max(...datos.map(d => d.tomados + d.disponibles), 1);

  if (!datos.length) return (
    <div className="card" style={{padding:24}}>
      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:12}}>{titulo}</div>
      <div style={{textAlign:'center',padding:40,color:'#718096'}}>Sin datos</div>
    </div>
  );

  return (
    <div className="card" style={{padding:24,position:'relative'}}>
      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:20}}>{titulo}</div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {datos.map((d,i)=>{
          const total = d.tomados + d.disponibles;
          const pctTom = (d.tomados / maxVal) * 100 * (animPct/100);
          const pctDis = (d.disponibles / maxVal) * 100 * (animPct/100);
          return (
            <div key={i} onMouseEnter={()=>setTooltip({...d,i})} onMouseLeave={()=>setTooltip(null)} style={{cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:12,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#1a1a2e'}}>{d.label}</span>
                <span style={{fontSize:11,fontFamily:'Montserrat,sans-serif',color:'#718096'}}>{d.tomados}T · {d.disponibles}D</span>
              </div>
              <div style={{height:22,background:'#f0f0f0',borderRadius:6,overflow:'visible',position:'relative',display:'flex'}}>
                {/* Barra tomados */}
                <div style={{
                  width:`${pctTom}%`,height:'100%',
                  background:'linear-gradient(90deg,#6B0F2B,#9B1540)',
                  borderRadius:'6px 0 0 6px',
                  transition:'width 0.05s',
                  position:'relative',
                  boxShadow:'0 4px 8px rgba(107,15,43,0.3)',
                }}>
                  {/* Brillo 3D */}
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'rgba(255,255,255,0.15)',borderRadius:'6px 0 0 0'}}/>
                  {/* Cara inferior 3D */}
                  <div style={{position:'absolute',bottom:-4,left:0,right:0,height:4,background:'rgba(107,15,43,0.5)',transform:'skewX(0deg)',borderRadius:'0 0 2px 2px'}}/>
                </div>
                {/* Barra disponibles */}
                <div style={{
                  width:`${pctDis}%`,height:'100%',
                  background:'linear-gradient(90deg,#C9A84C,#E8C060)',
                  transition:'width 0.05s',
                  position:'relative',
                  boxShadow:'0 4px 8px rgba(201,168,76,0.3)',
                }}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'rgba(255,255,255,0.2)'}}/>
                  <div style={{position:'absolute',bottom:-4,left:0,right:0,height:4,background:'rgba(201,168,76,0.5)',borderRadius:'0 0 2px 2px'}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:20,justifyContent:'center',marginTop:16}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:14,height:10,background:'#6B0F2B',borderRadius:3}}/><span style={{fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#4A5568'}}>Días tomados</span></div>
        <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:14,height:10,background:'#C9A84C',borderRadius:3}}/><span style={{fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#4A5568'}}>Días disponibles</span></div>
      </div>
      {tooltip && (
        <div style={{position:'absolute',right:16,top:60,background:'#1a1a2e',color:'#fff',padding:'10px 14px',borderRadius:10,fontSize:12,fontFamily:'Montserrat,sans-serif',boxShadow:'0 8px 24px rgba(0,0,0,0.3)',zIndex:100}}>
          <div style={{fontWeight:800,marginBottom:4,color:'#C9A84C'}}>{tooltip.label}</div>
          <div>⏱️ Tomados: <strong>{tooltip.tomados}</strong> días</div>
          <div>✅ Disponibles: <strong>{tooltip.disponibles}</strong> días</div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',marginTop:6,paddingTop:6,color:'rgba(255,255,255,0.5)',fontSize:10}}>Total: {tooltip.tomados+tooltip.disponibles} días</div>
        </div>
      )}
    </div>
  );
}

// ── Gráfica Donut 3D ──────────────────────────────────────
function GraficaDonut3D({ titulo, datos }) {
  const [hover, setHover] = useState(null);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    setAnimPct(0);
    const t = setTimeout(() => {
      let pct = 0;
      const iv = setInterval(() => {
        pct = Math.min(pct + 2, 100);
        setAnimPct(pct);
        if (pct >= 100) clearInterval(iv);
      }, 14);
      return () => clearInterval(iv);
    }, 150);
    return () => clearTimeout(t);
  }, [datos]);

  const total = datos.reduce((s,d)=>s+(d.valor||0),0)||1;
  const SIZE = 180, CX = 90, CY = 90, R_OUT = 70, R_IN = 38, DEPTH = 10;

  const getCoords = (angle, r) => ({
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  });

  const slices = [];
  let a = -Math.PI / 2;
  datos.forEach((d,i) => {
    const span = (d.valor / total) * 2 * Math.PI * (animPct/100);
    slices.push({ ...d, a1:a, a2:a+span, i });
    a += span;
  });

  const arcPath = (cx, cy, r1, r2, a1, a2) => {
    if (Math.abs(a2-a1) < 0.001) return '';
    const large = a2-a1 > Math.PI ? 1 : 0;
    const p1 = getCoords(a1, r1); p1.x += cx-CX; p1.y += cy-CY;
    const p2 = getCoords(a2, r1); p2.x += cx-CX; p2.y += cy-CY;
    const p3 = getCoords(a2, r2); p3.x += cx-CX; p3.y += cy-CY;
    const p4 = getCoords(a1, r2); p4.x += cx-CX; p4.y += cy-CY;
    return `M${p1.x},${p1.y} A${r1},${r1} 0 ${large} 1 ${p2.x},${p2.y} L${p3.x},${p3.y} A${r2},${r2} 0 ${large} 0 ${p4.x},${p4.y} Z`;
  };

  return (
    <div className="card" style={{padding:24}}>
      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16}}>{titulo}</div>
      <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
        <svg width={SIZE} height={SIZE+DEPTH} style={{flexShrink:0,filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'}}>
          {/* Sombra 3D */}
          {slices.map((s,i) => (
            <path key={`d${i}`}
              d={arcPath(CX, CY+DEPTH, R_OUT, R_IN, s.a1, s.a2)}
              fill={s.color} opacity="0.25"/>
          ))}
          {/* Slices principales */}
          {slices.map((s,i) => {
            const mid = (s.a1+s.a2)/2;
            const off = hover===i ? 8 : 0;
            const ox = Math.cos(mid)*off, oy = Math.sin(mid)*off;
            return (
              <path key={i}
                d={arcPath(CX+ox, CY+oy, R_OUT+(hover===i?6:0), R_IN, s.a1, s.a2)}
                fill={s.color}
                style={{cursor:'pointer',transition:'all 0.2s',filter:hover===i?`drop-shadow(0 0 10px ${s.color})`:'none'}}
                onMouseEnter={()=>setHover(i)}
                onMouseLeave={()=>setHover(null)}
              />
            );
          })}
          {/* Centro blanco */}
          <circle cx={CX} cy={CY} r={R_IN-2} fill="white"/>
          <text x={CX} y={CY-5} textAnchor="middle" fontSize="18" fontWeight="900" fontFamily="Montserrat" fill="#1a1a2e">{total}</text>
          <text x={CX} y={CY+12} textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Montserrat" fill="#718096">TOTAL</text>
        </svg>

        {/* Leyenda */}
        <div style={{flex:1,minWidth:120,display:'flex',flexDirection:'column',gap:8}}>
          {datos.map((d,i) => {
            const pct = Math.round((d.valor||0)/total*100);
            return (
              <div key={i}
                onMouseEnter={()=>setHover(i)}
                onMouseLeave={()=>setHover(null)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:10,background:hover===i?`${d.color}15`:'#f7f8fc',border:`1.5px solid ${hover===i?d.color+'50':'transparent'}`,cursor:'pointer',transition:'all 0.2s'}}>
                <div style={{width:14,height:14,borderRadius:4,background:d.color,flexShrink:0,boxShadow:`0 2px 6px ${d.color}60`}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:800,color:'#1a1a2e',fontFamily:'Montserrat,sans-serif'}}>{d.label}</div>
                  <div style={{fontSize:10,color:'#718096'}}>{d.valor} · {pct}%</div>
                </div>
                <div style={{fontSize:18,fontWeight:900,color:d.color,fontFamily:'Playfair Display,serif'}}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Gráfica Línea animada ─────────────────────────────────
function GraficaLinea({ titulo, datos, meses }) {
  const [tooltip, setTooltip] = useState(null);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    setAnimPct(0);
    const t = setTimeout(() => {
      let pct = 0;
      const interval = setInterval(() => {
        pct += 2;
        setAnimPct(Math.min(pct, 100));
        if (pct >= 100) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, 200);
    return () => clearTimeout(t);
  }, [datos]);

  const W = 700, H = 180, PL = 40, PR = 20, PT = 20, PB = 40;
  const maxV = Math.max(...datos, 1);
  const stepX = (W - PL - PR) / (meses.length - 1);

  const pts = datos.map((v,i) => ({
    x: PL + i * stepX,
    y: H - PB - ((v / maxV) * (H - PT - PB)) * (animPct/100),
    v,
  }));

  const pathD = pts.map((p,i) => i===0?`M${p.x},${p.y}`:`C${pts[i-1].x+stepX*0.4},${pts[i-1].y} ${p.x-stepX*0.4},${p.y} ${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length-1].x},${H-PB} L${pts[0].x},${H-PB} Z`;

  return (
    <div>
      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16}}>{titulo}</div>
      <div style={{overflowX:'auto'}}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{minWidth:300}}>
          {/* Grid */}
          {[0,25,50,75,100].map(p=>{
            const y = H - PB - (p/100)*(H-PT-PB);
            return <g key={p}>
              <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="rgba(107,15,43,0.08)" strokeWidth="1" strokeDasharray="4"/>
              <text x={PL-6} y={y+4} fontSize="9" fill="#718096" textAnchor="end" fontFamily="Montserrat">{Math.round(maxV*p/100)}</text>
            </g>;
          })}

          {/* Área */}
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6B0F2B" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#6B0F2B" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#lineGrad)"/>
          <path d={pathD} fill="none" stroke="#6B0F2B" strokeWidth="3" strokeLinecap="round" style={{filter:'drop-shadow(0 2px 8px rgba(107,15,43,0.4))'}}/>

          {/* Puntos */}
          {pts.map((p,i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={tooltip?.i===i?8:5} fill="#C9A84C" stroke="#fff" strokeWidth="2"
                style={{cursor:'pointer',filter:'drop-shadow(0 2px 6px rgba(201,168,76,0.5))',transition:'r 0.2s'}}
                onMouseEnter={()=>setTooltip({...p,i,mes:meses[i]})}
                onMouseLeave={()=>setTooltip(null)}/>
              {p.v > 0 && <text x={p.x} y={p.y-12} fontSize="10" fontWeight="800" fill="#6B0F2B" textAnchor="middle" fontFamily="Montserrat">{p.v}</text>}
              <text x={p.x} y={H-PB+16} fontSize="9" fill="#718096" textAnchor="middle" fontFamily="Montserrat">{meses[i]}</text>
            </g>
          ))}

          {/* Tooltip */}
          {tooltip && tooltip.v > 0 && (
            <g>
              <rect x={tooltip.x-50} y={tooltip.y-52} width={100} height={40} rx="8" fill="#1a1a2e"/>
              <text x={tooltip.x} y={tooltip.y-36} fontSize="11" fontWeight="800" fill="#C9A84C" textAnchor="middle" fontFamily="Montserrat">{tooltip.mes}</text>
              <text x={tooltip.x} y={tooltip.y-20} fontSize="10" fill="#fff" textAnchor="middle" fontFamily="Montserrat">{tooltip.v} días aprobados</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
