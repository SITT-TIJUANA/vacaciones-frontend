import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SECCIONES_ROL = {
  admin:    ['Vacaciones','Permisos','Incapacidades','Organigrama','Gestión de Personal','Reportes'],
  rrhh:     ['Vacaciones','Permisos','Incapacidades','Organigrama','Gestión de Personal','Reportes'],
  empleado: ['Vacaciones','Permisos','Incapacidades','Organigrama'],
};

export default function ReporteProblema() {
  const { rolEfectivo } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ seccion:'', descripcion:'', puedeContinar:null });
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const secciones = SECCIONES_ROL[rolEfectivo] || SECCIONES_ROL.empleado;

  const enviar = async () => {
    if (!form.seccion || !form.descripcion || form.puedeContinar === null) {
      setError('Por favor completa todos los campos'); return;
    }
    setEnviando(true); setError('');
    try {
      await api.post('/api/notificaciones/reporte', form);
      setOk(true);
      setTimeout(() => { setAbierto(false); setOk(false); setForm({seccion:'',descripcion:'',puedeContinar:null}); }, 2500);
    } catch(e) { setError('Error al enviar. Intenta de nuevo.'); }
    finally { setEnviando(false); }
  };

  return (
    <>
      {/* Botón estilo 3D */}
      <div
        onClick={() => setAbierto(true)}
        style={{
          position: 'relative',
          cursor: 'pointer',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {/* Tooltip */}
        <div style={{
          position: 'absolute',
          top: -50,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(-90deg,rgba(0,0,0,0.05) 1px,white 1px),linear-gradient(rgba(0,0,0,0.05) 1px,white 1px),white',
          backgroundSize: '4px 4px,4px 4px',
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          fontSize: 12,
          fontWeight: 700,
          color: '#333',
          fontFamily: 'Montserrat,sans-serif',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s, top 0.2s',
          zIndex: 10,
        }} className="reporte-tooltip">
          Reportar problema
        </div>

        {/* Triángulo 3D */}
        <div style={{
          width: 0,
          height: 0,
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderBottom: '18px solid rgba(255,255,255,0.2)',
          transition: 'transform 0.3s ease',
          filter: 'drop-shadow(0 -2px 4px rgba(0,0,0,0.1))',
        }} className="reporte-tri"/>

        {/* Cuerpo botón */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 12,
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
          fontFamily: 'Montserrat,sans-serif',
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>Reportar problema</span>
        </div>
      </div>

      <style>{`
        div:hover > .reporte-tooltip { opacity: 1 !important; top: -58px !important; }
        div:hover > .reporte-tri { transform: perspective(400px) rotateX(-20deg); }
      `}</style>

      {/* Modal */}
      {abierto && (
        <div className="modal-overlay" onClick={()=>setAbierto(false)}>
          <div className="modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header" style={{background:'linear-gradient(135deg,#1a1a2e,#2d2d4e)'}}>
              <h2>⚠️ Reportar Problema</h2>
              <button className="modal-close" onClick={()=>setAbierto(false)}>✕</button>
            </div>
            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
              {ok ? (
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  <div style={{fontSize:48,marginBottom:12}}>✅</div>
                  <div style={{fontWeight:800,fontSize:16,color:'#1B5E20'}}>¡Reporte enviado!</div>
                  <div style={{fontSize:13,color:'#718096',marginTop:6}}>Tu reporte ha sido enviado correctamente.</div>
                </div>
              ) : (
                <>
                  {error && <div style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:8,padding:'10px',color:'#B71C1C',fontSize:13}}>⚠️ {error}</div>}

                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>¿En qué sección ocurrió? *</label>
                    <select value={form.seccion} onChange={e=>setForm({...form,seccion:e.target.value})}
                      style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}>
                      <option value="">Seleccionar sección...</option>
                      {secciones.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>Describe el problema *</label>
                    <textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}
                      rows={4} placeholder="Describe qué pasó, qué estabas haciendo y qué error viste..."
                      style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,resize:'vertical',boxSizing:'border-box'}}/>
                  </div>

                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:8,textTransform:'uppercase'}}>¿Puedes continuar usando la app? *</label>
                    <div style={{display:'flex',gap:10}}>
                      {[{val:true,label:'✅ Sí, puedo continuar'},{val:false,label:'❌ No, necesito ayuda'}].map(o=>(
                        <button key={String(o.val)} onClick={()=>setForm({...form,puedeContinar:o.val})}
                          style={{flex:1,padding:'10px',borderRadius:10,border:`1.5px solid ${form.puedeContinar===o.val?'#6B0F2B':'#e2e8f0'}`,background:form.puedeContinar===o.val?'rgba(107,15,43,0.08)':'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,color:form.puedeContinar===o.val?'#6B0F2B':'#718096',transition:'all 0.2s'}}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {!ok && (
              <div className="modal-footer">
                <button className="btn-institucional btn-sm" onClick={()=>setAbierto(false)}>Cancelar</button>
                <button onClick={enviar} disabled={enviando}
                  style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#1a1a2e,#2d2d4e)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
                  {enviando?'⏳ Enviando...':'📤 Enviar reporte'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
