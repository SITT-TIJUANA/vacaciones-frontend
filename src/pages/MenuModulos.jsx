import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MODULOS = [
  {
    id: 'vacaciones',
    icon: '🏖️',
    titulo: 'Control de',
    subtitulo: 'Vacaciones',
    desc: 'Gestión de períodos, solicitudes y permisos de vacaciones del personal',
    color1: '#6B0F2B',
    color2: '#C9A84C',
    glow: 'rgba(201,168,76,0.4)',
    ruta: '/dashboard',
    disponible: true,
  },
  {
    id: 'permisos',
    icon: '📋',
    titulo: 'Control de',
    subtitulo: 'Permisos',
    desc: 'Permisos con y sin goce de sueldo — médicos, escolares, personales y emergencias',
    color1: '#0a1f3d',
    color2: '#4A90D9',
    glow: 'rgba(74,144,217,0.4)',
    ruta: '/permisos',
    disponible: true,
  },
  {
    id: 'incapacidades',
    icon: '🏥',
    titulo: 'Control de',
    subtitulo: 'Incapacidades',
    desc: 'Registro y seguimiento de incapacidades del IMSS del personal',
    color1: '#0a2d1a',
    color2: '#27ae60',
    glow: 'rgba(39,174,96,0.4)',
    ruta: '/incapacidades',
    disponible: true,
  },
  {
    id: 'organigrama',
    icon: '📊',
    titulo: 'Organigrama',
    subtitulo: 'SITT',
    desc: 'Estructura organizacional del personal — visualiza jerarquías y departamentos',
    color1: '#1a1a2e',
    color2: '#C9A84C',
    glow: 'rgba(201,168,76,0.4)',
    ruta: '/organigrama',
    disponible: true,
    soloAdmin: false,
    destacado: false,
  },
  {
    id: 'personal',
    icon: '👥',
    titulo: 'Gestión de',
    subtitulo: 'Personal SITT',
    desc: 'Altas, bajas, directorio, historial y usuarios del sistema',
    color1: '#3d1a00',
    color2: '#C9A84C',
    glow: 'rgba(201,168,76,0.5)',
    ruta: '/personal',
    disponible: true,
    soloAdmin: true,
    destacado: true,
  },
];

export default function MenuModulos() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const { rolEfectivo } = useAuth();
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);

  const entrar = (mod) => {
    if (!mod.disponible) return;
    if (mod.soloAdmin && !esAdmin) return;
    navigate(mod.ruta);
  };

  const modulosFiltrados = MODULOS.filter(m => !m.soloAdmin || esAdmin);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(107,15,43,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.15) 0%, transparent 50%), #0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Montserrat, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Partículas de fondo */}
      <Particulas />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 'clamp(32px,6vh,60px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-30px)',
        transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ fontSize: 'clamp(10px,1.5vw,13px)', fontWeight: 700, color: 'rgba(201,168,76,0.7)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
          H. XXV Ayuntamiento de Tijuana
        </div>
        <div style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: '#fff', lineHeight: 1.1 }}>
          Sistema <span style={{ color: '#C9A84C' }}>Integral</span>
        </div>
        <div style={{ fontSize: 'clamp(12px,2vw,16px)', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 6, letterSpacing: 2 }}>
          SITT · Selecciona un módulo
        </div>
        <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C,transparent)', margin: '14px auto 0' }}/>
      </div>

      {/* Tarjetas 3D */}
      <div style={{
        display: 'flex',
        gap: 'clamp(16px,3vw,32px)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        position: 'relative', zIndex: 2,
        perspective: '1200px',
      }}>
        {modulosFiltrados.map((mod, i) => (
          <TarjetaPortal
            key={mod.id}
            mod={mod}
            index={i}
            visible={visible}
            hovered={hoverId === mod.id}
            onHover={() => setHoverId(mod.id)}
            onLeave={() => setHoverId(null)}
            onClick={() => entrar(mod)}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'clamp(32px,5vh,50px)',
        display: 'flex', alignItems: 'center', gap: 20,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1s ease 0.8s',
        position: 'relative', zIndex: 2,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>
          {usuario?.nombre || usuario?.username}
        </span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }}/>
        <button onClick={logout} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.4)', padding: '6px 16px',
          borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
          fontFamily: 'Montserrat,sans-serif',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
        >
          Cerrar sesión
        </button>
      </div>

      <style>{`
        @keyframes flotarP { 0%,100%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{transform:translateY(-20px) rotate(180deg);opacity:0.8} }
        @keyframes portal3d { 0%,100%{transform:perspective(800px) rotateY(-2deg) rotateX(1deg)} 50%{transform:perspective(800px) rotateY(2deg) rotateX(-1deg)} }
      `}</style>
    </div>
  );
}

