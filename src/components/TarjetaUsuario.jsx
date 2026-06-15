import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TarjetaUsuario() {
  const { usuario, rolEfectivo, modoEmpleado, setModoEmpleado } = useAuth();
  const [empleado, setEmpleado] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [pos, setPos] = useState({ x: window.innerWidth - 70, y: 90 });
  const [modalPass, setModalPass] = useState(false);
  const [panelFijo, setPanelFijo] = useState(false);
  const isDragging = useRef(false);
  const startRef = useRef({});
  const posRef = useRef(pos);
  const cardRef = useRef(null);

  useEffect(() => {
    try { const s = localStorage.getItem('mono-pos'); if(s){const p=JSON.parse(s);setPos(p);posRef.current=p;} } catch(e){}
  }, []);

  useEffect(() => {
    if (usuario?.empleado_id) {
      api.get(`/api/empleados/${usuario.empleado_id}`).then(r=>setEmpleado(r.data)).catch(()=>{});
    }
  }, [usuario]);

  useEffect(() => {
    if (hovered || isDragging.current) return;
    let t=0, frame;
    const anim = () => { t+=0.015; setRotX(Math.sin(t*0.5)*5); setRotY(Math.sin(t*0.8)*8); frame=requestAnimationFrame(anim); };
    frame = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(frame);
  }, [hovered]);

  const startDrag = (cx, cy) => {
    isDragging.current = true;
    startRef.current = { mx:cx, my:cy, px:posRef.current.x, py:posRef.current.y };
    const move = (e) => {
      const x=e.touches?e.touches[0].clientX:e.clientX, y=e.touches?e.touches[0].clientY:e.clientY;
      const nx=Math.max(0,Math.min(window.innerWidth-60,startRef.current.px+x-startRef.current.mx));
      const ny=Math.max(0,Math.min(window.innerHeight-60,startRef.current.py+y-startRef.current.my));
      posRef.current={x:nx,y:ny};
      if(cardRef.current){cardRef.current.style.left=nx+'px';cardRef.current.style.top=ny+'px';}
    };
    const end = () => {
      isDragging.current=false;
      const p=posRef.current; setPos({...p}); localStorage.setItem('mono-pos',JSON.stringify(p));
      window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',end);
      window.removeEventListener('touchmove',move); window.removeEventListener('touchend',end);
    };
    window.addEventListener('mousemove',move); window.addEventListener('mouseup',end);
    window.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',end);
  };

  const ROLES = {
    admin:    { color:'#6B0F2B', accent:'#C9A84C', label:'Administrador' },
    rrhh:     { color:'#0a1f3d', accent:'#4A90D9', label:'Rec. Humanos' },
    empleado: { color:'#1B5E20', accent:'#66BB6A', label:'Personal' },
  };
  const r = ROLES[rolEfectivo] || ROLES.empleado;
  const nombre = empleado ? `${empleado.nombre||''} ${empleado.apellido_paterno||''}`.trim() || usuario?.username || 'Usuario' : usuario?.username || 'Usuario';
  const iniciales = nombre.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]||'').join('').toUpperCase() || '?';

  return (
    <>
      {modalPass && <ModalCambiarPropiaPassword onClose={()=>setModalPass(false)}/>}
      <div
        ref={cardRef}
        onMouseDown={e=>{e.preventDefault();startDrag(e.clientX,e.clientY);}}
        onTouchStart={e=>startDrag(e.touches[0].clientX,e.touches[0].clientY)}
        onClick={()=>{ if(!isDragging.current){ setPanelFijo(f=>!f); setHovered(false); }}}
        onMouseEnter={()=>{ if(!panelFijo) setHovered(true); }}
        onMouseLeave={()=>{ if(!panelFijo){setHovered(false);setRotX(0);setRotY(0);} }}
        onMouseMove={e=>{
          if(isDragging.current)return;
          const rect=cardRef.current?.getBoundingClientRect();if(!rect)return;
          setRotX(-((e.clientY-rect.top-rect.height/2)/(rect.height/2))*12);
          setRotY(((e.clientX-rect.left-rect.width/2)/(rect.width/2))*12);
        }}
        style={{position:'fixed',left:pos.x,top:pos.y,zIndex:998,userSelect:'none',cursor:'grab',touchAction:'none'}}
      >
        {/* Glow */}
        <div style={{position:'absolute',inset:-6,borderRadius:'50%',background:r.accent,filter:'blur(12px)',opacity:hovered?0.4:0.2,transition:'opacity 0.3s',pointerEvents:'none',zIndex:-1}}/>

        <div style={{
          transform:`perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition:isDragging.current?'none':hovered?'transform 0.1s':'transform 0.6s ease',
        }}>
          {/* Círculo */}
          <div style={{
            width:54,height:54,borderRadius:'50%',
            background:`linear-gradient(135deg,${r.color},${r.color}cc)`,
            border:`2.5px solid ${r.accent}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:`0 8px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.15)`,
            overflow:'hidden',position:'relative',
          }}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg,rgba(255,255,255,0.12),transparent)',borderRadius:'50% 50% 0 0',pointerEvents:'none'}}/>
            {empleado?.foto_url
              ? <img src={empleado.foto_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
              : <span style={{fontSize:18,fontWeight:900,color:'#fff',fontFamily:'Playfair Display,serif',fontStyle:'italic',position:'relative',zIndex:1}}>{iniciales}</span>
            }
            <div style={{position:'absolute',bottom:2,right:2,width:10,height:10,borderRadius:'50%',background:'#22c55e',border:'2px solid #fff',boxShadow:'0 0 6px #22c55e'}}/>
          </div>

          {/* Panel hover */}
          {(hovered || panelFijo) && (
            <div style={{
              position:'fixed',right:80,top:pos.y,
              background:`linear-gradient(135deg,${r.color}f0,${r.color}d0)`,
              border:`1px solid ${r.accent}40`,borderRadius:14,padding:'12px 16px',
              boxShadow:`0 12px 40px rgba(0,0,0,0.3)`,
              animation:'slideIn 0.2s ease',minWidth:160,maxWidth:'calc(100vw - 100px)',zIndex:9999,
            }}>
              <div style={{position:'absolute',right:-6,top:'50%',transform:'translateY(-50%)',width:12,height:12,background:r.color,borderRadius:2,rotate:'45deg',borderLeft:'none',borderBottom:'none',border:`1px solid ${r.accent}40`}}/>
              {panelFijo && <button onClick={e=>{e.stopPropagation();setPanelFijo(false);}} style={{position:'absolute',top:6,right:6,background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:18,height:18,borderRadius:'50%',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900}}>✕</button>}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:`${r.accent}25`,border:`1px solid ${r.accent}60`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:r.accent,fontFamily:'Playfair Display,serif',fontStyle:'italic'}}>
                  {iniciales}
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:900,color:'#fff',fontFamily:'Montserrat,sans-serif',lineHeight:1.2}}>{nombre.split(' ')[0]}</div>
                  <div style={{fontSize:10,color:r.accent,fontWeight:700,fontFamily:'Montserrat,sans-serif'}}>{nombre.split(' ').slice(1).join(' ')}</div>
                </div>
              </div>
              <div style={{height:1,background:`linear-gradient(90deg,transparent,${r.accent}50,transparent)`,marginBottom:8}}/>
              <div style={{fontSize:9,fontWeight:800,color:r.accent,fontFamily:'Montserrat,sans-serif',letterSpacing:1.5,textTransform:'uppercase',marginBottom:2}}>{r.label}</div>
              {empleado?.puesto && <div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:'Montserrat,sans-serif'}}>{empleado.puesto}</div>}
              {empleado?.departamento && <div style={{fontSize:8,color:'rgba(255,255,255,0.3)',fontFamily:'Montserrat,sans-serif',marginTop:1}}>{empleado.departamento}</div>}
              {usuario?.empleado_id && (usuario?.rol==='admin'||usuario?.rol==='rrhh') && (
                <button onClick={e=>{e.stopPropagation();setModoEmpleado(!modoEmpleado);setHovered(false);setPanelFijo(false);}}
                  style={{marginTop:8,padding:'6px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.3)',background:modoEmpleado?'rgba(201,168,76,0.3)':'rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:10,width:'100%',textAlign:'center'}}>
                  {modoEmpleado?'🛡️ Ver como Admin':'👤 Ver como Empleado'}
                </button>
              )}
              <button onClick={e=>{e.stopPropagation();setModalPass(true);setHovered(false);setPanelFijo(false);}}
                style={{marginTop:6,padding:'6px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:10,width:'100%',textAlign:'center'}}>
                🔑 Cambiar contraseña
              </button>
            </div>
          )}
        </div>
        <style>{`@keyframes slideIn{from{opacity:0}to{opacity:1}}`}</style>
      </div>
    </>
  );
}

