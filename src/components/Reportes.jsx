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
  const [busqueda, setBusqueda] = useState('');
  const [empleadoFiltro, setEmpleadoFiltro] = useState('');

  const cargar = () => {
    setCargando(true);
    Promise.all([
      api.get(`/api/reportes/resumen?anio=${anio}`),
      api.get(`/api/reportes/empleados-detalle?anio=${anio}`),
    ]).then(([r,d]) => { setResumen(r.data); setDetalle(d.data); })
      .catch(console.error).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [anio]);

  const detalleFiltrado = detalle.filter(e => {
    if (!busqueda) return true;
    return `${e.apellido_paterno} ${e.nombre} ${e.apellido_materno||''}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.numero_empleado||'').toLowerCase().includes(busqueda.toLowerCase());
  });

  // Empleado seleccionado para gráficas individuales
  const empSeleccionado = empleadoFiltro ? detalle.find(e => e.id === empleadoFiltro) : null;

  const exportarPDF = async () => {
    const doc = new jsPDF();
    const guinda = [107,15,43];
    const dorado = [201,168,76];

    // Logo SITT
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = window.location.origin + '/vacaciones-frontend/escudo-sitt.png';
      await new Promise(res => { img.onload = res; img.onerror = res; setTimeout(res, 2000); });
      if (img.complete && img.naturalWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 10, 6, 22, 22);
      }
    } catch(e) {}

    doc.setFillColor(...guinda);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setFillColor(...dorado);
    doc.rect(0, 34, 210, 2, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(15); doc.setFont('helvetica','bold');
    doc.text('H. XXV Ayuntamiento de Tijuana', 38, 13);
    doc.setFontSize(10);
    doc.text('SITT — Sistema Integral de Transporte de Tijuana', 38, 21);
    doc.setFontSize(8);
    doc.text(`Reporte de Vacaciones ${anio}${empSeleccionado?` · ${empSeleccionado.apellido_paterno} ${empSeleccionado.nombre}`:''} · ${new Date().toLocaleDateString('es-MX',{dateStyle:'full'})}`, 38, 29);

    const tot = resumen?.totales || {};
    doc.setTextColor(0,0,0);
    doc.setFontSize(12); doc.setFont('helvetica','bold');
    doc.text(empSeleccionado ? `Reporte Individual: ${empSeleccionado.apellido_paterno} ${empSeleccionado.nombre}` : 'Resumen General', 14, 50);

    if (empSeleccionado) {
      doc.autoTable({
        startY: 54,
        head: [['Dato','Valor']],
        body: [
          ['Nombre completo', `${empSeleccionado.nombre} ${empSeleccionado.apellido_paterno}`],
          ['Departamento', empSeleccionado.departamento||'—'],
          ['Puesto', empSeleccionado.puesto||'—'],
          ['Días correspondientes', empSeleccionado.dias_correspondientes],
          ['Días tomados', empSeleccionado.dias_tomados],
          ['Días disponibles', empSeleccionado.dias_disponibles],
        ],
        headStyles: { fillColor: guinda },
        styles: { fontSize: 10 },
      });
    } else {
      doc.autoTable({
        startY: 54,
        head: [['Indicador','Valor']],
        body: [
          ['Total empleados', tot.total_empleados||0],
          ['Días asignados', tot.total_dias_asignados||0],
          ['Días tomados', tot.total_dias_tomados||0],
          ['Días disponibles', tot.total_dias_disponibles||0],
          ['Solicitudes pendientes', tot.solicitudes_pendientes||0],
          ['Solicitudes aprobadas', tot.solicitudes_aprobadas||0],
        ],
        headStyles: { fillColor: guinda },
        columnStyles: { 1: { halign:'center', fontStyle:'bold' } },
        styles: { fontSize: 10 },
      });
    }

    if (detalleFiltrado.length) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Empleado','Departamento','Puesto','Corresponden','Tomados','Disponibles']],
        body: detalleFiltrado.map(e => [`${e.apellido_paterno} ${e.nombre}`, e.departamento||'—', e.puesto||'—', e.dias_correspondientes, e.dias_tomados, e.dias_disponibles]),
        headStyles: { fillColor: guinda },
        alternateRowStyles: { fillColor: [248,245,245] },
        styles: { fontSize: 9 },
      });
    }

    const pags = doc.getNumberOfPages();
    for (let i=1;i<=pags;i++) {
      doc.setPage(i);
      doc.setFillColor(...guinda);
      doc.rect(0,286,210,12,'F');
      doc.setFillColor(...dorado);
      doc.rect(0,284,210,2,'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(8);
      doc.text(`Sistema de Control de Vacaciones SITT · Página ${i} de ${pags}`, 14, 293);
    }

    doc.save(`Reporte_SITT_${anio}${empSeleccionado?'_'+empSeleccionado.apellido_paterno:''}.pdf`);
  };

  if (cargando) return <div className="loader-wrapper"><div className="loader" /></div>;
  if (!resumen) return null;

  const tot = resumen.totales;
  const chartOpts = {
    responsive: true,
    plugins: { legend: { position:'bottom', labels:{ font:{family:'Montserrat',size:11}, color:'#6B0F2B' } } },
  };

  // Datos gráficas
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

  // Top 5 con más días disponibles
  const top5 = [...detalle].sort((a,b) => b.dias_disponibles - a.dias_disponibles).slice(0,5);
  const dataTop5 = {
    labels: top5.map(e => `${e.apellido_paterno}`),
    datasets: [{ label:'Días Disponibles', data:top5.map(e=>e.dias_disponibles), backgroundColor:'rgba(107,15,43,0.75)', borderRadius:8 }],
  };

  // Solicitudes por estatus
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
        <div style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div className="form-group" style={{ minWidth:120 }}>
            <label>Año</label>
            <select className="form-control" value={anio} onChange={e=>setAnio(parseInt(e.target.value))}>
              {[2023,2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex:1, minWidth:200 }}>
            <label>Filtrar por empleado (gráficas + PDF)</label>
            <select className="form-control" value={empleadoFiltro} onChange={e=>setEmpleadoFiltro(e.target.value)}>
              <option value="">— Todos los empleados —</option>
              {detalle.map(e=><option key={e.id} value={e.id}>{e.apellido_paterno} {e.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex:1, minWidth:200 }}>
            <label>Buscar en tabla</label>
            <input className="form-control" placeholder="Nombre o número..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          </div>
          <button className="btn-institucional filled" onClick={exportarPDF}>
            📄 {empSeleccionado ? `PDF de ${empSeleccionado.apellido_paterno}` : 'Exportar PDF'}
          </button>
          {(busqueda || empleadoFiltro) && (
            <button className="btn-institucional btn-sm" onClick={()=>{setBusqueda('');setEmpleadoFiltro('');}}>✕ Limpiar</button>
          )}
        </div>
        {empSeleccionado && (
          <div style={{ marginTop:14, padding:'10px 14px', background:'var(--g-soft)', borderRadius:10, border:'1px solid rgba(107,15,43,0.15)', display:'flex', alignItems:'center', gap:12 }}>
            {empSeleccionado.foto_url && <img src={empSeleccionado.foto_url} alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--g)' }} />}
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'var(--g)' }}>
                Viendo: {empSeleccionado.apellido_paterno} {empSeleccionado.nombre}
              </div>
              <div style={{ fontSize:11, color:'var(--g60)' }}>
                {empSeleccionado.dias_correspondientes} correspondientes · {empSeleccionado.dias_tomados} tomados · <strong style={{ color:'var(--g)' }}>{empSeleccionado.dias_disponibles} disponibles</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        {[
          { label:'Total empleados', value: empSeleccionado ? 1 : tot.total_empleados, icon:'👥', clase:'' },
          { label:'Días tomados', value: empSeleccionado ? empSeleccionado.dias_tomados : tot.total_dias_tomados, icon:'📅', clase:'dorado' },
          { label:'Días disponibles', value: empSeleccionado ? empSeleccionado.dias_disponibles : tot.total_dias_disponibles, icon:'✅', clase:'verde' },
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
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)', marginBottom:16 }}>📊 Por Departamento</h3>
          {resumen.por_departamento.length > 0 ? <Bar data={dataBarDepto} options={chartOpts} /> : <p style={{ textAlign:'center', color:'var(--g60)', padding:40 }}>Sin datos</p>}
        </div>
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)', marginBottom:16 }}>🍩 Uso General de Vacaciones</h3>
          <div style={{ maxWidth:260, margin:'0 auto' }}>
            <Doughnut data={dataDonut} options={{ ...chartOpts, scales:undefined }} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom:28 }}>
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)', marginBottom:16 }}>🏆 Top 5 — Más Días Disponibles</h3>
          {top5.length > 0 ? <Bar data={dataTop5} options={{ ...chartOpts, indexAxis:'y' }} /> : <p style={{ textAlign:'center', color:'var(--g60)', padding:40 }}>Sin datos</p>}
        </div>
        <div className="card">
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)', marginBottom:16 }}>📋 Solicitudes por Estatus</h3>
          <div style={{ maxWidth:260, margin:'0 auto' }}>
            <Doughnut data={dataSolicitudes} options={{ ...chartOpts, scales:undefined }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:28 }}>
        <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)', marginBottom:16 }}>📈 Días Aprobados por Mes — {anio}</h3>
        <Line data={dataLine} options={chartOpts} />
      </div>

      {/* Tabla detalle */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:12 }}>
          <h3 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'var(--g)' }}>
            👥 Detalle por Empleado {busqueda && <span style={{ fontSize:12, color:'var(--g60)', fontWeight:500 }}>— "{busqueda}"</span>}
          </h3>
          <span style={{ fontSize:12, color:'var(--g60)', fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>{detalleFiltrado.length} resultado{detalleFiltrado.length!==1?'s':''}</span>
        </div>
        {detalleFiltrado.length === 0 ? (
          <p style={{ textAlign:'center', padding:40, color:'var(--g60)' }}>Sin resultados para "{busqueda}"</p>
        ) : (
          <div className="tabla-wrapper">
            <table>
              <thead><tr><th>Empleado</th><th>Departamento</th><th>Puesto</th><th>Corresponden</th><th>Tomados</th><th>Disponibles</th></tr></thead>
              <tbody>
                {detalleFiltrado.map((e,i)=>(
                  <tr key={i} style={{ background: empleadoFiltro === e.id ? 'var(--g-soft)' : undefined }}>
                    <td><strong>{e.apellido_paterno} {e.nombre}</strong></td>
                    <td style={{ fontSize:12 }}>{e.departamento||'—'}</td>
                    <td style={{ fontSize:12 }}>{e.puesto||'—'}</td>
                    <td style={{ textAlign:'center' }}>{e.dias_correspondientes}</td>
                    <td style={{ textAlign:'center' }}>{e.dias_tomados}</td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, color:e.dias_disponibles<=2?'#c0392b':e.dias_disponibles<=5?'var(--d-dk)':'var(--g)', fontSize:16 }}>
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
