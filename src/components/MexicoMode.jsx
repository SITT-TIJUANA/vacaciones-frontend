import { useState, useEffect, useRef } from 'react';

const FRASES_GOL = [
  "¡¡¡GOOOOOL DE MÉXICO!!!",
  "¡¡EL TRI LO LOGRÓ!!",
  "¡¡ANOTÓ MÉXICO!!",
];

const FRASES_SUB = [
  "🏆 ¡Vamos México! ¡El Mundial 2026 es nuestro!",
  "🦅 ¡El Tri no para! ¡Vamos por la Copa!",
  "⚽ ¡México al Mundial 2026! ¡Arriba el Tri!",
  "🇲🇽 ¡2026 es el año de México! ¡Vamos con todo!",
];

// ── Confetti ──
function Confetti() {
  const pieces = Array.from({length:60}, (_,i) => ({
    id:i,
    left: Math.random()*100,
    delay: Math.random()*1.5,
    dur: 1.5+Math.random()*2,
    color: ['#006847','#ffffff','#CE1126','#FFD700','#00a86b','#ff4444'][i%6],
    size: 6+Math.random()*10,
    rotate: Math.random()*360,
  }));
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:10001,overflow:'hidden'}}>
      {pieces.map(p=>(
        <div key={p.id} style={{
          position:'absolute', left:`${p.left}%`, top:'-20px',
          width:p.size, height:p.size*(Math.random()>0.5?1:2.5),
          background:p.color, borderRadius:Math.random()>0.5?'50%':2,
          animation:`confettiFall ${p.dur}s ease-in ${p.delay}s infinite`,
          transform:`rotate(${p.rotate}deg)`,
        }}/>
      ))}
      <style>{`
        @keyframes confettiFall {
          0%{transform:translateY(-20px) rotate(0deg);opacity:1}
          100%{transform:translateY(110vh) rotate(720deg);opacity:0}
        }
      `}</style>
    </div>
  );
}

