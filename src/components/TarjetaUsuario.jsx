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
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('tarjeta-pos');
    if (saved) { try { setPos(JSON.parse(saved)); } catch(e){} }
  }, []);

  useEffect(() => {
    if (usuario?.empleado_id) {
      api.get(`/api/empleados/${usuario.empleado_id}`)
        .then(r => setEmpleado(r.data)).catch(()=>{});
    }
  }, [usuario]);

  // Animación 3D automática
  useEffect(() => {
    if (hovered || dragging.current) return;
    let frame, t = 0;
    const animate = () => {
      t += 0.02;
      setRotX(Math.sin(t * 0.7) * 4);
      setRotY(Math.sin(t) * 7);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hovered]);

  const onMouseMove3D = (e) => {
    if (dragging.current) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientY - rect.top - rect.height/2) / (rect.height/2);
    const y = (e.clientX - rect.left - rect.width/2) / (rect.width/2);
    setRotX(-x * 10); setRotY(y * 10);
  };

  // Drag handlers
  const onMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };

    const onMove = (e) => {
      if (!dragging.current) return;
      const nx = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - offset.current.x));
      const ny = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - offset.current.y));
      setPos({ x: nx, y: ny });
    };

    const onUp = () => {
      dragging.current = false;
      setPos(p => { localStorage.setItem('tarjeta-pos', JSON.stringify(p)); return p; });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Touch drag
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    dragging.current = true;
    offset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };

    const onMove = (e) => {
      const t = e.touches[0];
      const nx = Math.max(0, Math.min(window.innerWidth - 200, t.clientX - offset.current.x));
      const ny = Math.max(0, Math.min(window.innerHeight - 80, t.clientY - offset.current.y));
      setPos({ x: nx, y: ny });
    };

    const onEnd = () => {
      dragging.current = false;
      setPos(p => { localStorage.setItem('tarjeta-pos', JSON.stringify(p)); return p; });
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setRotX(0); setRotY(0); }}
      onMouseMove={onMouseMove3D}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 998,
        userSelect: 'none',
        cursor: dragging.current ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    >
      <div style={{
        transform: `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${hovered?1.05:1})`,
        transition: dragging.current ? 'none' : hovered ? 'transform 0.1s ease' : 'transform 0.8s ease',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px ${info.badge}40`
          : '0 8px 24px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${info.color1}, ${info.color2})`,
          padding: hovered ? '14px 18px' : '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          minWidth: hovered ? 200 : 158,
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Brillo */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(180deg,rgba(255,255,255,0.1),transparent)', pointerEvents:'none' }}/>

          {/* Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            {empleado?.foto_url
              ? <img src={empleado.foto_url} alt="" style={{ width:hovered?46:36, height:hovered?46:36, borderRadius:'50%', objectFit:'cover', border:`2px solid ${info.badge}`, transition:'all 0.3s', display:'block' }}/>
              : <div style={{ width:hovered?46:36, height:hovered?46:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:`2px solid ${info.badge}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:hovered?20:15, transition:'all 0.3s' }}>{info.icon}</div>
            }
            <div style={{ position:'absolute', bottom:-2, right:-2, background:info.badge, borderRadius:'50%', width:13, height:13, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, border:'2px solid rgba(0,0,0,0.3)', color:'#fff', fontWeight:900 }}>✓</div>
          </div>

          {/* Texto */}
          <div>
            <div style={{ fontSize:hovered?13:11, fontWeight:900, color:'#fff', fontFamily:'Montserrat,sans-serif', lineHeight:1.2, whiteSpace:'nowrap', textShadow:'0 1px 4px rgba(0,0,0,0.3)', transition:'all 0.3s' }}>
              {hovered ? nombre : nombre.split(' ')[0]}
            </div>
            <div style={{ fontSize:9, fontWeight:700, color:info.badge, fontFamily:'Montserrat,sans-serif', letterSpacing:0.5, textTransform:'uppercase', marginTop:2 }}>
              {info.label}
            </div>
            {hovered && empleado?.puesto && (
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)', fontFamily:'Montserrat,sans-serif', marginTop:2, animation:'fadeIn 0.2s ease' }}>
                {empleado.puesto}
              </div>
            )}
          </div>
        </div>
        <div style={{ height:2, background:`linear-gradient(90deg,transparent,${info.badge},transparent)` }}/>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}
