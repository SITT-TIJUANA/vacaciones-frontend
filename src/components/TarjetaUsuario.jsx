import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TarjetaUsuario() {
  const { usuario, rolEfectivo } = useAuth();
  const [empleado, setEmpleado] = useState(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [pos, setPos] = useState({ x: window.innerWidth - 210, y: 80 });
  const isDragging = useRef(false);
  const startRef = useRef({ mx:0, my:0, px:0, py:0 });
  const posRef = useRef(pos);
  const cardRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('credencial-pos');
      if (s) { const p = JSON.parse(s); setPos(p); posRef.current = p; }
    } catch(e){}
  }, []);

  useEffect(() => {
    if (usuario?.empleado_id) {
      api.get(`/api/empleados/${usuario.empleado_id}`)
        .then(r => setEmpleado(r.data)).catch(()=>{});
    }
  }, [usuario]);

  // Animación 3D suave automática
  useEffect(() => {
    let t = 0;
    const anim = () => {
      if (!isDragging.current) {
        t += 0.015;
        setRotX(Math.sin(t * 0.5) * 5);
        setRotY(Math.sin(t * 0.8) * 8);
      }
      animRef.current = requestAnimationFrame(anim);
    };
    animRef.current = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const startDrag = (clientX, clientY) => {
    isDragging.current = true;
    startRef.current = { mx:clientX, my:clientY, px:posRef.current.x, py:posRef.current.y };

    const move = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const nx = Math.max(0, Math.min(window.innerWidth-210, startRef.current.px + cx - startRef.current.mx));
      const ny = Math.max(0, Math.min(window.innerHeight-280, startRef.current.py + cy - startRef.current.my));
      posRef.current = {x:nx, y:ny};
      if (cardRef.current) { cardRef.current.style.left=nx+'px'; cardRef.current.style.top=ny+'px'; }
    };
    const end = () => {
      isDragging.current = false;
      const p = posRef.current;
      setPos({...p});
      localStorage.setItem('credencial-pos', JSON.stringify(p));
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('touchend', end);
  };

  const onMouseMove3D = (e) => {
    if (isDragging.current) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setRotX(-((e.clientY-rect.top-rect.height/2)/(rect.height/2))*12);
    setRotY(((e.clientX-rect.left-rect.width/2)/(rect.width/2))*12);
  };

  const ROL_INFO = {
    admin:    { label:'ADMINISTRADOR',    color:'#C9A84C' },
    rrhh:     { label:'RECURSOS HUMANOS', color:'#4A90D9' },
    empleado: { label:'PERSONAL',         color:'#66BB6A' },
  };

  const info = ROL_INFO[rolEfectivo] || ROL_INFO.empleado;
  const nombre = empleado
    ? `${empleado.nombre} ${empleado.apellido_paterno}`
    : usuario?.username || 'Usuario';
  const puesto = empleado?.puesto || info.label;
  const numEmp = empleado?.numero_empleado || '—';

  // QR decorativo SVG
  const QR = () => (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{display:'block'}}>
      <rect width="44" height="44" fill="rgba(255,255,255,0.08)" rx="4"/>
      {/* Esquinas QR */}
      {[[2,2],[28,2],[2,28]].map(([x,y],i)=>(
        <g key={i}>
          <rect x={x} y={y} width="14" height="14" fill="none" stroke={info.color} strokeWidth="2" rx="2"/>
          <rect x={x+3} y={y+3} width="8" height="8" fill={info.color} rx="1"/>
        </g>
      ))}
      {/* Módulos QR aleatorios */}
      {[[28,20],[30,22],[32,20],[28,24],[32,24],[30,26],[28,28],[32,28],[30,30],[28,32],[32,32],
        [20,28],[22,30],[24,28],[20,32],[24,32],[22,34],[20,36],[24,36],
        [16,16],[18,14],[20,16],[16,20],[20,20]].map(([x,y],i)=>(
        <rect key={i} x={x} y={y} width="2" height="2" fill={info.color} opacity="0.7"/>
      ))}
    </svg>
  );

  return (
    <div
      ref={cardRef}
      onMouseDown={e=>{ e.preventDefault(); startDrag(e.clientX, e.clientY); }}
      onTouchStart={e=>startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onMouseMove={onMouseMove3D}
      style={{ position:'fixed', left:pos.x, top:pos.y, zIndex:998, userSelect:'none', cursor:'grab', touchAction:'none' }}
    >
      <div style={{
        transform:`perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease',
        width:190,
        borderRadius:16,
        overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        background:'linear-gradient(160deg,#3d0a15 0%,#6B0F2B 40%,#4a0c1f 100%)',
      }}>
        {/* Hologram top strip */}
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${info.color},#fff,${info.color},transparent)`,opacity:0.8}}/>

        {/* Header */}
        <div style={{padding:'10px 12px 8px',borderBottom:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',gap:8}}>
          <img src="/vacaciones-frontend/escudo-sitt.png" alt="" style={{width:22,height:22,objectFit:'contain',opacity:0.9}} onError={e=>e.target.style.display='none'}/>
          <div>
            <div style={{fontSize:7,fontWeight:900,color:'rgba(255,255,255,0.5)',letterSpacing:2,textTransform:'uppercase',fontFamily:'Montserrat,sans-serif'}}>H. XXV Ayuntamiento de Tijuana</div>
            <div style={{fontSize:9,fontWeight:900,color:info.color,letterSpacing:1.5,textTransform:'uppercase',fontFamily:'Montserrat,sans-serif'}}>SITT</div>
          </div>
        </div>

        {/* Body */}
        <div style={{padding:'10px 12px',display:'flex',gap:10,alignItems:'flex-start'}}>
          {/* Foto */}
          <div style={{flexShrink:0}}>
            {empleado?.foto_url
              ? <img src={empleado.foto_url} alt="" style={{width:56,height:68,objectFit:'cover',borderRadius:6,border:`2px solid ${info.color}`,display:'block'}}/>
              : <div style={{width:56,height:68,borderRadius:6,border:`2px solid ${info.color}`,background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexDirection:'column',gap:2}}>
                  <span>👤</span>
                  <span style={{fontSize:7,color:'rgba(255,255,255,0.4)',fontFamily:'Montserrat,sans-serif'}}>FOTO</span>
                </div>
            }
            <div style={{marginTop:6,textAlign:'center'}}>
              <QR/>
            </div>
          </div>

          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:7,fontWeight:700,color:info.color,letterSpacing:2,textTransform:'uppercase',fontFamily:'Montserrat,sans-serif',marginBottom:3}}>
              {info.label}
            </div>
            <div style={{fontSize:11,fontWeight:900,color:'#fff',fontFamily:'Montserrat,sans-serif',lineHeight:1.2,marginBottom:6,wordBreak:'break-word'}}>
              {nombre}
            </div>
            <div style={{fontSize:8,color:'rgba(255,255,255,0.6)',fontFamily:'Montserrat,sans-serif',lineHeight:1.4,marginBottom:6}}>
              {puesto}
            </div>
            {empleado?.departamento && (
              <div style={{fontSize:7,color:'rgba(255,255,255,0.4)',fontFamily:'Montserrat,sans-serif',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>
                {empleado.departamento}
              </div>
            )}
            <div style={{borderTop:'1px solid rgba(201,168,76,0.2)',paddingTop:6}}>
              <div style={{fontSize:7,color:'rgba(255,255,255,0.35)',fontFamily:'Montserrat,sans-serif',letterSpacing:1}}>No. EMPLEADO</div>
              <div style={{fontSize:11,fontWeight:900,color:info.color,fontFamily:'Montserrat,sans-serif',letterSpacing:1}}>{numEmp}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'6px 12px',background:'rgba(0,0,0,0.3)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:7,color:'rgba(255,255,255,0.25)',fontFamily:'Montserrat,sans-serif',letterSpacing:1}}>TIJUANA, B.C. MÉXICO</div>
          <div style={{width:24,height:16,background:'linear-gradient(135deg,#FFD700,#C9A84C)',borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:16,height:10,border:'1px solid rgba(0,0,0,0.3)',borderRadius:2,background:'linear-gradient(90deg,#FFD700,#fff9,#FFD700)'}}/>
          </div>
        </div>

        {/* Hologram bottom */}
        <div style={{height:2,background:`linear-gradient(90deg,transparent,${info.color},transparent)`,opacity:0.5}}/>
      </div>
    </div>
  );
}