// ── Pantalla Gol ──
function PantallaGol({ onContinuar }) {
  const [frase] = useState(FRASES_GOL[Math.floor(Math.random()*FRASES_GOL.length)]);
  const [subFrase] = useState(FRASES_SUB[Math.floor(Math.random()*FRASES_SUB.length)]);
  const [partido, setPartido] = useState(null);

  useEffect(() => {
    // Buscar último resultado de México via API pública
    fetch('https://api.football-data.org/v4/teams/1392/matches?status=FINISHED&limit=1', {
      headers: { 'X-Auth-Token': '9e7e61e0f4e44f4e8c4a6e2b3d1f5a8c' }
    })
    .then(r => r.json())
    .then(data => {
      const m = data.matches?.[0];
      if (!m) return;
      const esLocal = m.homeTeam?.id === 1392 || m.homeTeam?.name?.includes('Mexico');
      const rival = esLocal ? m.awayTeam?.name : m.homeTeam?.name;
      const golMex = esLocal ? m.score?.fullTime?.home : m.score?.fullTime?.away;
      const golRival = esLocal ? m.score?.fullTime?.away : m.score?.fullTime?.home;
      const fecha = new Date(m.utcDate).toLocaleDateString('es-MX',{day:'numeric',month:'long'});
      const competicion = m.competition?.name || '';
      if (golMex !== null && golRival !== null) {
        setPartido({ rival, golMex, golRival, fecha, competicion,
          gano: golMex > golRival, empato: golMex === golRival });
      }
    })
    .catch(() => {
      // Fallback con resultado de hoy hardcodeado
      setPartido({ rival: 'Sudáfrica', golMex: 2, golRival: 0,
        fecha: '11 de junio', competicion: 'Copa del Mundo 2026',
        gano: true, empato: false,
        goles: "Quiñones 8' · Jiménez 65'",
        proximo: '¡Vamos por Corea del Sur! 🔥' });
    });
  }, []);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:10000,
      background:'linear-gradient(135deg, #006847 0%, #004d35 50%, #003d2a 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:'Montserrat,sans-serif', padding:20,
      animation:'fadeInGol 0.4s ease',
    }}>
      <Confetti/>

      {/* GOL texto */}
      <div style={{
        fontSize:'clamp(52px,14vw,110px)', fontWeight:900, color:'#FFD700',
        textShadow:'0 0 40px rgba(255,215,0,0.8), 0 4px 20px rgba(0,0,0,0.5)',
        letterSpacing:4, animation:'pulseGol 0.6s ease infinite alternate',
        lineHeight:1, zIndex:2, position:'relative',
      }}>¡GOOOL!</div>

      {/* Logo girando */}
      <div style={{
        margin:'20px 0', zIndex:2, position:'relative',
        animation:'spin3D 2s ease-in-out infinite',
        filter:'drop-shadow(0 0 30px rgba(255,215,0,0.6))',
      }}>
        <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="México"
          style={{ width:'clamp(140px,25vw,220px)', display:'block' }}/>
      </div>

      {/* Frases */}
      <div style={{
        fontSize:'clamp(18px,4vw,28px)', fontWeight:900, color:'#FFD700',
        textShadow:'0 2px 12px rgba(0,0,0,0.6)', textAlign:'center',
        maxWidth:480, lineHeight:1.3, zIndex:2, position:'relative',
        animation:'fadeUp 0.5s ease 0.3s both',
      }}>{frase}</div>

      <div style={{
        fontSize:'clamp(14px,3vw,20px)', fontWeight:700, color:'rgba(255,255,255,0.9)',
        textAlign:'center', maxWidth:400, marginTop:10,
        zIndex:2, position:'relative', animation:'fadeUp 0.5s ease 0.5s both',
      }}>{subFrase}</div>

      {/* Marcador México */}
      {partido && (
        <div style={{
          marginTop:18, zIndex:2, position:'relative',
          background:'rgba(0,0,0,0.45)', borderRadius:16,
          padding:'14px 24px', backdropFilter:'blur(8px)',
          border:'1.5px solid rgba(255,215,0,0.3)',
          textAlign:'center', animation:'fadeUp 0.5s ease 0.8s both',
          minWidth:280,
        }}>
          <div style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700,
            color:'rgba(255,215,0,0.8)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
            🏆 {partido.competicion} · {partido.fecha}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:28 }}>🇲🇽</div>
              <div style={{ fontSize:11, color:'white', fontWeight:800, fontFamily:'Montserrat,sans-serif' }}>MÉXICO</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'clamp(28px,7vw,42px)', fontWeight:900, color:'#FFD700',
                fontFamily:'Montserrat,sans-serif', lineHeight:1,
                textShadow:'0 0 20px rgba(255,215,0,0.5)' }}>
                {partido.golMex} - {partido.golRival}
              </div>
              <div style={{ fontSize:10, color:partido.gano?'#4ade80':partido.empato?'#FFD700':'#f87171',
                fontWeight:800, marginTop:2, fontFamily:'Montserrat,sans-serif' }}>
                {partido.gano ? '✅ VICTORIA' : partido.empato ? '🤝 EMPATE' : '❌ DERROTA'}
              </div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:28 }}>🌍</div>
              <div style={{ fontSize:11, color:'white', fontWeight:800, fontFamily:'Montserrat,sans-serif',
                maxWidth:70, lineHeight:1.2 }}>{partido.rival?.toUpperCase()}</div>
            </div>
          </div>
          {partido.goles && (
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:8,
              fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>
              ⚽ {partido.goles}
            </div>
          )}
          {partido.proximo && (
            <div style={{ fontSize:12, color:'#FFD700', marginTop:6,
              fontFamily:'Montserrat,sans-serif', fontWeight:800 }}>
              {partido.proximo}
            </div>
          )}
        </div>
      )}

      {/* Botón continuar */}
      <button onClick={onContinuar} style={{
        marginTop:32, padding:'16px 40px',
        background:'linear-gradient(135deg,#CE1126,#a00d1e)',
        border:'3px solid #FFD700', borderRadius:50,
        color:'#FFD700', fontFamily:'Montserrat,sans-serif',
        fontWeight:900, fontSize:'clamp(14px,3vw,18px)',
        cursor:'pointer', letterSpacing:1,
        boxShadow:'0 8px 32px rgba(206,17,38,0.5), 0 0 0 0 rgba(255,215,0,0.4)',
        animation:'fadeUp 0.5s ease 0.7s both, ctaBlink 1.5s ease 1.2s infinite',
        zIndex:2, position:'relative',
      }}>
        🇲🇽 ¡Continuar con el sistema!
      </button>

      <style>{`
        @keyframes fadeInGol{from{opacity:0}to{opacity:1}}
        @keyframes pulseGol{from{transform:scale(1)}to{transform:scale(1.06)}}
        @keyframes spin3D{
          0%{transform:perspective(600px) rotateY(-15deg) scale(1)}
          50%{transform:perspective(600px) rotateY(15deg) scale(1.05)}
          100%{transform:perspective(600px) rotateY(-15deg) scale(1)}
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ctaBlink{
          0%,100%{box-shadow:0 8px 32px rgba(206,17,38,0.5),0 0 0 0 rgba(255,215,0,0.4)}
          50%{box-shadow:0 8px 32px rgba(206,17,38,0.5),0 0 0 12px rgba(255,215,0,0)}
        }
      `}</style>
    </div>
  );
}

