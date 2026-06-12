import { useState, useEffect, useRef } from 'react';

// ─── Frases celebración ───────────────────────────────────
const FRASES = [
  { titulo: "¡¡¡GOOOOOL DE MÉXICO!!!", sub: "¡Vamos México! ¡El Mundial 2026 es nuestro! 🏆" },
  { titulo: "¡¡EL TRI LO LOGRÓ!!", sub: "¡El Tri no para! ¡Vamos por la Copa del Mundo! ⚽" },
  { titulo: "¡¡ANOTÓ MÉXICO!!", sub: "¡2026 es el año de México! ¡Arriba el Tri! 🦅" },
];

// ─── Confetti ─────────────────────────────────────────────
function Confetti() {
  const pcs = Array.from({length:60},(_,i)=>({
    id:i, left:Math.random()*100, delay:Math.random()*1.2,
    dur:1.8+Math.random()*1.5,
    color:['#006847','#fff','#CE1126','#FFD700','#00a86b'][i%5],
    size:5+Math.random()*10, rotate:Math.random()*360,
    drift:(Math.random()-0.5)*60,
  }));
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:10002,overflow:'hidden'}}>
      {pcs.map(p=>(
        <div key={p.id} style={{
          position:'absolute',left:`${p.left}%`,top:-20,
          width:p.size,height:p.size*(Math.random()>0.5?1:2.5),
          background:p.color,borderRadius:Math.random()>0.5?'50%':2,
          animation:`cFall${p.id%4} ${p.dur}s ease-in ${p.delay}s forwards`,
        }}/>
      ))}
      <style>{`
        @keyframes cFall0{to{transform:translateY(110vh) translateX(30px) rotate(720deg);opacity:0}}
        @keyframes cFall1{to{transform:translateY(110vh) translateX(-40px) rotate(-360deg);opacity:0}}
        @keyframes cFall2{to{transform:translateY(110vh) translateX(20px) rotate(540deg);opacity:0}}
        @keyframes cFall3{to{transform:translateY(110vh) translateX(-20px) rotate(900deg);opacity:0}}
      `}</style>
    </div>
  );
}