function TarjetaPortal({ mod, index, visible, hovered, onHover, onLeave, onClick }) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        width: mod.destacado ? 'clamp(260px,30vw,360px)' : 'clamp(240px,28vw,320px)',
        minHeight: mod.destacado ? 'clamp(320px,42vh,460px)' : 'clamp(300px,38vh,420px)',
        position: 'relative',
        cursor: mod.disponible ? 'pointer' : 'default',
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered
            ? 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(-12px) scale(1.04)'
            : 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px) scale(1)'
          : `perspective(1000px) rotateY(${index===0?'-':'+'}15deg) translateY(60px)`,
        transition: `all ${hovered ? '0.3s' : '0.7s'} cubic-bezier(0.34,1.56,0.64,1) ${visible && !hovered ? index * 0.15 : 0}s`,
      }}
    >
      {/* Glow */}
      {hovered && mod.disponible && (
        <div style={{
          position: 'absolute', inset: -2, borderRadius: 24,
          background: `radial-gradient(ellipse at center, ${mod.glow} 0%, transparent 70%)`,
          filter: 'blur(20px)', zIndex: 0,
          animation: 'none',
        }}/>
      )}

      {/* Tarjeta */}
      <div style={{
        position: 'relative', zIndex: 1,
        height: '100%', minHeight: 'clamp(300px,38vh,420px)',
        borderRadius: 24,
        background: hovered && mod.disponible
          ? `linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered && mod.disponible ? mod.color2 : 'rgba(255,255,255,0.08)'}`,
        backdropFilter: 'blur(20px)',
        padding: 'clamp(24px,3vw,36px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s ease',
        boxShadow: hovered && mod.disponible
          ? `0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px ${mod.color2}40, inset 0 1px 0 rgba(255,255,255,0.1)`
          : '0 10px 40px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>

        {/* Fondo gradiente interior */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24,
          background: `linear-gradient(135deg, ${mod.color1}80 0%, transparent 60%)`,
          opacity: hovered ? 0.8 : 0.4,
          transition: 'opacity 0.3s',
        }}/>

        {/* Línea superior decorativa */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 2,
          background: `linear-gradient(90deg, transparent, ${mod.color2}, transparent)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s',
        }}/>

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%' }}>
          {/* Ícono */}
          <div style={{
            fontSize: 'clamp(48px,7vw,72px)', marginBottom: 16,
            filter: hovered && mod.disponible ? `drop-shadow(0 0 20px ${mod.glow})` : 'none',
            transform: hovered ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'block',
            animation: hovered ? 'none' : 'portal3d 4s ease-in-out infinite',
          }}>
            {mod.icon}
          </div>

          {/* Título */}
          <div style={{ fontSize: 'clamp(10px,1.3vw,12px)', fontWeight: 700, color: mod.color2, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4, opacity: 0.8 }}>
            {mod.titulo}
          </div>
          <div style={{
            fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900,
            fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
            color: '#fff', lineHeight: 1.1, marginBottom: 16,
            textShadow: hovered ? `0 0 30px ${mod.glow}` : 'none',
            transition: 'text-shadow 0.3s',
          }}>
            {mod.subtitulo}
          </div>

          {/* Descripción */}
          <div style={{
            fontSize: 'clamp(11px,1.2vw,13px)', color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6, fontWeight: 500,
            opacity: hovered ? 1 : 0.7, transition: 'opacity 0.3s',
          }}>
            {mod.desc}
          </div>
        </div>

        {/* Botón / Badge */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', marginTop: 24 }}>
          {mod.disponible ? (
            <div style={{
              padding: '12px 24px', borderRadius: 50, textAlign: 'center',
              background: hovered ? `linear-gradient(135deg, ${mod.color1}, ${mod.color2}40)` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${hovered ? mod.color2 : 'rgba(255,255,255,0.1)'}`,
              color: hovered ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontWeight: 800, letterSpacing: 1,
              transition: 'all 0.3s',
            }}>
              {hovered ? '→ Entrar' : 'Acceder'}
            </div>
          ) : (
            <div style={{
              padding: '10px 24px', borderRadius: 50, textAlign: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.2)',
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
            }}>
              ⏳ Próximamente
            </div>
          )}
        </div>
      </div>

      {/* Nota contraseña — solo empleado */}
      {!esAdmin && (
        <div style={{textAlign:'center',marginTop:24}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'8px 18px'}}>
            <span style={{fontSize:14}}>🔑</span>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:600}}>Para cambiar tu contraseña da clic en tu círculo de iniciales</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Particulas() {
  const pts = Array.from({length:30},(_,i)=>({
    id:i, left:Math.random()*100, top:Math.random()*100,
    size:Math.random()*3+1, dur:4+Math.random()*6,
    delay:Math.random()*4,
    color:i%3===0?'#C9A84C':i%3===1?'rgba(107,15,43,0.8)':'rgba(255,255,255,0.3)',
  }));
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      {pts.map(p=>(
        <div key={p.id} style={{
          position:'absolute', left:`${p.left}%`, top:`${p.top}%`,
          width:p.size, height:p.size, borderRadius:'50%', background:p.color,
          animation:`flotarP ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }}/>
      ))}
    </div>
  );
}