// ── Mini juego penalti ──
function PenaltyGame({ onGol, onSkip }) {
  const [fase, setFase] = useState('listo'); // listo | cargando | volando | gol | fallo
  const [balPos, setBalPos] = useState({x:50, y:82});
  const [target, setTarget] = useState({x:50, y:28});
  const [porteroX, setPorteroX] = useState(50);
  const fieldRef = useRef(null);
  const animRef = useRef(null);

  // Portero se mueve solo
  useEffect(() => {
    if (fase !== 'listo' && fase !== 'cargando') return;
    const interval = setInterval(() => {
      setPorteroX(x => {
        const delta = (Math.random()-0.5)*25;
        return Math.max(25, Math.min(75, x+delta));
      });
    }, 700);
    return () => clearInterval(interval);
  }, [fase]);

  const handleMove = (e) => {
    if (fase !== 'listo' && fase !== 'cargando') return;
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(20, Math.min(80, ((clientX-rect.left)/rect.width)*100));
    const y = Math.max(8, Math.min(45, ((clientY-rect.top)/rect.height)*100));
    setTarget({x, y});
    setFase('cargando');
  };

  const patear = () => {
    if (fase === 'volando' || fase === 'gol') return;
    setFase('volando');
    const tx = target.x, ty = target.y;
    setBalPos({x:tx, y:ty});

    setTimeout(() => {
      const enPorteria = tx>20 && tx<80 && ty>8 && ty<45;
      const porteroAtrapa = Math.abs(tx - porteroX) < 12;
      if (enPorteria && !porteroAtrapa) {
        setFase('gol');
        setTimeout(() => onGol(), 800);
      } else {
        setFase('fallo');
        setTimeout(() => {
          setFase('listo');
          setBalPos({x:50, y:82});
          setTarget({x:50, y:28});
        }, 1200);
      }
    }, 550);
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:10000,
      background:'linear-gradient(180deg,#1a3a2a 0%,#0d4a2a 30%,#1a6635 60%,#2d8040 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:'Montserrat,sans-serif', userSelect:'none',
    }}>
      {/* Header */}
      <div style={{textAlign:'center', marginBottom:12}}>
        <div style={{fontSize:'clamp(16px,3.5vw,24px)', fontWeight:900, color:'#FFD700',
          textShadow:'0 2px 10px rgba(0,0,0,0.6)', letterSpacing:1}}>
          ⚽ SISTEMA VACACIONES SITT
        </div>
        <div style={{fontSize:'clamp(11px,2.2vw,15px)', color:'rgba(255,255,255,0.8)', marginTop:4, fontWeight:700}}>
          {fase==='fallo' ? '😅 ¡Casi! Intenta de nuevo' :
           fase==='gol' ? '🎉 ¡Goool!' :
           fase==='cargando' ? '🎯 ¡Apunta bien y da clic!' :
           '🎯 Mueve el cursor sobre la portería y da clic para patear'}
        </div>
      </div>

      {/* Campo */}
      <div
        ref={fieldRef}
        onMouseMove={handleMove}
        onTouchMove={e=>{e.preventDefault();handleMove(e);}}
        onClick={patear}
        onTouchEnd={e=>{e.preventDefault();patear();}}
        style={{
          position:'relative',
          width:'min(460px,92vw)', height:'min(340px,68vw)',
          background:'linear-gradient(180deg,#1e7a3a 0%,#28924a 100%)',
          borderRadius:16, overflow:'hidden',
          border:'2px solid rgba(255,255,255,0.25)',
          cursor: fase==='listo'||fase==='cargando' ? 'none' : 'default',
          boxShadow:'0 12px 40px rgba(0,0,0,0.5)',
          touchAction:'none',
        }}
      >
        {/* Césped líneas */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 100 100" preserveAspectRatio="none">
          {[0,10,20,30,40,50,60,70,80,90,100].map(x=>(
            <rect key={x} x={x} y="0" width="10" height="100"
              fill={x%20===0?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)"}/>
          ))}
          <ellipse cx="50" cy="82" rx="18" ry="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
          <circle cx="50" cy="82" r="1.2" fill="rgba(255,255,255,0.5)"/>
          <line x1="0" y1="99" x2="100" y2="99" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4"/>
        </svg>

        {/* Fondo portería - red */}
        <div style={{
          position:'absolute', left:'18%', top:'5%', width:'64%', height:'42%',
          background:'rgba(0,0,0,0.25)',
          border:'none',
        }}>
          <svg style={{width:'100%',height:'100%'}} viewBox="0 0 100 100">
            {[0,12.5,25,37.5,50,62.5,75,87.5,100].map(x=>(
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2"/>
            ))}
            {[0,20,40,60,80,100].map(y=>(
              <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1.2"/>
            ))}
          </svg>
        </div>

        {/* Portería marcos */}
        <div style={{
          position:'absolute', left:'18%', top:'5%', width:'64%', height:'42%',
          border:'3.5px solid white',
          borderBottom:'none',
          borderRadius:'3px 3px 0 0',
          boxShadow:'inset 0 0 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.4)',
          background: fase==='gol' ? 'rgba(255,215,0,0.2)' : 'transparent',
          transition:'background 0.3s',
          pointerEvents:'none',
        }}/>

        {/* Postes laterales 3D */}
        <div style={{position:'absolute',left:'18%',top:'5%',width:7,height:'42%',
          background:'linear-gradient(90deg,#aaa,white,#ddd)',borderRadius:2,pointerEvents:'none'}}/>
        <div style={{position:'absolute',right:'18%',top:'5%',width:7,height:'42%',
          background:'linear-gradient(90deg,#ddd,white,#aaa)',borderRadius:2,pointerEvents:'none'}}/>
        <div style={{position:'absolute',left:'18%',top:'5%',height:7,width:'64%',
          background:'linear-gradient(180deg,#aaa,white)',borderRadius:2,pointerEvents:'none'}}/>

        {/* Portero - emoji futbolista */}
        <div style={{
          position:'absolute',
          left:`${porteroX}%`, top:'8%',
          transform:'translateX(-50%)',
          fontSize:'clamp(28px,7vw,44px)',
          transition:'left 0.5s cubic-bezier(0.3,1.5,0.7,1)',
          filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
          pointerEvents:'none', lineHeight:1,
        }}>🧤</div>

        {/* Logo Tri - jugador México */}
        <div style={{
          position:'absolute', left:'50%', bottom:'14%',
          transform:'translateX(-50%)',
          pointerEvents:'none',
          filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.7))',
          zIndex:4,
        }}>
          <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="México"
            style={{ width:'clamp(36px,8vw,52px)', display:'block' }} />
        </div>

        {/* Cursor/mira */}
        {(fase==='listo'||fase==='cargando') && (
          <div style={{
            position:'absolute',
            left:`${target.x}%`, top:`${target.y}%`,
            transform:'translate(-50%,-50%)',
            pointerEvents:'none', zIndex:10,
          }}>
            <div style={{
              width:28, height:28,
              border:`2.5px solid ${fase==='cargando'?'#FFD700':'rgba(255,255,255,0.8)'}`,
              borderRadius:'50%', position:'relative',
              boxShadow:`0 0 0 3px rgba(255,215,0,${fase==='cargando'?0.3:0.1})`,
              transition:'border-color 0.2s',
            }}>
              <div style={{position:'absolute',left:'50%',top:0,width:1.5,height:8,background:'currentColor',transform:'translateX(-50%)',color:fase==='cargando'?'#FFD700':'rgba(255,255,255,0.8)'}}/>
              <div style={{position:'absolute',left:'50%',bottom:0,width:1.5,height:8,background:'currentColor',transform:'translateX(-50%)',color:fase==='cargando'?'#FFD700':'rgba(255,255,255,0.8)'}}/>
              <div style={{position:'absolute',top:'50%',left:0,height:1.5,width:8,background:'currentColor',transform:'translateY(-50%)',color:fase==='cargando'?'#FFD700':'rgba(255,255,255,0.8)'}}/>
              <div style={{position:'absolute',top:'50%',right:0,height:1.5,width:8,background:'currentColor',transform:'translateY(-50%)',color:fase==='cargando'?'#FFD700':'rgba(255,255,255,0.8)'}}/>
            </div>
          </div>
        )}

        {/* Balón */}
        <div style={{
          position:'absolute',
          left:`${balPos.x}%`, top:`${balPos.y}%`,
          transform:'translate(-50%,-50%)',
          fontSize:'clamp(22px,5.5vw,34px)',
          transition: fase==='volando' ? 'all 0.55s cubic-bezier(0.15,0.5,0.7,1)' : 'none',
          filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          animation: fase==='gol' ? 'balSpin 0.3s linear infinite' : 'none',
          pointerEvents:'none',
          zIndex:5,
        }}>⚽</div>

        {/* Fallo overlay */}
        {fase==='fallo' && (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',
            justifyContent:'center',background:'rgba(206,17,38,0.3)',
            animation:'fadeIn 0.2s ease'}}>
            <div style={{fontSize:'clamp(28px,7vw,44px)',fontWeight:900,color:'white',
              textShadow:'0 2px 8px rgba(0,0,0,0.8)'}}>¡Fuera!</div>
          </div>
        )}

        <style>{`
          @keyframes balSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        `}</style>
      </div>

      {/* Instrucción */}
      <div style={{
        marginTop:10, padding:'8px 18px',
        background:'rgba(0,0,0,0.4)', borderRadius:20,
        color:'rgba(255,255,255,0.75)', fontSize:'clamp(10px,2vw,13px)',
        fontWeight:700, backdropFilter:'blur(4px)',
      }}>
        {fase==='cargando' ? '🎯 ¡Da clic para patear!' : '🖱️ Mueve y da clic · 📱 Toca la portería'}
      </div>

      {/* Botón skip */}
      <button onClick={onSkip} style={{
        marginTop:14, padding:'10px 24px',
        background:'rgba(255,255,255,0.1)',
        border:'1.5px solid rgba(255,255,255,0.25)',
        borderRadius:24, color:'rgba(255,255,255,0.65)',
        fontFamily:'Montserrat,sans-serif', fontWeight:700,
        fontSize:'clamp(11px,2.2vw,13px)', cursor:'pointer',
        backdropFilter:'blur(6px)',
        transition:'all 0.2s',
      }}
        onMouseEnter={e=>{e.target.style.background='rgba(255,255,255,0.2)';e.target.style.color='white';}}
        onMouseLeave={e=>{e.target.style.background='rgba(255,255,255,0.1)';e.target.style.color='rgba(255,255,255,0.65)';}}>
        ✕ Ahora no — Continuar con el sistema normal
      </button>
    </div>
  );
}

