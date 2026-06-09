import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [cargando, setCargando] = useState(true);
  const [busquedaPersona, setBusquedaPersona] = useState('');

  const cargar = () => {
    setCargando(true);
    Promise.all([
      api.get(`/api/reportes/resumen?anio=${anio}`),
      api.get(`/api/reportes/empleados-detalle?anio=${anio}`),
    ]).then(([r, d]) => {
      setResumen(r.data);
      setDetalle(d.data);
    }).catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [anio]);

  const detalleFiltrado = detalle.filter(e => {
    if (!busquedaPersona) return true;
    const nombre = `${e.apellido_paterno} ${e.nombre} ${e.apellido_materno || ''}`.toLowerCase();
    return nombre.includes(busquedaPersona.toLowerCase()) ||
      (e.numero_empleado || '').toLowerCase().includes(busquedaPersona.toLowerCase());
  });

  const exportarPDF = async () => {
    const doc = new jsPDF();
    const guinda = [107, 15, 43];
    const dorado = [201, 168, 76];

    // Logo SITT
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/vacaciones-frontend/escudo-sitt.png';
      await new Promise((res) => { img.onload = res; img.onerror = res; });
      doc.addImage(img, 'PNG', 14, 8, 22, 22);
    } catch(e) {}

    // Header
    doc.setFillColor(...guinda);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(15); doc.setFont('helvetica','bold');
    doc.text('H. XXV Ayuntamiento de Tijuana', 42, 13);
    doc.setFontSize(10);
    doc.text('SITT — Sistema Integral de Transporte de Tijuana', 42, 21);
    doc.setFontSize(9);
    doc.text(`Reporte de Vacaciones ${anio} · Generado: ${new Date().toLocaleDateString('es-MX',{dateStyle:'full'})}`, 42, 29);

    // Línea dorada
    doc.setFillColor(...dorado);
    doc.rect(0, 36, 210, 2, 'F');

    const tot = resumen?.totales || {};
    doc.setTextColor(0,0,0);
    doc.setFontSize(12); doc.setFont('helvetica','bold');
    doc.text('Resumen General', 14, 50);

    doc.autoTable({
      startY: 54,
      head: [['Indicador','Valor']],
      body: [
        ['Total empleados activos', tot.total_empleados || 0],
        ['Días asignados', tot.total_dias_asignados || 0],
        ['Días tomados', tot.total_dias_tomados || 0],
        ['Días disponibles', tot.total_dias_disponibles || 0],
        ['Solicitudes pendientes', tot.solicitudes_pendientes || 0],
        ['Solicitudes aprobadas', tot.solicitudes_aprobadas || 0],
      ],
      headStyles: { fillColor: guinda, textColor: [255,255,255], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
      styles: { fontSize: 10 },
    });

    if (detalleFiltrado.length) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Empleado','Departamento','Puesto','Corresponden','Tomados','Disponibles']],
        body: detalleFiltrado.map(e => [
          `${e.apellido_paterno} ${e.nombre}`,
          e.departamento || '—',
          e.puesto || '—',
          e.dias_correspondientes,
          e.dias_tomados,
          e.dias_disponibles,
        ]),
        headStyles: { fillColor: guinda, textColor: [255,255,255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248,245,245] },
        styles: { fontSize: 9 },
      });
    }

    // Footer en cada página
    const pags = doc.getNumberOfPages();
    for (let i = 1; i <= pags; i++) {
      doc.setPage(i);
      doc.setFillColor(...guinda);
      doc.rect(0, 286, 210, 12, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(8);
      doc.text(`Sistema de Control de Vacaciones SITT · Página ${i} de ${pags}`, 14, 293);
      doc.setFillColor(...dorado);
      doc.rect(0, 284, 210, 2, 'F');
    }

    doc.save(`Reporte_Vacaciones_SITT_${anio}${busquedaPersona ? '_'+busquedaPersona : ''}.pdf`);
  };

  if (cargando) return <div className="loader-wrapper"><div className="loader" /></div>;
  if (!resumen) return null;

  const tot = resumen.totales;

  const chartOpts = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 11 }, color: '#6B0F2B' } }
    },
    scales: {
      x: { ticks: { font: { family: 'Inter', size: 11 } } },
      y: { ticks: { font: { family: 'Inter', size: 11 } } },
    }
  };

  const dataBarDepto = {
    labels: resumen.por_departamento.map(d => d.departamento),
    datasets: [
      { label: 'Días Tomados', data: resumen.por_departamento.map(d => d.dias_tomados), backgroundColor: 'rgba(107,15,43,0.8)', borderRadius: 6 },
      { label: 'Días Disponibles', data: resumen.por_departamento.map(d => d.dias_disponibles), backgroundColor: 'rgba(201,168,76,0.8)', borderRadius: 6 },
    ],
  };

  const dataDonut = {
    labels: ['Días Tomados', 'Días Disponibles'],
    datasets: [{
      data: [tot.total_dias_tomados, tot.total_dias_disponibles],
      backgroundColor: ['rgba(107,15,43,0.85)', 'rgba(201,168,76,0.85)'],
      borderColor: ['#6B0F2B', '#C9A84C'],
      borderWidth: 2,
    }],
  };

  const mesesData = Array(12).fill(0);
  resumen.solicitudes_por_mes.forEach(m => { mesesData[parseInt(m.mes) - 1] = parseInt(m.dias || 0); });

  const dataLine = {
    labels: MESES,
    datasets: [{
      label: 'Días Aprobados',
      data: mesesData,
      borderColor: '#6B0F2B',
      backgroundColor: 'rgba(107,15,43,0.08)',
      fill: true, tension: 0.4,
      pointBackgroundColor: '#C9A84C', pointRadius: 5, pointBorderWidth: 2,
    }],
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Reportes</h2>
        <div style={{ display:'flex',gap:12,alignItems:'center',flexWrap:'wrap' }}>
          <select className="form-control" style={{ width:110 }} value={anio} onChange={e=>setAnio(parseInt(e.target.value))}>
            {[2023,2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn-institucional filled" onClick={exportarPDF}>📄 Exportar PDF</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        {[
          { label:'Total empleados', value:tot.total_empleados, icon:'👥', clase:'' },
          { label:'Días tomados', value:tot.total_dias_tomados, icon:'📅', clase:'dorado' },
          { label:'Días disponibles', value:tot.total_dias_disponibles, icon:'✅', clase:'verde' },
          { label:'Solicitudes pendientes', value:tot.solicitudes_pendientes, icon:'⏳', clase:'' },
        ].map(({ label,value,icon,clase })=>(
          <div key={label} className={`card kpi-card ${clase}`} data-icon={icon}>
            <div style={{ fontSize:26 }}>{icon}</div>
            <div className="kpi-value">{value||0}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid-2" style={{ marginBottom:28 }}>
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16 }}>📊 Por Departamento</h3>
          {resumen.por_departamento.length > 0
            ? <Bar data={dataBarDepto} options={chartOpts} />
            : <p style={{ textAlign:'center',color:'var(--g60)',padding:40 }}>Sin datos</p>
          }
        </div>
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16 }}>🍩 Uso General</h3>
          <div style={{ maxWidth:280,margin:'0 auto' }}>
            <Doughnut data={dataDonut} options={{ ...chartOpts, scales: undefined }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:28 }}>
        <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)',marginBottom:16 }}>
          📈 Días Aprobados por Mes — {anio}
        </h3>
        <Line data={dataLine} options={chartOpts} />
      </div>

      {/* Tabla detalle con filtro por persona */}
      <div className="card">
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:12 }}>
          <h3 style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'var(--g)' }}>
            👥 Detalle por Empleado
          </h3>
          {/* Filtro por persona */}
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <input
              className="form-control"
              style={{ width:240 }}
              placeholder="🔍 Filtrar por nombre..."
              value={busquedaPersona}
              onChange={e=>setBusquedaPersona(e.target.value)}
            />
            {busquedaPersona && (
              <button className="btn-institucional btn-sm" onClick={()=>setBusquedaPersona('')}>✕ Limpiar</button>
            )}
          </div>
        </div>

        {detalleFiltrado.length === 0 ? (
          <p style={{ textAlign:'center',padding:40,color:'var(--g60)' }}>Sin resultados para "{busquedaPersona}"</p>
        ) : (
          <div className="tabla-wrapper">
            <table>
              <thead>
                <tr><th>Empleado</th><th>Departamento</th><th>Puesto</th><th>Corresponden</th><th>Tomados</th><th>Disponibles</th></tr>
              </thead>
              <tbody>
                {detalleFiltrado.map((e,i)=>(
                  <tr key={i}>
                    <td><strong>{e.apellido_paterno} {e.nombre}</strong></td>
                    <td style={{ fontSize:12 }}>{e.departamento||'—'}</td>
                    <td style={{ fontSize:12 }}>{e.puesto||'—'}</td>
                    <td style={{ textAlign:'center' }}>{e.dias_correspondientes}</td>
                    <td style={{ textAlign:'center' }}>{e.dias_tomados}</td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,color:e.dias_disponibles<=2?'#c0392b':e.dias_disponibles<=5?'var(--d-dk)':'var(--g)',fontSize:16 }}>
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
    </div>
  );
}
