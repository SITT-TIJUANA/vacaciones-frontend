import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TarjetaUsuario() {
  const { usuario, rolEfectivo } = useAuth();
  const [empleado, setEmpleado] = useState(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [pos, setPos] = useState({ x: window.innerWidth - 200, y: 80 });
  const isDragging = useRef(false);
  const startRef = useRef({ mx:0, my:0, px:0, py:0 });
  const posRef = useRef(pos);
  const cardRef = useRef(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('badge-pos');
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
    let t = 0, frame;
    const anim = () => {
      if (!isDragging.current) {
        t += 0.012;
        setRotX(Math.sin(t * 0.5) * 6);
        setRotY(Math.sin(t * 0.8) * 9);
      }
      frame = requestAnimationFrame(anim);
    };
    frame = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(frame);
  }, []);

  const startDrag = (cx, cy) => {
    isDragging.current = true;
    startRef.current = { mx:cx, my:cy, px:posRef.current.x, py:posRef.current.y };
    const move = (e) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const nx = Math.max(0, Math.min(window.innerWidth-200, startRef.current.px + x - startRef.current.mx));
      const ny = Math.max(0, Math.min(window.innerHeight-200, startRef.current.py + y - startRef.current.my));
      posRef.current = {x:nx, y:ny};
      if (cardRef.current) { cardRef.current.style.left=nx+'px'; cardRef.current.style.top=ny+'px'; }
    };
    const end = () => {
      isDragging.current = false;
      const p = posRef.current; setPos({...p});
      localStorage.setItem('badge-pos', JSON.stringify(p));
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, {passive:false}); window.addEventListener('touchend', end);
  };

  const ROLES = {
    admin:    { rango:'UNREAL', icon:'⚡', color:'#CE1126', glow:'rgba(206,17,38,0.7)', grad:'linear-gradient(135deg,#1a0005,#3d0010,#6B0F2B)', accent:'#FF4466', stars:5 },
    rrhh:     { rango:'ELITE',  icon:'💎', color:'#4A90D9', glow:'rgba(74,144,217,0.7)', grad:'linear-gradient(135deg,#000a1a,#0a1f3d,#1a3a6b)', accent:'#60AFFF', stars:4 },
    empleado: { rango:'ORO',    icon:'⭐', color:'#C9A84C', glow:'rgba(201,168,76,0.7)', grad:'linear-gradient(135deg,#1a1200,#3d2e00,#6b5200)', accent:'#FFD700', stars:3 },
  };

  const r = ROLES[rolEfectivo] || ROLES.empleado;
  const nombre = empleado ? `${empleado.nombre} ${empleado.apellido_paterno}` : usuario?.username || 'Usuario';
  const firstWord = nombre.split(' ')[0];

  return (
    <div
      ref={cardRef}
      onMouseDown={e=>{ e.preventDefault(); startDrag(e.clientX, e.clientY); }}
      onTouchStart={e=>startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onMouseMove={e=>{
        if (isDragging.current) return;
        const rect = cardRef.current?.getBoundingClientRect(); if(!rect) return;
        setRotX(-((e.clientY-rect.top-rect.height/2)/(rect.height/2))*14);
        setRotY(((e.clientX-rect.left-rect.width/2)/(rect.width/2))*14);
      }}
      style={{ position:'fixed', left:pos.x, top:pos.y, zIndex:998, userSelect:'none', cursor:'grab', touchAction:'none' }}
    >
      {/* Glow exterior */}
      <div style={{ position:'absolute', inset:-8, borderRadius:24, background:r.glow, filter:'blur(16px)', opacity:0.5, pointerEvents:'none', zIndex:-1 }}/>

      <div style={{
        transform:`perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        transition: isDragging.current ? 'none' : 'transform 0.4s ease',
        width:190,
        borderRadius:20,
        background: r.grad,
        border:`1.5px solid ${r.color}40`,
        overflow:'hidden',
        boxShadow:`0 0 30px ${r.glow}, 0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`,
        fontFamily:'Montserrat,sans-serif',
      }}>
        {/* Top glow line */}
        <div style={{height:2, background:`linear-gradient(90deg,transparent,${r.accent},white,${r.accent},transparent)`}}/>

        {/* Rango banner */}
        <div style={{
          padding:'10px 14px 6px',
          textAlign:'center',
          position:'relative',
          overflow:'hidden',
        }}>
          {/* Fondo animado */}
          <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 50% 0%,${r.color}30,transparent 70%)`,pointerEvents:'none'}}/>

          <div style={{fontSize:7,letterSpacing:4,color:`${r.accent}90`,textTransform:'uppercase',marginBottom:2}}>RANGO</div>
          <div style={{
            fontSize:22, fontWeight:900, letterSpacing:3,
            color:r.accent,
            textShadow:`0 0 20px ${r.accent}, 0 0 40px ${r.color}, 0 2px 4px rgba(0,0,0,0.8)`,
            lineHeight:1,
          }}>
            {r.rango}
          </div>

          {/* Estrellas */}
          <div style={{display:'flex',justifyContent:'center',gap:3,marginTop:6}}>
            {Array.from({length:5}).map((_,i)=>(
              <div key={i} style={{
                fontSize:10,
                color: i < r.stars ? r.accent : 'rgba(255,255,255,0.1)',
                textShadow: i < r.stars ? `0 0 8px ${r.accent}` : 'none',
                transition:'color 0.3s',
              }}>★</div>
            ))}
          </div>
        </div>

        {/* Divisor */}
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${r.accent}60,transparent)`,margin:'0 12px'}}/>

        {/* Avatar + info */}
        <div style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
          {/* Avatar */}
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{
              width:52, height:52, borderRadius:'50%',
              border:`2px solid ${r.accent}`,
              boxShadow:`0 0 16px ${r.glow}`,
              overflow:'hidden',
              background:'rgba(255,255,255,0.05)',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              {empleado?.foto_url
                ? <img src={empleado.foto_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <span style={{fontSize:22}}>{r.icon}</span>
              }
            </div>
            {/* Badge nivel */}
            <div style={{
              position:'absolute',bottom:-3,right:-3,
              width:18,height:18,borderRadius:'50%',
              background:`linear-gradient(135deg,${r.color},${r.accent})`,
              border:'2px solid #000',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:8,fontWeight:900,color:'#fff',
              boxShadow:`0 0 8px ${r.glow}`,
            }}>
              {r.stars}
            </div>
          </div>

          {/* Nombre y rol */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:900,color:'#fff',lineHeight:1.2,textShadow:'0 1px 4px rgba(0,0,0,0.8)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              {firstWord}
            </div>
            {nombre.includes(' ') && (
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.5)',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {nombre.split(' ').slice(1).join(' ')}
              </div>
            )}
            <div style={{
              marginTop:4,fontSize:8,fontWeight:800,letterSpacing:1,
              color:r.accent,textTransform:'uppercase',
              textShadow:`0 0 8px ${r.glow}`,
            }}>
              {rolEfectivo==='admin'?'Administrador':rolEfectivo==='rrhh'?'Rec. Humanos':'Personal SITT'}
            </div>
            {empleado?.puesto && (
              <div style={{fontSize:8,color:'rgba(255,255,255,0.3)',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {empleado.puesto}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          padding:'6px 14px',
          background:'rgba(0,0,0,0.4)',
          display:'flex',justifyContent:'space-between',alignItems:'center',
          borderTop:`1px solid ${r.color}20`,
        }}>
          <div style={{fontSize:7,color:'rgba(255,255,255,0.2)',letterSpacing:1}}>SITT · TIJUANA</div>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:r.accent,boxShadow:`0 0 6px ${r.accent}`,animation:'pulse 1.5s ease-in-out infinite'}}/>
            <div style={{fontSize:7,color:r.accent,fontWeight:700,letterSpacing:1}}>ACTIVO</div>
          </div>
        </div>

        {/* Bottom glow line */}
        <div style={{height:2,background:`linear-gradient(90deg,transparent,${r.accent},transparent)`,opacity:0.5}}/>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}`}</style>
    </div>
  );
}
