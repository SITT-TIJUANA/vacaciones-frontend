import { useState, useEffect, useRef } from 'react';

const FRASES = [
  "¡GOOOL! 🇲🇽 ¡Vamos México al Mundial 2026!",
  "¡El Tri no para! ⚽ ¡Vamos por la Copa del Mundo!",
  "¡México de pie! 🦅 ¡El Mundial es nuestro!",
  "¡Arriba el Tri! 🇲🇽 ¡2026 es el año de México!",
  "¡Vamos México! ⚽ ¡El mundo nos va a ver brillar!",
];

// ── Penalty mini-game ──────────────────────────────────────
function PenaltyGame({ onGol, onSkip }) {
  const [fase, setFase] = useState('apuntar'); // apuntar | volando | gol | fallo
  const [balPos, setBalPos] = useState({ x: 50, y: 75 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 40 });
  const [frase, setFrase] = useState('');
  const canvasRef = useRef(null);

  const handleMove = (e) => {
    if (fase !== 'apuntar') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setMousePos({
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    });
  };

  const patear = () => {
    if (fase !== 'apuntar') return;
    setFase('volando');
    const targetX = mousePos.x;
    const targetY = mousePos.y;
    setBalPos({ x: targetX, y: targetY });

    setTimeout(() => {
      // Portería: x entre 20-80%, y entre 10-45%
      const enPorteria = targetX > 20 && targetX < 80 && targetY > 10 && targetY < 45;
      if (enPorteria) {
        setFase('gol');
        setFrase(FRASES[Math.floor(Math.random() * FRASES.length)]);
        setTimeout(() => onGol(), 3500);
      } else {
        setFase('fallo');
        setTimeout(() => {
          setFase('apuntar');
          setBalPos({ x: 50, y: 75 });
        }, 1500);
      }
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #1a472a 0%, #2d7a3a 40%, #4a9e52 70%, #6abf6e 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      {/* Estrellas/confetti de fondo */}
      {fase === 'gol' && (
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          {Array.from({length:40}).map((_,i) => (
            <div key={i} style={{
              position:'absolute',
              left: `${Math.random()*100}%`,
              top: `-${Math.random()*20}%`,
              width: 10, height: 10,
              borderRadius: '50%',
              background: ['#006847','#fff','#CE1126','#FFD700'][i%4],
              animation: `caer${i%3} ${0.8+Math.random()*1.5}s ease-in forwards`,
              animationDelay: `${Math.random()*0.5}s`,
            }} />
          ))}
        </div>
      )}

      {/* Título */}
      <div style={{ textAlign:'center', marginBottom:16, position:'relative', zIndex:2 }}>
        <div style={{ fontSize:'clamp(18px,4vw,28px)', fontWeight:900, color:'#FFD700', textShadow:'0 2px 8px rgba(0,0,0,0.5)', letterSpacing:1 }}>
          ⚽ SISTEMA VACACIONES SITT
        </div>
        <div style={{ fontSize:'clamp(12px,2.5vw,16px)', color:'rgba(255,255,255,0.85)', marginTop:4, fontWeight:700 }}>
          {fase === 'gol' ? '¡¡¡GOOOOOL!!!' : fase === 'fallo' ? '😅 ¡Intenta de nuevo!' : '¡Mete el penal para continuar! 🎯'}
        </div>
      </div>

      {/* Campo de juego */}
      <div
        ref={canvasRef}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onClick={patear}
        onTouchEnd={patear}
        style={{
          position: 'relative',
          width: 'min(420px, 90vw)',
          height: 'min(320px, 65vw)',
          background: 'linear-gradient(180deg,#2d7a3a,#3d9144)',
          borderRadius: 16,
          border: '3px solid rgba(255,255,255,0.3)',
          cursor: fase === 'apuntar' ? 'crosshair' : 'default',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Líneas del campo */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Semicírculo área penal */}
          <ellipse cx="50" cy="50" rx="20" ry="15" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
          {/* Punto penal */}
          <circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.6)"/>
          {/* Línea de fondo */}
          <line x1="0" y1="99" x2="100" y2="99" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
        </svg>

        {/* Portería */}
        <div style={{
          position:'absolute', left:'20%', top:'10%',
          width:'60%', height:'35%',
          border:'3px solid white',
          borderBottom:'none',
          boxShadow:'inset 0 0 20px rgba(0,0,0,0.3)',
          background: fase==='gol' ? 'rgba(255,215,0,0.3)' : 'rgba(0,0,0,0.2)',
          transition:'background 0.3s',
        }}>
          {/* Red */}
          <svg style={{width:'100%',height:'100%'}} viewBox="0 0 100 100">
            {[0,25,50,75,100].map(x=><line key={x} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>)}
            {[0,33,66,100].map(y=><line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>)}
          </svg>
        </div>

        {/* Portero */}
        <div style={{
          position:'absolute',
          left: fase === 'apuntar' ? `${30 + Math.sin(Date.now()/800)*20}%` : fase === 'gol' ? '10%' : '60%',
          top:'15%',
          fontSize:'clamp(20px,5vw,32px)',
          transition: fase === 'volando' ? 'left 0.4s ease' : 'left 0.8s ease',
          filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          userSelect:'none',
        }}>🧤</div>

        {/* Mira/cursor */}
        {fase === 'apuntar' && (
          <div style={{
            position:'absolute',
            left:`${mousePos.x}%`, top:`${mousePos.y}%`,
            transform:'translate(-50%,-50%)',
            pointerEvents:'none',
            fontSize:24,
            filter:'drop-shadow(0 0 6px rgba(255,215,0,0.8))',
          }}>🎯</div>
        )}

        {/* Balón */}
        <div style={{
          position:'absolute',
          left:`${balPos.x}%`, top:`${balPos.y}%`,
          transform:'translate(-50%,-50%)',
          fontSize:'clamp(24px,6vw,36px)',
          transition: fase === 'volando' ? 'all 0.6s cubic-bezier(0.2,0,0.8,1)' : 'none',
          filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          animation: fase === 'gol' ? 'spin 0.5s linear infinite' : 'none',
        }}>⚽</div>

        {/* GOL overlay */}
        {fase === 'gol' && (
          <div style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(0,0,0,0.4)',
            animation:'fadeIn 0.3s ease',
          }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'clamp(32px,8vw,56px)', fontWeight:900, color:'#FFD700', textShadow:'0 0 20px rgba(255,215,0,0.8)', animation:'pulse 0.5s ease infinite alternate' }}>
                ¡GOOOOL!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logo y frase de celebración */}
      {fase === 'gol' && (
        <div style={{ textAlign:'center', marginTop:20, animation:'fadeIn 0.5s ease', position:'relative', zIndex:2 }}>
          <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="México" style={{
            width:'clamp(80px,15vw,120px)',
            filter:'drop-shadow(0 0 20px rgba(255,215,0,0.6))',
            animation:'spin3d 1s ease-in-out infinite alternate',
          }} />
          <div style={{ fontSize:'clamp(13px,2.5vw,18px)', fontWeight:900, color:'#FFD700', marginTop:10, textShadow:'0 2px 8px rgba(0,0,0,0.5)', maxWidth:320, textAlign:'center' }}>
            {frase}
          </div>
          <div style={{ fontSize:'clamp(11px,2vw,14px)', color:'rgba(255,255,255,0.85)', marginTop:6, fontWeight:700 }}>
            🏆 Mundial 2026 — ¡El Tri va por todo!
          </div>
        </div>
      )}

      {/* Instrucción */}
      {fase === 'apuntar' && (
        <div style={{ marginTop:12, fontSize:'clamp(11px,2vw,14px)', color:'rgba(255,255,255,0.7)', fontWeight:600, textAlign:'center' }}>
          Mueve el cursor y da clic para patear
        </div>
      )}

      {/* Botón skip */}
      <button onClick={onSkip} style={{
        marginTop:16, padding:'8px 20px',
        background:'rgba(255,255,255,0.15)',
        border:'1px solid rgba(255,255,255,0.3)',
        borderRadius:20, color:'rgba(255,255,255,0.7)',
        fontFamily:'Montserrat,sans-serif', fontWeight:700,
        fontSize:12, cursor:'pointer',
        backdropFilter:'blur(4px)',
      }}>
        ✕ Ahora no, entrar directo
      </button>

      <style>{`
        @keyframes caer0 { to { transform: translateY(110vh) rotate(360deg); opacity:0; } }
        @keyframes caer1 { to { transform: translateY(110vh) rotate(-360deg); opacity:0; } }
        @keyframes caer2 { to { transform: translateY(110vh) rotate(180deg); opacity:0; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse { from { transform:scale(1); } to { transform:scale(1.1); } }
        @keyframes spin { to { transform:translate(-50%,-50%) rotate(360deg); } }
        @keyframes spin3d { from { transform:rotateY(0deg) scale(1); } to { transform:rotateY(20deg) scale(1.05); } }
      `}</style>
    </div>
  );
}