// ── Bandera flotante ondeando ──
function BanderaMexico({ onQuitarTema }) {
  return (
    <div style={{
      position:'fixed', bottom:76, right:14, zIndex:1000,
      display:'flex', flexDirection:'column', alignItems:'center', gap:5,
      filter:'drop-shadow(0 4px 16px rgba(0,0,0,0.3))',
    }}>
      <img src="/vacaciones-frontend/bandera-mexico.png" alt="🇲🇽"
        style={{
          width:68, height:'auto',
          animation:'banderaWave 1.8s ease-in-out infinite',
          transformOrigin:'15% 90%',
        }}
      />
      <button onClick={onQuitarTema} style={{
        padding:'4px 10px', background:'rgba(0,0,0,0.65)',
        border:'1px solid rgba(255,255,255,0.2)', borderRadius:12,
        color:'white', fontFamily:'Montserrat,sans-serif',
        fontWeight:700, fontSize:9, cursor:'pointer', whiteSpace:'nowrap',
        backdropFilter:'blur(4px)',
      }}>🎨 Quitar tema México</button>
      <style>{`
        @keyframes banderaWave {
          0%   { transform: rotate(-6deg) skewX(2deg); }
          20%  { transform: rotate(4deg) skewX(-3deg); }
          40%  { transform: rotate(-4deg) skewX(2deg); }
          60%  { transform: rotate(5deg) skewX(-2deg); }
          80%  { transform: rotate(-3deg) skewX(1deg); }
          100% { transform: rotate(-6deg) skewX(2deg); }
        }
      `}</style>
    </div>
  );
}

