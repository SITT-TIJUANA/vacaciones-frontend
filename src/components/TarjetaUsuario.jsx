import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TarjetaUsuario() {
  const { usuario, rolEfectivo } = useAuth();
  const [empleado, setEmpleado] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [modalPass, setModalPass] = useState(false);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [pos, setPos] = useState({ x: window.innerWidth - 70, y: 90 });
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
    const anim = () => {
      t+=0.015; setRotX(Math.sin(t*0.5)*5); setRotY(Math.sin(t*0.8)*8);
      frame = requestAnimationFrame(anim);
    };
    frame = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(frame);
  }, [hovered]);

  const startDrag = (cx, cy) => {
    isDragging.current = true;
    startRef.current = { mx:cx, my:cy, px:posRef.current.x, py:posRef.current.y };
    const move = (e) => {
      const x = e.touches?e.touches[0].clientX:e.clientX;
      const y = e.touches?e.touches[0].clientY:e.clientY;
      const nx = Math.max(0, Math.min(window.innerWidth-60, startRef.current.px+x-startRef.current.mx));
      const ny = Math.max(0, Math.min(window.innerHeight-60, startRef.current.py+y-startRef.current.my));
      posRef.current={x:nx,y:ny};
      if(cardRef.current){cardRef.current.style.left=nx+'px';cardRef.current.style.top=ny+'px';}
    };
    const end = () => {
      isDragging.current=false;
      const p=posRef.current; setPos({...p});
      localStorage.setItem('mono-pos',JSON.stringify(p));
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
  const nombre = empleado 
    ? `${empleado.nombre||''} ${empleado.apellido_paterno||''}`.trim() || usuario?.username || 'Usuario'
    : usuario?.username || 'Usuario';
  const iniciales = nombre.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]||'').join('').toUpperCase() || '?';

  return (
    <>
    {modalPass && <ModalCambiarPropiaPassword onClose={()=>setModalPass(false)}/>}
    <div
      ref={cardRef}
      onMouseDown={e=>{e.preventDefault();startDrag(e.clientX,e.clientY);}}
      onTouchStart={e=>startDrag(e.touches[0].clientX,e.touches[0].clientY)}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>{setHovered(false);setRotX(0);setRotY(0);}}
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
        position:'relative',
      }}>
        {/* Círculo monograma */}
        <div style={{
          width:54, height:54, borderRadius:'50%',
          background:`linear-gradient(135deg,${r.color},${r.color}cc)`,
          border:`2.5px solid ${r.accent}`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:`0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)`,
          transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          overflow:'hidden',
          position:'relative',
        }}>
          {/* Brillo interno */}
          <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg,rgba(255,255,255,0.12),transparent)',borderRadius:'50% 50% 0 0',pointerEvents:'none'}}/>

          {empleado?.foto_url ? (
            <img src={empleado.foto_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
          ) : (
            <span style={{fontSize:18,fontWeight:900,color:'#fff',fontFamily:'Playfair Display,serif',fontStyle:'italic',textShadow:'0 2px 8px rgba(0,0,0,0.4)',letterSpacing:1,position:'relative',zIndex:1}}>
              {iniciales}
            </span>
          )}

          {/* Punto activo */}
          <div style={{position:'absolute',bottom:2,right:2,width:10,height:10,borderRadius:'50%',background:'#22c55e',border:'2px solid #fff',boxShadow:'0 0 6px #22c55e'}}/>
        </div>

        {/* Panel expandido */}
        {hovered && (
          <div style={{
            position:'fixed',right:80,top:pos.y,
            background:`linear-gradient(135deg,${r.color}f0,${r.color}d0)`,
            backdropFilter:'blur(20px)',
            border:`1px solid ${r.accent}40`,
            borderRadius:14,
            padding:'10px 16px',
            whiteSpace:'nowrap',
            boxShadow:`0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${r.accent}20`,
            animation:'slideIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            minWidth:160,
            maxWidth:'calc(100vw - 100px)',
            zIndex:9999,
          }}>
            {/* Flecha */}
            <div style={{position:'absolute',right:-6,top:'50%',transform:'translateY(-50%)',width:12,height:12,background:r.color,border:`1px solid ${r.accent}40`,borderRadius:2,rotate:'45deg',borderLeft:'none',borderBottom:'none'}}/>

            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:`${r.accent}25`,border:`1px solid ${r.accent}60`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:r.accent,fontFamily:'Playfair Display,serif',fontStyle:'italic'}}>
                {iniciales}
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:900,color:'#fff',fontFamily:'Montserrat,sans-serif',lineHeight:1.2}}>{nombre.split(' ')[0]}</div>
                <div style={{fontSize:10,color:r.accent,fontWeight:700,fontFamily:'Montserrat,sans-serif'}}>{nombre.split(' ').slice(1).join(' ')}</div>
              </div>
            </div>

            <div style={{height:'1px',background:`linear-gradient(90deg,transparent,${r.accent}50,transparent)`,marginBottom:6}}/>

            <div style={{fontSize:9,fontWeight:800,color:r.accent,fontFamily:'Montserrat,sans-serif',letterSpacing:1.5,textTransform:'uppercase',marginBottom:2}}>{r.label}</div>
            {empleado?.puesto && <div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:'Montserrat,sans-serif'}}>{empleado.puesto}</div>}
            {empleado?.departamento && <div style={{fontSize:8,color:'rgba(255,255,255,0.3)',fontFamily:'Montserrat,sans-serif',marginTop:1}}>{empleado.departamento}</div>}
          </div>
        )}
      </div>

      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-50%) scale(0.9)}to{opacity:1;transform:translateY(-50%) scale(1)}}`}</style>
    </div>
  );
}