// ── Bandera flotante ───────────────────────────────────────
function BanderaMexico({ onQuitarTema }) {
  return (
    <div style={{
      position:'fixed', bottom:80, right:16, zIndex:1000,
      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
    }}>
      <img
        src="/vacaciones-frontend/bandera-mexico.png"
        alt="México"
        style={{
          width:64, height:'auto',
          filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
          animation:'wave 2s ease-in-out infinite',
          transformOrigin:'bottom left',
        }}
      />
      <button onClick={onQuitarTema} style={{
        padding:'4px 10px',
        background:'rgba(0,0,0,0.6)',
        border:'1px solid rgba(255,255,255,0.3)',
        borderRadius:12, color:'white',
        fontFamily:'Montserrat,sans-serif', fontWeight:700,
        fontSize:9, cursor:'pointer', whiteSpace:'nowrap',
      }}>
        🎨 Quitar tema
      </button>
      <style>{`
        @keyframes wave {
          0%,100% { transform: rotate(-5deg) translateY(0); }
          25% { transform: rotate(5deg) translateY(-4px); }
          50% { transform: rotate(-3deg) translateY(-2px); }
          75% { transform: rotate(4deg) translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

// ── Tema México CSS ────────────────────────────────────────
const MEXICO_CSS = `
  :root {
    --g: #006847 !important;
    --d: #CE1126 !important;
    --d-dk: #a00d1e !important;
    --dorado: #CE1126 !important;
    --g-soft: rgba(0,104,71,0.08) !important;
    --g10: rgba(0,104,71,0.1) !important;
    --g20: rgba(0,104,71,0.2) !important;
    --g60: rgba(0,104,71,0.6) !important;
  }
  .bottom-nav { background: linear-gradient(135deg,#006847,#004d35) !important; }
  .btn-institucional.filled { background: linear-gradient(135deg,#006847,#004d35) !important; }
  .btn-institucional.dorado { border-color: #CE1126 !important; color: #CE1126 !important; }
  header { background: linear-gradient(135deg,#006847 0%,#004d35 60%,#CE1126 100%) !important; }
`;

// ── Export principal ───────────────────────────────────────
export default function MexicoMode() {
  const [estado, setEstado] = useState(() => {
    const visto = sessionStorage.getItem('mexico-visto');
    const tema = localStorage.getItem('mexico-tema') === 'true';
    return { mostrarJuego: !visto, temaMexico: tema };
  });
  const styleRef = useRef(null);

  useEffect(() => {
    if (estado.temaMexico) aplicarTema();
    else quitarTema();
  }, [estado.temaMexico]);

  const aplicarTema = () => {
    if (!styleRef.current) {
      const el = document.createElement('style');
      el.id = 'mexico-tema';
      document.head.appendChild(el);
      styleRef.current = el;
    }
    styleRef.current.textContent = MEXICO_CSS;
  };

  const quitarTema = () => {
    const el = document.getElementById('mexico-tema');
    if (el) el.remove();
    styleRef.current = null;
  };

  const onGol = () => {
    sessionStorage.setItem('mexico-visto', '1');
    localStorage.setItem('mexico-tema', 'true');
    setEstado({ mostrarJuego: false, temaMexico: true });
  };

  const onSkip = () => {
    sessionStorage.setItem('mexico-visto', '1');
    setEstado(e => ({ ...e, mostrarJuego: false }));
  };

  const onQuitarTema = () => {
    localStorage.setItem('mexico-tema', 'false');
    setEstado(e => ({ ...e, temaMexico: false }));
  };

  return (
    <>
      {estado.mostrarJuego && <PenaltyGame onGol={onGol} onSkip={onSkip} />}
      {!estado.mostrarJuego && estado.temaMexico && <BanderaMexico onQuitarTema={onQuitarTema} />}
    </>
  );
}