// ── CSS tema México ──
const MEXICO_CSS = `
  :root {
    --g: #006847 !important;
    --d: #CE1126 !important;
    --d-dk: #a30d1e !important;
    --g-soft: rgba(0,104,71,0.07) !important;
    --g10: rgba(0,104,71,0.1) !important;
    --g20: rgba(0,104,71,0.2) !important;
    --g60: rgba(0,104,71,0.6) !important;
  }
  .bottom-nav {
    background: linear-gradient(135deg, #004d35 0%, #006847 50%, #004d35 100%) !important;
    border-top: 2px solid #CE1126 !important;
  }
  .bottom-nav-item.active { color: #FFD700 !important; }
  .btn-institucional.filled { background: linear-gradient(135deg,#006847,#004d35) !important; }
  .btn-institucional.dorado { border-color:#CE1126 !important; color:#CE1126 !important; }
  header, .dash-header {
    background: linear-gradient(135deg, #004d35 0%, #006847 60%, #CE1126 100%) !important;
  }
  .card { border-top: 2px solid rgba(0,104,71,0.15) !important; }
`;

// ── Elementos flotantes en login ──
export function LoginMexicoEggs() {
  const [fase, setFase] = useState('idle'); // idle | juego | gol
  const [balPos, setBalPos] = useState({ x: 15, y: 60 });
  const [logoPos, setLogoPos] = useState({ x: 78, y: 25 });
  const [balDir, setBalDir] = useState({ x: 0.4, y: -0.3 });
  const [logoDir, setLogoDir] = useState({ x: -0.3, y: 0.4 });
  const animRef = useRef(null);

  // Animación de rebote
  useEffect(() => {
    if (fase !== 'idle') return;
    const animate = () => {
      setBalPos(p => {
        let nx = p.x + balDir.x;
        let ny = p.y + balDir.y;
        if (nx <= 2 || nx >= 88) { balDir.x *= -1; nx = Math.max(2, Math.min(88, nx)); }
        if (ny <= 5 || ny >= 88) { balDir.y *= -1; ny = Math.max(5, Math.min(88, ny)); }
        return { x: nx, y: ny };
      });
      setLogoPos(p => {
        let nx = p.x + logoDir.x;
        let ny = p.y + logoDir.y;
        if (nx <= 2 || nx >= 88) { logoDir.x *= -1; nx = Math.max(2, Math.min(88, nx)); }
        if (ny <= 5 || ny >= 88) { logoDir.y *= -1; ny = Math.max(5, Math.min(88, ny)); }
        return { x: nx, y: ny };
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [fase]);

  const activar = () => { cancelAnimationFrame(animRef.current); setFase('juego'); };
  const onGol = () => setFase('gol');
  const onContinuar = () => { localStorage.setItem('mx-tema','1'); setFase('idle'); };
  const onSkip = () => setFase('idle');

  if (fase === 'juego') return <PenaltyGame onGol={onGol} onSkip={onSkip} />;
  if (fase === 'gol') return <PantallaGol onContinuar={onContinuar} />;

  return (
    <>
      {/* Balón rebotando */}
      <div
        onClick={activar}
        title="⚽ ¡Haz clic!"
        style={{
          position:'fixed',
          left:`${balPos.x}%`, top:`${balPos.y}%`,
          zIndex:999, cursor:'pointer',
          animation:'rotateBal 1.5s linear infinite',
          filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
          transition:'left 0.016s linear, top 0.016s linear',
          userSelect:'none',
        }}>
        {/* Balón SVG con texto Mundial 2026 */}
        <svg width="54" height="54" viewBox="0 0 54 54">
          <defs>
            <radialGradient id="balGrad" cx="38%" cy="32%">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="60%" stopColor="#e8e8e8"/>
              <stop offset="100%" stopColor="#999"/>
            </radialGradient>
          </defs>
          {/* Sombra */}
          <ellipse cx="27" cy="51" rx="12" ry="3" fill="rgba(0,0,0,0.15)"/>
          {/* Balón */}
          <circle cx="27" cy="26" r="22" fill="url(#balGrad)" stroke="#ccc" strokeWidth="0.5"/>
          {/* Pentágonos negros */}
          <polygon points="27,8 33,13 31,20 23,20 21,13" fill="#222" opacity="0.85"/>
          <polygon points="8,20 14,16 20,20 18,27 11,27" fill="#222" opacity="0.85"/>
          <polygon points="46,20 40,16 34,20 36,27 43,27" fill="#222" opacity="0.85"/>
          <polygon points="12,38 11,31 18,29 22,35 18,41" fill="#222" opacity="0.85"/>
          <polygon points="42,38 43,31 36,29 32,35 36,41" fill="#222" opacity="0.85"/>
          <polygon points="27,44 22,40 24,34 30,34 32,40" fill="#222" opacity="0.85"/>
          {/* Brillo */}
          <ellipse cx="20" cy="17" rx="6" ry="4" fill="rgba(255,255,255,0.5)" transform="rotate(-20,20,17)"/>
          {/* Texto Mundial 2026 */}
          <text x="27" y="25" textAnchor="middle" fontSize="5.5" fontFamily="Arial,sans-serif" fontWeight="900" fill="#006847" letterSpacing="0.2">MUNDIAL</text>
          <text x="27" y="32" textAnchor="middle" fontSize="7" fontFamily="Arial,sans-serif" fontWeight="900" fill="#CE1126">2026</text>
        </svg>
        <style>{`@keyframes rotateBal{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* Escudo Tri flotando */}
      <div
        onClick={activar}
        title="🇲🇽 ¡Haz clic!"
        style={{
          position:'fixed',
          left:`${logoPos.x}%`, top:`${logoPos.y}%`,
          zIndex:999, cursor:'pointer',
          animation:'triFloat 3s ease-in-out infinite',
          filter:'drop-shadow(0 6px 16px rgba(0,104,71,0.4))',
          transition:'left 0.016s linear, top 0.016s linear',
          userSelect:'none',
        }}>
        <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="🇲🇽"
          style={{ width:44, height:44, display:'block', objectFit:'contain' }}/>
        <style>{`
          @keyframes triFloat{
            0%,100%{transform:perspective(200px) rotateY(-12deg) scale(1)}
            50%{transform:perspective(200px) rotateY(12deg) scale(1.06)}
          }
        `}</style>
      </div>
    </>
  );
}

// ── Componente principal (dentro del sistema) ──
export default function MexicoMode() {
  const [temaMexico] = useState(() => localStorage.getItem('mx-tema') === '1');
  const styleEl = useRef(null);

  useEffect(() => {
    if (temaMexico) {
      if (!styleEl.current) {
        const el = document.createElement('style');
        el.id = 'mx-style';
        document.head.appendChild(el);
        styleEl.current = el;
      }
      styleEl.current.textContent = MEXICO_CSS;
    }
    return () => {
      const el = document.getElementById('mx-style');
      if (el) el.remove();
    };
  }, [temaMexico]);

  const [mostrarBandera, setMostrarBandera] = useState(temaMexico);

  if (!mostrarBandera) return null;
  return <BanderaMexico onQuitarTema={() => {
    localStorage.setItem('mx-tema','0');
    setMostrarBandera(false);
  }} />;
}
