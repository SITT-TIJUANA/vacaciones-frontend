import { useState, useEffect, useRef } from 'react';
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

  const exportarPDF = () => {
    const doc = new jsPDF();
    const guinda = [107, 15, 43];

    // Header
    doc.setFillColor(...guinda);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('H. XXV Ayuntamiento de Tijuana', 14, 14);
    doc.setFontSize(11);
    doc.text('SITT — Reporte de Vacaciones ' + anio, 14, 24);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'full' })}`, 14, 31);

    // KPIs
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen General', 14, 48);

    const tot = resumen?.totales || {};
    doc.autoTable({
      startY: 52,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total empleados', tot.total_empleados || 0],
        ['Días asignados', tot.total_dias_asignados || 0],
        ['Días tomados', tot.total_dias_tomados || 0],
        ['Días disponibles', tot.total_dias_disponibles || 0],
        ['Solicitudes pendientes', tot.solicitudes_pendientes || 0],
        ['Solicitudes aprobadas', tot.solicitudes_aprobadas || 0],
      ],
      headStyles: { fillColor: guinda },
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    });

    // Tabla de empleados
    if (detalle.length) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 12,
        head: [['Empleado', 'Departamento', 'Puesto', 'Correspondientes', 'Tomados', 'Disponibles']],
        body: detalle.map(e => [
          `${e.apellido_paterno} ${e.nombre}`,
          e.departamento || '—',
          e.puesto || '—',
          e.dias_correspondientes,
          e.dias_tomados,
          e.dias_disponibles,
        ]),
        headStyles: { fillColor: guinda },
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 245, 245] },
      });
    }

    // Footer
    const pags = doc.getNumberOfPages();
    for (let i = 1; i <= pags; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pags} — Sistema de Control de Vacaciones SITT`, 14, 290);
    }

    doc.save(`Reporte_Vacaciones_${anio}.pdf`);
  };

  if (cargando) return <div className="loader-wrapper"><div className="loader" /></div>;
  if (!resumen) return null;

  const tot = resumen.totales;

  // Datos para gráficas
  const dataBarDepto = {
    labels: resumen.por_departamento.map(d => d.departamento),
    datasets: [
      { label: 'Días Tomados', data: resumen.por_departamento.map(d => d.dias_tomados), backgroundColor: 'rgba(107,15,43,0.8)' },
      { label: 'Días Disponibles', data: resumen.por_departamento.map(d => d.dias_disponibles), backgroundColor: 'rgba(201,168,76,0.8)' },
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
      label: 'Días de Vacaciones Aprobados',
      data: mesesData,
      borderColor: '#6B0F2B',
      backgroundColor: 'rgba(107,15,43,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#C9A84C',
      pointRadius: 5,
    }],
  };

  const chartOpts = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 11 } } } },
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Reportes y Estadísticas</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-control" style={{ width: 100 }} value={anio} onChange={e => setAnio(parseInt(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn-institucional filled" onClick={exportarPDF}>
            📄 Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total empleados', value: tot.total_empleados, icon: '👥' },
          { label: 'Días tomados', value: tot.total_dias_tomados, icon: '📅', clase: 'dorado' },
          { label: 'Días disponibles', value: tot.total_dias_disponibles, icon: '✅' },
          { label: 'Solicitudes pendientes', value: tot.solicitudes_pendientes, icon: '⏳' },
        ].map(({ label, value, icon, clase }) => (
          <div key={label} className={`card kpi-card ${clase || ''}`}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div className="kpi-value">{value || 0}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 14, color: 'var(--guinda)', marginBottom: 16 }}>
            📊 Días por Departamento
          </h3>
          {resumen.por_departamento.length > 0
            ? <Bar data={dataBarDepto} options={chartOpts} />
            : <p style={{ textAlign: 'center', color: 'var(--gris-texto)', padding: 40 }}>Sin datos</p>
          }
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 14, color: 'var(--guinda)', marginBottom: 16 }}>
            🍩 Uso General de Vacaciones
          </h3>
          <div style={{ maxWidth: 280, margin: '0 auto' }}>
            <Doughnut data={dataDonut} options={chartOpts} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 14, color: 'var(--guinda)', marginBottom: 16 }}>
          📈 Días de Vacaciones Aprobados por Mes — {anio}
        </h3>
        <Line data={dataLine} options={chartOpts} />
      </div>

      {/* Tabla detalle */}
      <div className="card">
        <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 14, color: 'var(--guinda)', marginBottom: 16 }}>
          👥 Detalle por Empleado
        </h3>
        <div className="tabla-wrapper">
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Puesto</th>
                <th>Corresponden</th>
                <th>Tomados</th>
                <th>Disponibles</th>
              </tr>
            </thead>
            <tbody>
              {detalle.map((e, i) => (
                <tr key={i}>
                  <td><strong>{e.apellido_paterno} {e.nombre}</strong></td>
                  <td style={{ fontSize: 12 }}>{e.departamento || '—'}</td>
                  <td style={{ fontSize: 12 }}>{e.puesto || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{e.dias_correspondientes}</td>
                  <td style={{ textAlign: 'center' }}>{e.dias_tomados}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Montserrat', fontWeight: 800, color: e.dias_disponibles <= 2 ? '#e74c3c' : 'var(--guinda)' }}>
                      {e.dias_disponibles}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