// ─── Mini juego penalti ────────────────────────────────────
function PenaltyGame({ onGol, onSkip }) {
  const [fase, setFase] = useState('listo');
  const [balPos, setBalPos] = useState({x:50,y:82});
  const [target, setTarget] = useState({x:50,y:28});
  const [porteroX, setPorteroX] = useState(50);
  const fieldRef = useRef(null);

  useEffect(() => {
    if(fase!=='listo'&&fase!=='apuntando') return;
    const t = setInterval(()=>{
      setPorteroX(x=>{ const d=(Math.random()-.5)*30; return Math.max(22,Math.min(78,x+d)); });
    },650);
    return ()=>clearInterval(t);
  },[fase]);

  const handleMove = e=>{
    if(fase==='volando'||fase==='gol') return;
    const rect=fieldRef.current?.getBoundingClientRect(); if(!rect) return;
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    setTarget({
      x:Math.max(20,Math.min(80,((cx-rect.left)/rect.width)*100)),
      y:Math.max(8,Math.min(45,((cy-rect.top)/rect.height)*100)),
    });
    setFase('apuntando');
  };

  const patear=()=>{
    if(fase==='volando'||fase==='gol') return;
    setFase('volando');
    setBalPos({x:target.x,y:target.y});
    setTimeout(()=>{
      const enPorteria=target.x>20&&target.x<80&&target.y>8&&target.y<45;
      const porteroAtrapa=Math.abs(target.x-porteroX)<11;
      if(enPorteria&&!porteroAtrapa){ setFase('gol'); setTimeout(()=>onGol(),600); }
      else{ setFase('fallo'); setTimeout(()=>{ setFase('listo'); setBalPos({x:50,y:82}); setTarget({x:50,y:28}); },1200); }
    },560);
  };

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:10001,
      background:'linear-gradient(180deg,#0d2b1a 0%,#1a5c2e 35%,#27873f 65%,#3da650 100%)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      fontFamily:'Montserrat,sans-serif',userSelect:'none',
    }}>
      <div style={{textAlign:'center',marginBottom:10}}>
        <div style={{fontSize:'clamp(15px,3.5vw,22px)',fontWeight:900,color:'#FFD700',letterSpacing:1,textShadow:'0 2px 8px rgba(0,0,0,0.5)'}}>
          ⚽ PENALTY CHALLENGE
        </div>
        <div style={{fontSize:'clamp(10px,2.2vw,14px)',color:'rgba(255,255,255,0.8)',marginTop:3,fontWeight:700}}>
          {fase==='fallo'?'😅 ¡Casi! Intenta de nuevo':fase==='gol'?'🎉 ¡Goool!':fase==='apuntando'?'🎯 ¡Clic para patear!':'Mueve el cursor a la portería y da clic'}
        </div>
      </div>

      {/* Campo */}
      <div ref={fieldRef} onMouseMove={handleMove} onTouchMove={e=>{e.preventDefault();handleMove(e);}}
        onClick={patear} onTouchEnd={e=>{e.preventDefault();patear();}}
        style={{
          position:'relative',width:'min(460px,92vw)',height:'min(340px,68vw)',
          background:'linear-gradient(180deg,#1e7a3a,#28924a)',
          borderRadius:16,overflow:'hidden',border:'2px solid rgba(255,255,255,0.2)',
          cursor:fase==='listo'||fase==='apuntando'?'crosshair':'default',
          boxShadow:'0 12px 40px rgba(0,0,0,0.5)',touchAction:'none',
        }}>

        {/* Líneas campo */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 100 100" preserveAspectRatio="none">
          {[0,10,20,30,40,50,60,70,80,90].map(x=><rect key={x} x={x} y="0" width="10" height="100" fill={x%20===0?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)"}/>)}
          <ellipse cx="50" cy="82" rx="18" ry="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
          <circle cx="50" cy="82" r="1.2" fill="rgba(255,255,255,0.5)"/>
          <line x1="0" y1="99" x2="100" y2="99" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4"/>
        </svg>

        {/* Red portería */}
        <div style={{position:'absolute',left:'18%',top:'5%',width:'64%',height:'42%',background:'rgba(0,0,0,0.2)'}}>
          <svg style={{width:'100%',height:'100%'}} viewBox="0 0 100 100">
            {[0,12.5,25,37.5,50,62.5,75,87.5,100].map(x=><line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>)}
            {[0,20,40,60,80,100].map(y=><line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>)}
          </svg>
        </div>

        {/* Portería marcos */}
        <div style={{
          position:'absolute',left:'18%',top:'5%',width:'64%',height:'42%',
          border:'4px solid white',borderBottom:'none',borderRadius:'3px 3px 0 0',
          background:fase==='gol'?'rgba(255,215,0,0.25)':'transparent',
          transition:'background 0.3s',pointerEvents:'none',
          boxShadow:'inset 0 0 12px rgba(0,0,0,0.3)',
        }}/>
        <div style={{position:'absolute',left:'18%',top:'5%',width:8,height:'42%',background:'linear-gradient(90deg,#bbb,white,#ddd)',borderRadius:2,pointerEvents:'none'}}/>
        <div style={{position:'absolute',right:'18%',top:'5%',width:8,height:'42%',background:'linear-gradient(90deg,#ddd,white,#bbb)',borderRadius:2,pointerEvents:'none'}}/>
        <div style={{position:'absolute',left:'18%',top:'5%',height:8,width:'64%',background:'linear-gradient(180deg,#bbb,white)',borderRadius:2,pointerEvents:'none'}}/>

        {/* Portero */}
        <div style={{
          position:'absolute',left:`${porteroX}%`,top:'9%',
          transform:'translateX(-50%)',
          fontSize:'clamp(26px,6.5vw,40px)',
          transition:'left 0.45s cubic-bezier(0.3,1.4,0.7,1)',
          filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
          pointerEvents:'none',lineHeight:1,
        }}>🧤</div>

        {/* Logo Tri como jugador */}
        <div style={{
          position:'absolute',left:'50%',bottom:'14%',
          transform:'translateX(-50%)',
          pointerEvents:'none',zIndex:4,
          filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.7))',
        }}>
          <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="México"
            style={{width:'clamp(34px,7.5vw,48px)',display:'block'}}/>
        </div>

        {/* Mira */}
        {(fase==='listo'||fase==='apuntando')&&(
          <div style={{position:'absolute',left:`${target.x}%`,top:`${target.y}%`,transform:'translate(-50%,-50%)',pointerEvents:'none',zIndex:10}}>
            <div style={{width:28,height:28,border:`2.5px solid ${fase==='apuntando'?'#FFD700':'rgba(255,255,255,0.7)'}`,borderRadius:'50%',position:'relative',boxShadow:`0 0 0 3px rgba(255,215,0,${fase==='apuntando'?0.3:0.1})`}}>
              {[['top',0,'left','50%'],['bottom',0,'left','50%'],['left',0,'top','50%'],['right',0,'top','50%']].map(([side,v,cross,cv],i)=>(
                <div key={i} style={{position:'absolute',[side]:v,[cross]:cv,width:side==='left'||side==='right'?8:1.5,height:side==='top'||side==='bottom'?8:1.5,background:fase==='apuntando'?'#FFD700':'rgba(255,255,255,0.8)',transform:cross==='left'?'translateX(-50%)':'translateY(-50%)'}}/>
              ))}
            </div>
          </div>
        )}

        {/* Balón */}
        <div style={{
          position:'absolute',left:`${balPos.x}%`,top:`${balPos.y}%`,
          transform:'translate(-50%,-50%)',
          transition:fase==='volando'?'all 0.56s cubic-bezier(0.15,0.5,0.7,1)':'none',
          pointerEvents:'none',zIndex:5,
        }}>
          <svg width="36" height="36" viewBox="0 0 54 54" style={{animation:fase==='gol'?'balSpin 0.3s linear infinite':'none'}}>
            <radialGradient id="bg2" cx="38%" cy="32%">
              <stop offset="0%" stopColor="#fff"/><stop offset="60%" stopColor="#e8e8e8"/><stop offset="100%" stopColor="#999"/>
            </radialGradient>
            <ellipse cx="27" cy="51" rx="11" ry="3" fill="rgba(0,0,0,0.15)"/>
            <circle cx="27" cy="26" r="22" fill="url(#bg2)" stroke="#ccc" strokeWidth="0.5"/>
            <polygon points="27,8 33,13 31,20 23,20 21,13" fill="#222" opacity="0.85"/>
            <polygon points="8,20 14,16 20,20 18,27 11,27" fill="#222" opacity="0.85"/>
            <polygon points="46,20 40,16 34,20 36,27 43,27" fill="#222" opacity="0.85"/>
            <polygon points="12,38 11,31 18,29 22,35 18,41" fill="#222" opacity="0.85"/>
            <polygon points="42,38 43,31 36,29 32,35 36,41" fill="#222" opacity="0.85"/>
            <polygon points="27,44 22,40 24,34 30,34 32,40" fill="#222" opacity="0.85"/>
            <ellipse cx="20" cy="17" rx="6" ry="4" fill="rgba(255,255,255,0.5)" transform="rotate(-20,20,17)"/>
          </svg>
        </div>

        {/* Fallo */}
        {fase==='fallo'&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(206,17,38,0.35)',animation:'fadeIn 0.2s ease'}}>
          <div style={{fontSize:'clamp(26px,7vw,42px)',fontWeight:900,color:'white',textShadow:'0 2px 8px rgba(0,0,0,0.8)'}}>¡Fuera!</div>
        </div>}
      </div>

      <div style={{marginTop:10,padding:'7px 16px',background:'rgba(0,0,0,0.4)',borderRadius:20,color:'rgba(255,255,255,0.7)',fontSize:'clamp(10px,2vw,12px)',fontWeight:700,backdropFilter:'blur(4px)'}}>
        {fase==='apuntando'?'🎯 ¡Da clic para patear!':'🖱️ Mueve y clic · 📱 Toca la portería'}
      </div>

      <button onClick={onSkip} style={{marginTop:12,padding:'9px 22px',background:'rgba(255,255,255,0.1)',border:'1.5px solid rgba(255,255,255,0.2)',borderRadius:22,color:'rgba(255,255,255,0.6)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:'clamp(10px,2vw,12px)',cursor:'pointer',backdropFilter:'blur(4px)'}}>
        ✕ Ahora no — Entrar sin jugar
      </button>

      <style>{`@keyframes balSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}

// ─── Pantalla Gol ─────────────────────────────────────────
function PantallaGol({ onContinuar }) {
  const frase = FRASES[Math.floor(Math.random()*FRASES.length)];
  const [partido, setPartido] = useState(null);

  useEffect(()=>{
    // Fallback con resultado real de hoy
    setTimeout(()=>{
      setPartido({
        bandera1:'🇲🇽', equipo1:'MÉXICO', goles1:2,
        bandera2:'🇿🇦', equipo2:'SUDÁFRICA', goles2:0,
        resultado:'VICTORIA', color:'#4ade80',
        goles:"Quiñones 8' · R. Jiménez 65'",
        competicion:'Copa del Mundo 2026',
        proximo:'¡Vamos por Corea del Sur! 🔥',
      });
    }, 400);

    // Intentar API real
    fetch('https://api.football-data.org/v4/teams/1392/matches?status=FINISHED&limit=1',{
      headers:{'X-Auth-Token':'9e7e61e0f4e44f4e8c4a6e2b3d1f5a8c'}
    }).then(r=>r.json()).then(data=>{
      const m=data.matches?.[0]; if(!m) return;
      const esLocal=m.homeTeam?.id===1392;
      const rival=esLocal?m.awayTeam:m.homeTeam;
      const gMex=esLocal?m.score?.fullTime?.home:m.score?.fullTime?.away;
      const gRiv=esLocal?m.score?.fullTime?.away:m.score?.fullTime?.home;
      if(gMex!=null&&gRiv!=null){
        setPartido({
          bandera1:'🇲🇽',equipo1:'MÉXICO',goles1:gMex,
          bandera2:'🌍',equipo2:(rival?.name||'').toUpperCase(),goles2:gRiv,
          resultado:gMex>gRiv?'VICTORIA':gMex===gRiv?'EMPATE':'DERROTA',
          color:gMex>gRiv?'#4ade80':gMex===gRiv?'#FFD700':'#f87171',
          competicion:m.competition?.name||'',
          proximo:'',
        });
      }
    }).catch(()=>{});
  },[]);

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:10001,
      background:'linear-gradient(135deg,#003d2a 0%,#005a3d 40%,#006847 100%)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      fontFamily:'Montserrat,sans-serif',padding:'16px',overflowY:'auto',
    }}>
      <Confetti/>

      {/* GOOOOL */}
      <div style={{fontSize:'clamp(50px,13vw,100px)',fontWeight:900,color:'#FFD700',
        textShadow:'0 0 40px rgba(255,215,0,0.9),0 4px 20px rgba(0,0,0,0.5)',
        letterSpacing:3,animation:'pulsarGol 0.55s ease infinite alternate',
        lineHeight:1,position:'relative',zIndex:2}}>
        ¡GOOOL!
      </div>

      {/* Logo girando */}
      <div style={{margin:'16px 0',zIndex:2,animation:'spin3D 2.5s ease-in-out infinite',
        filter:'drop-shadow(0 0 28px rgba(255,215,0,0.5))'}}>
        <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="México"
          style={{width:'clamp(120px,22vw,190px)',display:'block'}}/>
      </div>

      {/* Frase */}
      <div style={{fontSize:'clamp(17px,3.8vw,26px)',fontWeight:900,color:'#FFD700',
        textShadow:'0 2px 10px rgba(0,0,0,0.6)',textAlign:'center',maxWidth:460,lineHeight:1.3,
        zIndex:2,animation:'subir 0.5s ease 0.3s both'}}>{frase.titulo}</div>
      <div style={{fontSize:'clamp(13px,2.8vw,18px)',fontWeight:700,color:'rgba(255,255,255,0.9)',
        textAlign:'center',maxWidth:400,marginTop:8,zIndex:2,animation:'subir 0.5s ease 0.5s both'}}>
        {frase.sub}
      </div>

      {/* Marcador */}
      {partido&&(
        <div style={{
          marginTop:18,zIndex:2,animation:'subir 0.5s ease 0.7s both',
          background:'rgba(0,0,0,0.5)',borderRadius:20,padding:'16px 28px',
          backdropFilter:'blur(10px)',border:'1.5px solid rgba(255,215,0,0.25)',
          minWidth:'min(320px,85vw)',
        }}>
          <div style={{fontSize:10,color:'rgba(255,215,0,0.75)',textTransform:'uppercase',
            letterSpacing:1.5,textAlign:'center',marginBottom:10,fontWeight:700}}>
            🏆 {partido.competicion}
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(10px,3vw,24px)'}}>
            {/* México */}
            <div style={{textAlign:'center',flex:1}}>
              <img src="https://flagcdn.com/w80/mx.png" alt="México"
                style={{width:'clamp(50px,10vw,72px)',height:'auto',borderRadius:4,boxShadow:'0 2px 8px rgba(0,0,0,0.4)',display:'block',margin:'0 auto'}}/>
              <div style={{fontSize:'clamp(9px,2vw,12px)',color:'white',fontWeight:900,marginTop:6,letterSpacing:0.5}}>{partido.equipo1}</div>
            </div>
            {/* Marcador */}
            <div style={{textAlign:'center',padding:'0 8px'}}>
              <div style={{fontSize:'clamp(34px,8vw,52px)',fontWeight:900,color:'#FFD700',
                lineHeight:1,textShadow:'0 0 20px rgba(255,215,0,0.6)',letterSpacing:2}}>
                {partido.goles1} - {partido.goles2}
              </div>
              <div style={{fontSize:'clamp(10px,2vw,12px)',color:partido.color,
                fontWeight:900,marginTop:5,letterSpacing:1}}>
                {partido.resultado==='VICTORIA'?'✅ VICTORIA':partido.resultado==='EMPATE'?'🤝 EMPATE':'❌ DERROTA'}
              </div>
            </div>
            {/* Sudáfrica */}
            <div style={{textAlign:'center',flex:1}}>
              <img src="https://flagcdn.com/w80/za.png" alt="Sudáfrica"
                style={{width:'clamp(50px,10vw,72px)',height:'auto',borderRadius:4,boxShadow:'0 2px 8px rgba(0,0,0,0.4)',display:'block',margin:'0 auto'}}/>
              <div style={{fontSize:'clamp(9px,2vw,12px)',color:'white',fontWeight:900,marginTop:6,letterSpacing:0.5}}>{partido.equipo2}</div>
            </div>
          </div>
          {partido.goles&&(
            <div style={{textAlign:'center',marginTop:8,fontSize:'clamp(10px,2vw,12px)',
              color:'rgba(255,255,255,0.65)',fontWeight:600}}>⚽ {partido.goles}</div>
          )}
          {partido.proximo&&(
            <div style={{textAlign:'center',marginTop:6,fontSize:'clamp(11px,2.2vw,13px)',
              color:'#FFD700',fontWeight:800}}>{partido.proximo}</div>
          )}
        </div>
      )}

      {/* Botón */}
      <button onClick={onContinuar} style={{
        marginTop:24,padding:'14px 36px',
        background:'linear-gradient(135deg,#CE1126,#a30d1e)',
        border:'2.5px solid #FFD700',borderRadius:50,
        color:'#FFD700',fontFamily:'Montserrat,sans-serif',
        fontWeight:900,fontSize:'clamp(13px,2.8vw,17px)',
        cursor:'pointer',letterSpacing:0.5,zIndex:2,position:'relative',
        boxShadow:'0 8px 30px rgba(206,17,38,0.5)',
        animation:'subir 0.5s ease 0.9s both, ctaPulse 1.5s ease 1.4s infinite',
      }}>
        🇲🇽 ¡Continuar con el sistema!
      </button>

      <style>{`
        @keyframes pulsarGol{from{transform:scale(1)}to{transform:scale(1.07)}}
        @keyframes spin3D{0%{transform:perspective(600px) rotateY(-18deg) scale(1)}50%{transform:perspective(600px) rotateY(18deg) scale(1.06)}100%{transform:perspective(600px) rotateY(-18deg) scale(1)}}
        @keyframes subir{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ctaPulse{0%,100%{box-shadow:0 8px 30px rgba(206,17,38,0.5),0 0 0 0 rgba(255,215,0,0.4)}50%{box-shadow:0 8px 30px rgba(206,17,38,0.5),0 0 0 10px rgba(255,215,0,0)}}
      `}</style>
    </div>
  );
}

// ─── Bandera flotante en sistema ─────────────────────────
function BanderaMexico({ onQuitarTema }) {
  return (
    <div style={{position:'fixed',bottom:76,right:14,zIndex:1000,display:'flex',flexDirection:'column',alignItems:'center',gap:5,filter:'drop-shadow(0 4px 16px rgba(0,0,0,0.3))'}}>
      <img src="/vacaciones-frontend/bandera-mexico.png" alt="🇲🇽"
        style={{width:68,height:'auto',animation:'banderaWave 1.8s ease-in-out infinite',transformOrigin:'15% 90%'}}/>
      <button onClick={onQuitarTema} style={{padding:'4px 10px',background:'rgba(0,0,0,0.65)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:12,color:'white',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:9,cursor:'pointer',whiteSpace:'nowrap',backdropFilter:'blur(4px)'}}>
        🎨 Quitar tema México
      </button>
      <style>{`@keyframes banderaWave{0%,100%{transform:rotate(-6deg) skewX(2deg)}25%{transform:rotate(5deg) skewX(-3deg)}50%{transform:rotate(-4deg) skewX(2deg)}75%{transform:rotate(5deg) skewX(-2deg)}}`}</style>
    </div>
  );
}

// ─── CSS Tema México ──────────────────────────────────────
const MEXICO_CSS = `
  :root{--g:#006847!important;--d:#CE1126!important;--d-dk:#a30d1e!important;--g-soft:rgba(0,104,71,0.07)!important;--g10:rgba(0,104,71,0.1)!important;--g20:rgba(0,104,71,0.2)!important;--g60:rgba(0,104,71,0.6)!important;}
  .bottom-nav{background:linear-gradient(135deg,#004d35,#006847,#004d35)!important;border-top:2px solid #CE1126!important;}
  .bottom-nav-item.active{color:#FFD700!important;}
  .btn-institucional.filled{background:linear-gradient(135deg,#006847,#004d35)!important;}
  .btn-institucional.dorado{border-color:#CE1126!important;color:#CE1126!important;}
  header,.dash-header{background:linear-gradient(135deg,#004d35,#006847,#CE1126)!important;}
`;

// ─── Letras VACACIONES con Easter Egg ────────────────────
export function VacacionesLogo({ onActivar }) {
  return (
    <div onClick={onActivar} title="⚽ ¡Haz clic para jugar!" style={{ cursor:'pointer', marginTop:4, userSelect:'none', display:'flex', justifyContent:'center' }}>
      <img
        src="/vacaciones-frontend/vacaciones-titulo.png"
        alt="VACACIONES"
        style={{
          width:'clamp(260px,55vw,520px)',
          height:'auto',
          display:'block',
          filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
          transition:'transform 0.2s ease, filter 0.2s ease',
        }}
        onMouseEnter={e=>{ e.currentTarget.style.transform='scale(1.04)'; e.currentTarget.style.filter='drop-shadow(0 4px 16px rgba(0,104,71,0.4))'; }}
        onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.filter='drop-shadow(0 2px 8px rgba(0,0,0,0.2))'; }}
      />
    </div>
  );
}


export function LoginMexicoEggs({ onActivar }) {
  return (
    <div onClick={onActivar} title="⚽" style={{
      position:'fixed',bottom:20,right:20,zIndex:999,
      cursor:'pointer',animation:'flotarHuevo 3s ease-in-out infinite',
      filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
    }}>
      <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="🇲🇽"
        style={{width:42,height:42,objectFit:'contain'}}/>
      <style>{`@keyframes flotarHuevo{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-8px) rotate(5deg)}}`}</style>
    </div>
  );
}

// ─── Componente principal (dentro del sistema) ────────────
export default function MexicoMode() {
  const [tema, setTema] = useState(()=>localStorage.getItem('mx-tema')==='1');
  const styleEl = useRef(null);

  useEffect(()=>{
    if(tema){
      if(!styleEl.current){
        let el = document.getElementById('mx-style');
        if(!el){ el=document.createElement('style'); el.id='mx-style'; document.head.appendChild(el); }
        styleEl.current=el;
      }
      styleEl.current.textContent=MEXICO_CSS;
    } else {
      const el=document.getElementById('mx-style');
      if(el) el.remove();
      styleEl.current=null;
    }
  },[tema]);

  // Re-check localStorage when component mounts (in case login set it)
  useEffect(()=>{
    const saved = localStorage.getItem('mx-tema')==='1';
    if(saved !== tema) setTema(saved);
  },[]);

  if(!tema) return null;
  return <BanderaMexico onQuitarTema={()=>{ localStorage.setItem('mx-tema','0'); setTema(false); }}/>;
}

// Exportar componentes del juego para Login
export { PenaltyGame, PantallaGol };
