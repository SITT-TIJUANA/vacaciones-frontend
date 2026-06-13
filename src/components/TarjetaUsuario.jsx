import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TarjetaUsuario() {
  const { usuario, rolEfectivo } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem('tarjeta-pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 180, y: 16 };
  });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useState({x:0,y:0})[0];
  const dragRef = useState(null);

  const onMouseDownDrag = (e) => {
    if (e.button !== 0) return;
    dragRef[0] = { startX: e.clientX - pos.x, startY: e.clientY - pos.y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const nx = Math.max(0, Math.min(window.innerWidth-200, e.clientX - dragRef[0].startX));
      const ny = Math.max(0, Math.min(window.innerHeight-100, e.clientY - dragRef[0].startY));
      setPos({x:nx, y:ny});
    };
    const onUp = () => {
      setDragging(false);
      setPos(p => { localStorage.setItem('tarjeta-pos', JSON.stringify(p)); return p; });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  useEffect(() => {
    if (usuario?.empleado_id) {
      api.get(`/api/empleados/${usuario.empleado_id}`)
        .then(r => setEmpleado(r.data))
        .catch(() => {});
    }
  }, [usuario]);

  // Animación 3D suave automática
  useEffect(() => {
    if (hovered) return;
    let frame;
    let t = 0;
    const animate = () => {
      t += 0.02;
      setRotX(Math.sin(t * 0.7) * 5);
      setRotY(Math.sin(t) * 8);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hovered]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height/2) / (rect.height/2);
    const y = (e.clientX - rect.left - rect.width/2) / (rect.width/2);
    setRotX(-x * 12);
    setRotY(y * 12);
  };

  const ROL_INFO = {
    admin:    { label:'Administrador', icon:'🛡️', color1:'#6B0F2B', color2:'#9B1540', badge:'#C9A84C' },
    rrhh:     { label:'Recursos Humanos', icon:'👥', color1:'#0a1f3d', color2:'#1a3a6b', badge:'#4A90D9' },
    empleado: { label:'Empleado', icon:'👤', color1:'#1B5E20', color2:'#2E7D32', badge:'#66BB6A' },
  };

  const info = ROL_INFO[rolEfectivo] || ROL_INFO.empleado;
  const nombre = empleado
    ? `${empleado.nombre} ${empleado.apellido_paterno}`
    : usuario?.username || 'Usuario';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setRotX(0); setRotY(0); }}
      onMouseDown={onMouseDownDrag}
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        zIndex: 998,
        perspective: '800px',
        userSelect: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
    >
      <div style={{
        transform: `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${hovered?1.06:1})`,
        transition: hovered ? 'transform 0.1s ease' : 'transform 0.8s ease',
        transformStyle: 'preserve-3d',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px ${info.badge}40`
          : '0 8px 24px rgba(0,0,0,0.15)',
        cursor: 'default',
      }}>
        {/* Tarjeta */}
        <div style={{
          background: `linear-gradient(135deg, ${info.color1} 0%, ${info.color2} 100%)`,
          padding: hovered ? '14px 18px' : '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: hovered ? 200 : 160,
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Brillo 3D */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(180deg,rgba(255,255,255,0.12),transparent)',
            pointerEvents: 'none',
          }}/>

          {/* Foto o ícono */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {empleado?.foto_url ? (
              <img src={empleado.foto_url} alt=""
                style={{ width: hovered?46:38, height: hovered?46:38, borderRadius: '50%', objectFit:'cover', border:`2px solid ${info.badge}`, transition:'all 0.3s' }}/>
            ) : (
              <div style={{
                width: hovered?46:38, height: hovered?46:38,
                borderRadius: '50%',
                background: `rgba(255,255,255,0.15)`,
                border: `2px solid ${info.badge}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: hovered?20:16,
                transition: 'all 0.3s',
              }}>
                {info.icon}
              </div>
            )}
            {/* Badge rol */}
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              background: info.badge, borderRadius: '50%',
              width: 14, height: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, border: '2px solid #fff',
            }}>✓</div>
          </div>

          {/* Info */}
          <div>
            <div style={{
              fontSize: hovered ? 13 : 11,
              fontWeight: 900,
              color: '#fff',
              fontFamily: 'Montserrat,sans-serif',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              transition: 'all 0.3s',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}>
              {hovered ? nombre : nombre.split(' ')[0]}
            </div>
            <div style={{
              fontSize: hovered ? 10 : 9,
              fontWeight: 700,
              color: info.badge,
              fontFamily: 'Montserrat,sans-serif',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginTop: 2,
              transition: 'all 0.3s',
            }}>
              {info.label}
            </div>
            {hovered && empleado?.puesto && (
              <div style={{
                fontSize: 9, color: 'rgba(255,255,255,0.6)',
                fontFamily: 'Montserrat,sans-serif', fontWeight: 600,
                marginTop: 2, animation: 'fadeIn 0.2s ease',
              }}>
                {empleado.puesto}
              </div>
            )}
          </div>
        </div>

        {/* Línea inferior dorada */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, transparent, ${info.badge}, transparent)`,
        }}/>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
