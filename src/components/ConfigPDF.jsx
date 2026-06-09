import { useState } from 'react';

const COLORES_PRESET = [
  { nombre: 'Guinda SITT', primario: '#6B0F2B', secundario: '#C9A84C' },
  { nombre: 'Azul Institucional', primario: '#1565C0', secundario: '#F9A825' },
  { nombre: 'Verde Gobierno', primario: '#1B5E20', secundario: '#C9A84C' },
  { nombre: 'Gris Formal', primario: '#37474F', secundario: '#B0BEC5' },
  { nombre: 'Negro Elegante', primario: '#212121', secundario: '#C9A84C' },
];

export default function ConfigPDF({ onGenerar, onCerrar, empSeleccionado }) {
  const [config, setConfig] = useState({
    // Encabezado
    titulo: 'Reporte de Vacaciones',
    subtitulo: 'H. XXV Ayuntamiento de Tijuana — SITT',
    institucion: 'Sistema Integral de Transporte de Tijuana',
    // Contenido
    incluirFoto: true,
    incluirKPIs: true,
    incluirTabla: true,
    incluirDepartamentos: true,
    // Firmas
    incluirFirmas: true,
    firmas: [
      { nombre: '', puesto: 'Director General', etiqueta: 'Vo. Bo.' },
      { nombre: '', puesto: 'Jefe de Recursos Humanos', etiqueta: 'Elaboró' },
    ],
    // Notas
    notaFinal: '',
    // Colores
    colorPrimario: '#6B0F2B',
    colorSecundario: '#C9A84C',
    presetIdx: 0,
  });

  const set = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const updateFirma = (i, key, val) => {
    const firmas = [...config.firmas];
    firmas[i] = { ...firmas[i], [key]: val };
    setConfig(c => ({ ...c, firmas }));
  };

  const agregarFirma = () => {
    if (config.firmas.length >= 4) return;
    setConfig(c => ({ ...c, firmas: [...c.firmas, { nombre: '', puesto: '', etiqueta: 'Firma' }] }));
  };

  const eliminarFirma = (i) => {
    setConfig(c => ({ ...c, firmas: c.firmas.filter((_, j) => j !== i) }));
  };

  const aplicarPreset = (idx) => {
    const p = COLORES_PRESET[idx];
    setConfig(c => ({ ...c, presetIdx: idx, colorPrimario: p.primario, colorSecundario: p.secundario }));
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return [r,g,b];
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal modal-lg" onClick={e=>e.stopPropagation()} style={{ maxHeight:'90vh' }}>
        <div className="modal-header">
          <h2>⚙️ Personalizar Reporte PDF</h2>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>

        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:24 }}>

          {/* ── ENCABEZADO ── */}
          <section>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14, paddingBottom:8, borderBottom:'2px solid var(--g-soft)' }}>
              📄 Encabezado del Documento
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Título principal</label>
                <input className="form-control" value={config.titulo} onChange={e=>set('titulo',e.target.value)} placeholder="Reporte de Vacaciones" />
              </div>
              <div className="form-group">
                <label>Subtítulo</label>
                <input className="form-control" value={config.subtitulo} onChange={e=>set('subtitulo',e.target.value)} placeholder="H. XXV Ayuntamiento de Tijuana" />
              </div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label>Nombre de la institución</label>
                <input className="form-control" value={config.institucion} onChange={e=>set('institucion',e.target.value)} placeholder="Sistema Integral de Transporte de Tijuana" />
              </div>
            </div>
          </section>

          {/* ── CONTENIDO ── */}
          <section>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14, paddingBottom:8, borderBottom:'2px solid var(--g-soft)' }}>
              📋 Contenido a incluir
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { key:'incluirKPIs', label:'📊 Resumen ejecutivo (KPIs)' },
                { key:'incluirTabla', label:'👥 Tabla detalle de empleados' },
                { key:'incluirDepartamentos', label:'🏢 Tabla por departamento' },
                { key:'incluirFoto', label:'📷 Foto del empleado', only: !!empSeleccionado },
              ].filter(i => !i.only || i.only).map(({ key, label }) => (
                <label key={key} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: config[key] ? 'var(--g-soft)' : 'var(--g10)', borderRadius:10, border:`1.5px solid ${config[key] ? 'rgba(107,15,43,0.25)' : 'var(--g20)'}`, cursor:'pointer', transition:'all 0.2s' }}>
                  <input type="checkbox" checked={config[key]} onChange={e=>set(key,e.target.checked)} style={{ width:16, height:16, accentColor:'var(--g)' }} />
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color: config[key] ? 'var(--g)' : 'var(--g60)' }}>{label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* ── COLORES ── */}
          <section>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14, paddingBottom:8, borderBottom:'2px solid var(--g-soft)' }}>
              🎨 Colores del Documento
            </div>
            {/* Presets */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {COLORES_PRESET.map((p, i) => (
                <button key={i} onClick={() => aplicarPreset(i)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:20, border:`2px solid ${config.presetIdx === i ? p.primario : 'var(--g20)'}`, background: config.presetIdx === i ? `${p.primario}15` : 'var(--g10)', cursor:'pointer', transition:'all 0.2s' }}>
                  <div style={{ display:'flex', gap:3 }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:p.primario }} />
                    <div style={{ width:14, height:14, borderRadius:'50%', background:p.secundario }} />
                  </div>
                  <span style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color: config.presetIdx === i ? p.primario : 'var(--g60)' }}>{p.nombre}</span>
                </button>
              ))}
            </div>
            {/* Custom */}
            <div className="form-grid">
              <div className="form-group">
                <label>Color primario (encabezado)</label>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <input type="color" value={config.colorPrimario} onChange={e=>set('colorPrimario',e.target.value)} style={{ width:48, height:40, borderRadius:8, border:'1.5px solid var(--g20)', cursor:'pointer', padding:2 }} />
                  <input className="form-control" value={config.colorPrimario} onChange={e=>set('colorPrimario',e.target.value)} style={{ fontFamily:'monospace', fontSize:13 }} />
                </div>
              </div>
              <div className="form-group">
                <label>Color secundario (acentos)</label>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <input type="color" value={config.colorSecundario} onChange={e=>set('colorSecundario',e.target.value)} style={{ width:48, height:40, borderRadius:8, border:'1.5px solid var(--g20)', cursor:'pointer', padding:2 }} />
                  <input className="form-control" value={config.colorSecundario} onChange={e=>set('colorSecundario',e.target.value)} style={{ fontFamily:'monospace', fontSize:13 }} />
                </div>
              </div>
            </div>
            {/* Preview colores */}
            <div style={{ marginTop:10, borderRadius:10, overflow:'hidden', border:'1px solid var(--g20)' }}>
              <div style={{ background:config.colorPrimario, padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13 }}>Vista previa del encabezado</span>
                <div style={{ width:40, height:6, borderRadius:3, background:config.colorSecundario }} />
              </div>
              <div style={{ background:'#f8f5f5', padding:'10px 16px', borderTop:`3px solid ${config.colorSecundario}` }}>
                <span style={{ color:config.colorPrimario, fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12 }}>RESUMEN EJECUTIVO</span>
              </div>
            </div>
          </section>

          {/* ── FIRMAS ── */}
          <section>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:8, borderBottom:'2px solid var(--g-soft)' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px' }}>
                ✍️ Espacios de Firma
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input type="checkbox" checked={config.incluirFirmas} onChange={e=>set('incluirFirmas',e.target.checked)} style={{ width:16, height:16, accentColor:'var(--g)' }} />
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'var(--g)' }}>Incluir firmas</span>
              </label>
            </div>

            {config.incluirFirmas && (
              <>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {config.firmas.map((f, i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end', padding:'12px 14px', background:'var(--g10)', borderRadius:10, border:'1px solid var(--g20)' }}>
                      <div className="form-group">
                        <label>Etiqueta</label>
                        <input className="form-control" value={f.etiqueta} onChange={e=>updateFirma(i,'etiqueta',e.target.value)} placeholder="Vo. Bo." />
                      </div>
                      <div className="form-group">
                        <label>Nombre (opcional)</label>
                        <input className="form-control" value={f.nombre} onChange={e=>updateFirma(i,'nombre',e.target.value)} placeholder="Lic. Juan Pérez" />
                      </div>
                      <div className="form-group">
                        <label>Puesto</label>
                        <input className="form-control" value={f.puesto} onChange={e=>updateFirma(i,'puesto',e.target.value)} placeholder="Director General" />
                      </div>
                      <button className="btn-institucional peligro btn-sm" onClick={() => eliminarFirma(i)} style={{ marginBottom:2 }}>🗑️</button>
                    </div>
                  ))}
                </div>
                {config.firmas.length < 4 && (
                  <button className="btn-institucional dorado btn-sm" style={{ marginTop:10 }} onClick={agregarFirma}>
                    ➕ Agregar firma
                  </button>
                )}
              </>
            )}
          </section>

          {/* ── NOTAS ── */}
          <section>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'var(--g)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14, paddingBottom:8, borderBottom:'2px solid var(--g-soft)' }}>
              📝 Nota final (opcional)
            </div>
            <textarea className="form-control" rows={2} placeholder="Ej: Este documento tiene validez oficial con las firmas correspondientes..." value={config.notaFinal} onChange={e=>set('notaFinal',e.target.value)} />
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onCerrar}>Cancelar</button>
          <button className="btn-institucional filled btn-lg" onClick={() => onGenerar({ ...config, hexToRgb })}>
            📄 Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