function ModalCambiarPropiaPassword({ onClose }) {
  const [passActual, setPassActual] = useState('');
  const [passNuevo, setPassNuevo] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const guardar = async () => {
    if (!passActual) { setError('Ingresa tu contraseña actual'); return; }
    if (passNuevo.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (passNuevo !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    setEnviando(true); setError('');
    try {
      await api.post('/api/auth/cambiar-password', { password_actual:passActual, password_nuevo:passNuevo });
      setOk(true);
      setTimeout(() => onClose(), 2000);
    } catch(e) { setError(e.response?.data?.error || 'Error al actualizar'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{zIndex:10000}}>
      <div className="modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔑 Cambiar Contraseña</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          {error && <div style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:8,padding:'10px',color:'#B71C1C',fontSize:13}}>⚠️ {error}</div>}
          {ok && <div style={{background:'#F0FFF4',border:'1px solid #c6f6d5',borderRadius:8,padding:'10px',color:'#1B5E20',fontSize:13,fontWeight:700}}>✅ Contraseña actualizada</div>}
          {[
            {label:'Contraseña actual',val:passActual,set:setPassActual,ph:'Tu contraseña actual'},
            {label:'Nueva contraseña',val:passNuevo,set:setPassNuevo,ph:'Mínimo 6 caracteres'},
            {label:'Confirmar nueva',val:confirmar,set:setConfirmar,ph:'Repetir nueva contraseña'},
          ].map(f=>(
            <div key={f.label}>
              <label style={{display:'block',fontWeight:700,fontSize:12,color:'#4A5568',marginBottom:6,textTransform:'uppercase'}}>{f.label}</label>
              <input type="password" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontFamily:'Montserrat,sans-serif',fontSize:13,boxSizing:'border-box'}}
                onKeyDown={e=>e.key==='Enter'&&guardar()}/>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onClose}>Cancelar</button>
          <button onClick={guardar} disabled={enviando||ok}
            style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#6B0F2B,#9B1540)',color:'#fff',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>
            {enviando?'⏳...':'✅ Actualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}
