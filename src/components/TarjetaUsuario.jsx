import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TarjetaUsuario() {
  const { usuario, rolEfectivo } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [pos, setPos] = useState({ x: window.innerWidth - 190, y: 70 });
  const isDragging = useRef(false);
  const startRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const posRef = useRef(pos);
  const cardRef = useRef(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('tarjeta-pos');
      if (s) { const p = JSON.parse(s); setPos(p); posRef.current = p; }
    } catch(e){}
  }, []);

  useEffect(() => {
    if (usuario?.empleado_id) {
      api.get(`/api/empleados/${usuario.empleado_id}`)
        .then(r => setEmpleado(r.data)).catch(()=>{});
    }
  }, [usuario]);

  useEffect(() => {
    if (hovered || isDragging.current) return;
    let frame, t = 0;
    const anim = () => {
      t += 0.018;
      setRotX(Math.sin(t * 0.6) * 4);
      setRotY(Math.sin(t) * 7);
      frame = requestAnimationFrame(anim);
    };
    frame = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(frame);
  }, [hovered]);

  const startDrag = (clientX, clientY) => {
    isDragging.current = true;
    startRef.current = { mx: clientX, my: clientY, px: posRef.current.x, py: posRef.current.y };

    const move = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const nx = Math.max(0, Math.min(window.innerWidth - 195, startRef.current.px + cx - startRef.current.mx));
      const ny = Math.max(0, Math.min(window.innerHeight - 70, startRef.current.py + cy - startRef.current.my));
      posRef.current = { x: nx, y: ny };
      if (cardRef.current) {
        cardRef.current.style.left = nx + 'px';
        cardRef.current.style.top = ny + 'px';
      }
    };

    const end = () => {
      isDragging.current = false;
      const p = posRef.current;
      setPos({ ...p });
      localStorage.setItem('tarjeta-pos', JSON.stringify(p));
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  };

  const ROL_INFO = {
    admin:    { label:'Administrador',    icon:'🛡️', color1:'#6B0F2B', color2:'#9B1540', badge:'#C9A84C' },
    rrhh:     { label:'Recursos Humanos', icon:'👥', color1:'#0a1f3d', color2:'#1a3a6b', badge:'#4A90D9' },
    empleado: { label:'Empleado',         icon:'👤', color1:'#1B5E20', color2:'#2E7D32', badge:'#66BB6A' },
  };

  const info = ROL_INFO[rolEfectivo] || ROL_INFO.empleado;
  const nombre = empleado
    ? `${empleado.nombre} ${empleado.apellido_paterno}`
    : usuario?.username || 'Usuario';

  return (
    <div
      ref={cardRef}
      style={{ position:'fixed', left:pos.x, top:pos.y, zIndex:998, userSelect:'none' }}
    >
      {/* Handle de arrastre */}
      <div
        onMouseDown={e=>{ e.preventDefault(); startDrag(e.clientX, e.clientY); }}
        onTouchStart={e=>{ startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
        style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', width:32, height:10, background:'rgba(255,255,255,0.25)', borderRadius:5, cursor:'grab', zIndex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}
      >
        {[0,1,2].map(i=><div key={i} style={{width:3,height:3,borderRadius:'50%',background:'rgba(255,255,255,0.7)'}}/>)}
      </div>

      {/* Tarjeta */}
      <div
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>{ setHovered(false); setRotX(0); setRotY(0); }}
        onMouseMove={e=>{
          if (isDragging.current) return;
          const rect = cardRef.current?.getBoundingClientRect();
          if (!rect) return;
          setRotX(-((e.clientY-rect.top-rect.height/2)/(rect.height/2))*10);
          setRotY(((e.clientX-rect.left-rect.width/2)/(rect.width/2))*10);
        }}
        style={{
          transform:`perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${hovered?1.05:1})`,
          transition: isDragging.current ? 'none' : hovered ? 'transform 0.1s' : 'transform 0.8s ease',
          borderRadius:16, overflow:'hidden',
          boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{
          background:`linear-gradient(135deg,${info.color1},${info.color2})`,
          padding: hovered?'14px 18px':'10px 14px',
          display:'flex', alignItems:'center', gap:10,
          minWidth: hovered?200:158,
          transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg,rgba(255,255,255,0.1),transparent)',pointerEvents:'none'}}/>

          <div style={{position:'relative',flexShrink:0}}>
            {empleado?.foto_url
              ? <img src={empleado.foto_url} alt="" style={{width:hovered?46:36,height:hovered?46:36,borderRadius:'50%',objectFit:'cover',border:`2px solid ${info.badge}`,transition:'all 0.3s',display:'block'}}/>
              : <div style={{width:hovered?46:36,height:hovered?46:36,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:`2px solid ${info.badge}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:hovered?20:15,transition:'all 0.3s'}}>{info.icon}</div>
            }
            <div style={{position:'absolute',bottom:-2,right:-2,background:info.badge,borderRadius:'50%',width:13,height:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,border:'2px solid rgba(0,0,0,0.3)',color:'#fff',fontWeight:900}}>✓</div>
          </div>

          <div>
            <div style={{fontSize:hovered?13:11,fontWeight:900,color:'#fff',fontFamily:'Montserrat,sans-serif',lineHeight:1.2,whiteSpace:'nowrap',textShadow:'0 1px 4px rgba(0,0,0,0.3)',transition:'all 0.3s'}}>
              {hovered ? nombre : nombre.split(' ')[0]}
            </div>
            <div style={{fontSize:9,fontWeight:700,color:info.badge,fontFamily:'Montserrat,sans-serif',letterSpacing:0.5,textTransform:'uppercase',marginTop:2}}>
              {info.label}
            </div>
            {hovered && empleado?.puesto && (
              <div style={{fontSize:9,color:'rgba(255,255,255,0.55)',fontFamily:'Montserrat,sans-serif',marginTop:2}}>
                {empleado.puesto}
              </div>
            )}
          </div>
        </div>
        <div style={{height:2,background:`linear-gradient(90deg,transparent,${info.badge},transparent)`}}/>
      </div>
    </div>
  );
}
