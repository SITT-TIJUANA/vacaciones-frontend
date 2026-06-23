import { useState, useEffect, useRef } from 'react';

const FRASES = [
  { titulo:"¡¡¡GOOOOOL DE MÉXICO!!!", sub:"¡Vamos México! ¡El Mundial 2026 es nuestro! 🏆" },
  { titulo:"¡¡EL TRI LO LOGRÓ!!", sub:"¡El Tri no para! ¡Vamos por la Copa del Mundo! ⚽" },
  { titulo:"¡¡ANOTÓ MÉXICO!!", sub:"¡2026 es el año de México! ¡Arriba el Tri! 🦅" },
];

const RESULTADOS_FALLBACK = [
  { rival:'SUDÁFRICA', bandera:'za', goles1:2, goles2:0, goles:"Quiñones 8' · R. Jiménez 65'", fecha:'Jun 11', resultado:'Victoria' },
  { rival:'COREA DEL SUR', bandera:'kr', goles1:1, goles2:0, goles:"L. Romo 50'", fecha:'Jun 18', resultado:'Victoria' },
];
const PROXIMO_FALLBACK = { rival:'Rep. Checa', fecha:'Martes 24 de junio · 20:00 hrs', estadio:'Estadio Azteca, CDMX' };

async function fetchResultadosMexico() {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: 'Busca los resultados más recientes de México en el Mundial 2026 y su próximo partido. Responde SOLO en JSON sin texto adicional: {"partidos":[{"rival":"SUDÁFRICA","bandera":"za","goles1":2,"goles2":0,"goles":"Quiñones 8","fecha":"Jun 11","resultado":"Victoria"}],"proximo":{"rival":"Rep. Checa","fecha":"24 junio 20:00","estadio":"Estadio Azteca"}}'
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.partidos?.length) return parsed;
    }
  } catch(e) { console.log('Usando datos fallback Mexico'); }
  return null;
}

const MEXICO_CSS = `
  body.tema-mexico { --g:#006847; --d:#CE1126; --d-dk:#a30d1e; --g-soft:rgba(0,104,71,0.07); --g10:rgba(0,104,71,0.1); --g20:rgba(0,104,71,0.2); --g60:rgba(0,104,71,0.6); }
  body.tema-mexico .dash-header { background:rgba(0,61,42,0.97)!important; border-bottom:1px solid rgba(206,17,38,0.4)!important; box-shadow:0 4px 30px rgba(0,40,25,0.5)!important; }
  body.tema-mexico .bottom-nav { background:rgba(0,40,25,0.97)!important; border-top:1px solid rgba(206,17,38,0.4)!important; }
  body.tema-mexico .btn-institucional.filled { background:linear-gradient(135deg,#006847,#004d35)!important; }
  body.tema-mexico .btn-institucional.dorado { border-color:#CE1126!important; color:#CE1126!important; }
`;

function inyectarCSS() {
  if (!document.getElementById('mx-style')) {
    const el = document.createElement('style'); el.id='mx-style'; el.textContent=MEXICO_CSS;
    document.head.appendChild(el);
  }
  document.body.classList.add('tema-mexico');
}

function Confetti() {
  const pcs = Array.from({length:50},(_,i)=>({ id:i, left:Math.random()*100, delay:Math.random()*1.2, dur:1.8+Math.random()*1.5, color:['#006847','#fff','#CE1126','#FFD700','#00a86b'][i%5], size:5+Math.random()*10 }));
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:10002,overflow:'hidden'}}>
      {pcs.map(p=>(<div key={p.id} style={{position:'absolute',left:`${p.left}%`,top:-20,width:p.size,height:p.size*(Math.random()>0.5?1:2.5),background:p.color,borderRadius:Math.random()>0.5?'50%':2,animation:`cFall ${p.dur}s ease-in ${p.delay}s forwards`}}/>))}
      <style>{`@keyframes cFall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

function PantallaGol({ onContinuar }) {
  const frase = FRASES[Math.floor(Math.random()*FRASES.length)];
  const [partidos, setPartidos] = useState(RESULTADOS_FALLBACK);
  const [proximo, setProximo] = useState(PROXIMO_FALLBACK);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetchResultadosMexico().then(data => {
      if (data?.partidos?.length) setPartidos(data.partidos);
      if (data?.proximo) setProximo(data.proximo);
    }).finally(() => setCargando(false));
  }, []);

  return (
    <div style={{position:'fixed',inset:0,zIndex:10001,background:'linear-gradient(135deg,#003d2a,#006847)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',padding:16,overflowY:'auto'}}>
      <Confetti/>
      <div style={{fontSize:'clamp(50px,13vw,100px)',fontWeight:900,color:'#FFD700',textShadow:'0 0 40px rgba(255,215,0,0.9)',animation:'pGol 0.55s ease infinite alternate',lineHeight:1,zIndex:2}}>¡GOOOL!</div>
      <div style={{margin:'16px 0',zIndex:2,animation:'spin3D 2.5s ease-in-out infinite',filter:'drop-shadow(0 0 28px rgba(255,215,0,0.5))'}}>
        <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="México" style={{width:'clamp(120px,22vw,190px)',display:'block'}}/>
      </div>
      <div style={{fontSize:'clamp(17px,3.8vw,26px)',fontWeight:900,color:'#FFD700',textAlign:'center',maxWidth:460,zIndex:2,animation:'subir 0.5s ease 0.3s both'}}>{frase.titulo}</div>
      <div style={{fontSize:'clamp(13px,2.8vw,18px)',fontWeight:700,color:'rgba(255,255,255,0.9)',textAlign:'center',maxWidth:400,marginTop:8,zIndex:2,animation:'subir 0.5s ease 0.5s both'}}>{frase.sub}</div>

      <div style={{marginTop:18,zIndex:2,animation:'subir 0.5s ease 0.7s both',background:'rgba(0,0,0,0.5)',borderRadius:20,padding:'16px 20px',backdropFilter:'blur(10px)',border:'1.5px solid rgba(255,215,0,0.25)',minWidth:'min(340px,90vw)',maxWidth:'min(480px,95vw)'}}>
        <div style={{fontSize:10,color:'rgba(255,215,0,0.75)',textTransform:'uppercase',letterSpacing:1.5,textAlign:'center',marginBottom:10,fontWeight:700}}>
          🏆 COPA DEL MUNDO 2026 — GRUPO A {cargando && <span style={{opacity:0.5}}>· actualizando...</span>}
        </div>

        {partidos.map((p, i) => (
          <div key={i}>
            {i > 0 && <div style={{height:1,background:'rgba(255,255,255,0.1)',margin:'10px 0'}}/>}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(8px,2vw,16px)'}}>
              <div style={{textAlign:'center',flex:1}}>
                <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="MEX" style={{width:'clamp(36px,8vw,52px)',display:'block',margin:'0 auto'}}/>
                <div style={{fontSize:'clamp(9px,2vw,11px)',color:'white',fontWeight:900,marginTop:4}}>MÉXICO</div>
              </div>
              <div style={{textAlign:'center',minWidth:80}}>
                <div style={{fontSize:'clamp(9px,1.8vw,11px)',color:'rgba(255,215,0,0.7)',fontWeight:700,marginBottom:2}}>{p.fecha}</div>
                <div style={{fontSize:'clamp(28px,6vw,40px)',fontWeight:900,color:'#FFD700',lineHeight:1,textShadow:'0 0 20px rgba(255,215,0,0.6)',letterSpacing:2}}>{p.goles1} - {p.goles2}</div>
                <div style={{fontSize:'clamp(9px,1.8vw,11px)',color:'#4ade80',fontWeight:900,marginTop:2}}>✅ {p.resultado}</div>
              </div>
              <div style={{textAlign:'center',flex:1}}>
                <img src={`https://flagcdn.com/w80/${p.bandera}.png`} alt={p.rival} style={{width:'clamp(36px,8vw,52px)',borderRadius:4,boxShadow:'0 2px 8px rgba(0,0,0,0.4)',display:'block',margin:'0 auto'}}/>
                <div style={{fontSize:'clamp(9px,2vw,11px)',color:'white',fontWeight:900,marginTop:4}}>{p.rival}</div>
              </div>
            </div>
            {p.goles && <div style={{textAlign:'center',marginTop:4,fontSize:'clamp(9px,1.8vw,11px)',color:'rgba(255,255,255,0.6)',fontWeight:600}}>⚽ {p.goles}</div>}
          </div>
        ))}

        {proximo?.rival && (
          <div style={{marginTop:12,padding:'10px 14px',background:'rgba(255,215,0,0.1)',borderRadius:12,border:'1px solid rgba(255,215,0,0.3)',textAlign:'center'}}>
            <div style={{fontSize:'clamp(11px,2.2vw,13px)',color:'#FFD700',fontWeight:900,marginBottom:4}}>🔜 PRÓXIMO: MÉXICO vs {proximo.rival?.toUpperCase()}</div>
            <div style={{fontSize:'clamp(9px,1.8vw,11px)',color:'rgba(255,255,255,0.7)',fontWeight:600}}>📅 {proximo.fecha} · {proximo.estadio}</div>
          </div>
        )}
      </div>

      <button onClick={onContinuar} style={{marginTop:24,padding:'14px 36px',background:'linear-gradient(135deg,#CE1126,#a30d1e)',border:'2.5px solid #FFD700',borderRadius:50,color:'#FFD700',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(13px,2.8vw,17px)',cursor:'pointer',zIndex:2,position:'relative',boxShadow:'0 8px 30px rgba(206,17,38,0.5)',animation:'subir 0.5s ease 0.9s both'}}>
        🇲🇽 ¡Continuar con el sistema!
      </button>
      <style>{`
        @keyframes pGol{from{transform:scale(1)}to{transform:scale(1.07)}}
        @keyframes spin3D{0%{transform:perspective(600px) rotateY(-18deg) scale(1)}50%{transform:perspective(600px) rotateY(18deg) scale(1.06)}100%{transform:perspective(600px) rotateY(-18deg) scale(1)}}
        @keyframes subir{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

function PenaltyGame({ onGol, onSkip }) {
  const [fase, setFase] = useState('listo');
  const [balPos, setBalPos] = useState({x:50,y:82});
  const [porteroX, setPorteroX] = useState(50);
  const fieldRef = useRef(null);

  useEffect(()=>{
    if(fase==='volando'||fase==='gol') return;
    const t=setInterval(()=>setPorteroX(x=>Math.max(22,Math.min(78,x+(Math.random()-.5)*30))),650);
    return()=>clearInterval(t);
  },[fase]);

  const patearTarget=(tx,ty)=>{
    if(fase==='volando'||fase==='gol') return;
    setFase('volando'); setBalPos({x:tx,y:ty});
    setPorteroX(px=>Math.max(22,Math.min(78,px+(tx-px)*0.3)));
    setTimeout(()=>{ setFase('gol'); setTimeout(()=>onGol(),600); },560);
  };

  const SPOTS=[{x:23,y:14},{x:50,y:12},{x:77,y:14},{x:23,y:34},{x:50,y:34},{x:77,y:34}];

  return (
    <div style={{position:'fixed',inset:0,zIndex:10001,background:'linear-gradient(180deg,#0d2b1a,#1a5c2e,#27873f)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',userSelect:'none'}}>
      <div style={{textAlign:'center',marginBottom:10}}>
        <div style={{fontSize:'clamp(15px,3.5vw,22px)',fontWeight:900,color:'#FFD700',letterSpacing:1}}>⚽ PENALTY CHALLENGE</div>
        <div style={{fontSize:'clamp(10px,2.2vw,14px)',color:'rgba(255,255,255,0.8)',marginTop:3,fontWeight:700}}>
          {fase==='fallo'?'😅 ¡Intenta de nuevo!':fase==='gol'?'🎉 ¡Goool!':'🎯 ¡Da clic en un punto dorado para meter gol!'}
        </div>
      </div>
      <div ref={fieldRef}
        onClick={e=>{ if(fase==='volando'||fase==='gol'||e.target.dataset.spot) return; setFase('fallo'); setTimeout(()=>{ setFase('listo'); setBalPos({x:50,y:82}); },1200); }}
        onTouchEnd={e=>{ if(fase==='volando'||fase==='gol'||e.target.dataset.spot) return; e.preventDefault(); setFase('fallo'); setTimeout(()=>{ setFase('listo'); setBalPos({x:50,y:82}); },1200); }}
        style={{position:'relative',width:'min(460px,92vw)',height:'min(340px,68vw)',background:'linear-gradient(180deg,#1e7a3a,#28924a)',borderRadius:16,overflow:'hidden',border:'2px solid rgba(255,255,255,0.2)',cursor:'crosshair',boxShadow:'0 12px 40px rgba(0,0,0,0.5)',touchAction:'none'}}>
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 100 100" preserveAspectRatio="none">
          <ellipse cx="50" cy="82" rx="18" ry="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
          <circle cx="50" cy="82" r="1.2" fill="rgba(255,255,255,0.5)"/>
        </svg>
        <div style={{position:'absolute',left:'18%',top:'5%',width:'64%',height:'42%',background:'rgba(0,0,0,0.2)'}}>
          <svg style={{width:'100%',height:'100%'}} viewBox="0 0 100 100">
            {[0,12.5,25,37.5,50,62.5,75,87.5,100].map(x=><line key={x} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>)}
            {[0,20,40,60,80,100].map(y=><line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>)}
          </svg>
        </div>
        <div style={{position:'absolute',left:'18%',top:'5%',width:'64%',height:'42%',border:'4px solid white',borderBottom:'none',borderRadius:'3px 3px 0 0',background:fase==='gol'?'rgba(255,215,0,0.2)':'transparent',transition:'background 0.3s',pointerEvents:'none'}}/>
        <div style={{position:'absolute',left:'18%',top:'5%',width:8,height:'42%',background:'linear-gradient(90deg,#bbb,white)',borderRadius:2,pointerEvents:'none'}}/>
        <div style={{position:'absolute',right:'18%',top:'5%',width:8,height:'42%',background:'linear-gradient(90deg,white,#bbb)',borderRadius:2,pointerEvents:'none'}}/>
        <div style={{position:'absolute',left:'18%',top:'5%',height:8,width:'64%',background:'linear-gradient(180deg,#bbb,white)',borderRadius:2,pointerEvents:'none'}}/>
        <div style={{position:'absolute',left:`${porteroX}%`,top:'9%',transform:'translateX(-50%)',fontSize:'clamp(26px,6.5vw,40px)',transition:'left 0.45s cubic-bezier(0.3,1.4,0.7,1)',filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',pointerEvents:'none',lineHeight:1}}>🧤</div>
        <div style={{position:'absolute',left:'50%',bottom:'14%',transform:'translateX(-50%)',pointerEvents:'none',zIndex:4,filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.7))'}}>
          <img src="/vacaciones-frontend/logo-mexico-tri.png" alt="México" style={{width:'clamp(34px,7.5vw,48px)',display:'block'}}/>
        </div>
        {(fase==='listo'||fase==='fallo') && SPOTS.map((pt,i)=>(
          <div key={i} data-spot="true"
            onClick={e=>{ e.stopPropagation(); patearTarget(pt.x,pt.y); }}
            onTouchEnd={e=>{ e.stopPropagation(); e.preventDefault(); patearTarget(pt.x,pt.y); }}
            style={{position:'absolute',left:`${pt.x}%`,top:`${pt.y}%`,transform:'translate(-50%,-50%)',width:22,height:22,borderRadius:'50%',background:'rgba(255,215,0,0.25)',border:'2px solid rgba(255,215,0,0.8)',cursor:'pointer',zIndex:11,boxShadow:'0 0 8px rgba(255,215,0,0.4)',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,215,0,0.7)';e.currentTarget.style.transform='translate(-50%,-50%) scale(1.4)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,215,0,0.25)';e.currentTarget.style.transform='translate(-50%,-50%) scale(1)';}}
          />
        ))}
        <div style={{position:'absolute',left:`${balPos.x}%`,top:`${balPos.y}%`,transform:'translate(-50%,-50%)',transition:fase==='volando'?'all 0.56s cubic-bezier(0.15,0.5,0.7,1)':'none',pointerEvents:'none',zIndex:5}}>
          <svg width="34" height="34" viewBox="0 0 54 54" style={{animation:fase==='gol'?'balSpin 0.3s linear infinite':'none'}}>
            <defs><radialGradient id="bg2" cx="38%" cy="32%"><stop offset="0%" stopColor="#fff"/><stop offset="60%" stopColor="#e8e8e8"/><stop offset="100%" stopColor="#999"/></radialGradient></defs>
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
        {fase==='fallo'&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(206,17,38,0.35)',animation:'fadeIn 0.2s ease'}}><div style={{fontSize:'clamp(26px,7vw,42px)',fontWeight:900,color:'white',textShadow:'0 2px 8px rgba(0,0,0,0.8)'}}>¡Fuera!</div></div>}
      </div>
      <button onClick={onSkip} style={{marginTop:16,padding:'9px 22px',background:'rgba(255,255,255,0.1)',border:'1.5px solid rgba(255,255,255,0.2)',borderRadius:22,color:'rgba(255,255,255,0.6)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:'clamp(10px,2vw,12px)',cursor:'pointer'}}>
        ✕ Ahora no — Entrar sin jugar
      </button>
      <style>{`@keyframes balSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}

export function VacacionesLogo({ onActivar }) {
  const letras = [
    {l:'P',c:'#006847'},{l:'E',c:'#006847'},{l:'R',c:'#006847'},{l:'S',c:'#006847'},
    {l:'⚽',c:'ball'},{l:'N',c:'#006847'},{l:'A',c:'#006847'},{l:'L',c:'#006847'},
    {l:' ',c:'gap'},
    {l:'S',c:'#CE1126'},{l:'I',c:'#CE1126'},{l:'T',c:'#CE1126'},{l:'T',c:'#CE1126'},
  ];
  return (
    <div onClick={onActivar} title="⚽ ¡Haz clic!" style={{cursor:'pointer',marginTop:6,userSelect:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <div style={{fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:4,textTransform:'uppercase',color:'rgba(201,168,76,0.6)'}}>Sistema Integral de Personal</div>
      <div style={{display:'flex',alignItems:'center',flexWrap:'nowrap'}}>
        {letras.map((item,i)=>{
          if(item.c==='gap') return <div key={i} style={{width:'clamp(8px,1.5vw,16px)'}}/>;
          if(item.c==='ball') return (
            <div key={i} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'clamp(30px,5.5vw,52px)',height:'clamp(30px,5.5vw,52px)',animation:'spinBal 2s linear infinite'}}>
              <svg viewBox="0 0 54 54" style={{width:'100%',height:'100%'}}>
                <defs><radialGradient id="bgL" cx="35%" cy="30%"><stop offset="0%" stopColor="#fff"/><stop offset="55%" stopColor="#e8e8e8"/><stop offset="100%" stopColor="#aaa"/></radialGradient></defs>
                <ellipse cx="27" cy="51" rx="11" ry="3" fill="rgba(0,0,0,0.2)"/>
                <circle cx="27" cy="26" r="23" fill="url(#bgL)" stroke="#ccc" strokeWidth="0.5"/>
                <polygon points="27,7 34,13 31,21 23,21 20,13" fill="#006847" opacity="0.9"/>
                <polygon points="6,19 13,15 19,21 17,28 9,27" fill="#CE1126" opacity="0.9"/>
                <polygon points="48,19 41,15 35,21 37,28 45,27" fill="#006847" opacity="0.9"/>
                <polygon points="10,39 9,31 17,29 22,36 16,43" fill="#CE1126" opacity="0.9"/>
                <polygon points="44,39 45,31 37,29 32,36 38,43" fill="#006847" opacity="0.9"/>
                <polygon points="27,46 21,41 23,34 31,34 33,41" fill="#CE1126" opacity="0.9"/>
                <ellipse cx="19" cy="17" rx="7" ry="4.5" fill="rgba(255,255,255,0.55)" transform="rotate(-20,19,17)"/>
                <text x="27" y="24" textAnchor="middle" fontSize="5" fontFamily="Arial" fontWeight="900" fill="#006847">MUNDIAL</text>
                <text x="27" y="31" textAnchor="middle" fontSize="7" fontFamily="Arial" fontWeight="900" fill="#CE1126">2026</text>
              </svg>
            </div>
          );
          return <span key={i} style={{fontSize:'clamp(28px,5.5vw,52px)',fontWeight:900,fontFamily:'Montserrat,sans-serif',lineHeight:1,color:item.c,display:'inline-block',transition:'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-5px) scale(1.15)';}} onMouseLeave={e=>{e.currentTarget.style.transform='none';}}>{item.l}</span>;
        })}
      </div>
      <div style={{width:50,height:1.5,background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.6),transparent)',marginTop:2}}/>
      <style>{`@keyframes spinBal{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function BanderaMexico() {
  return (
    <div style={{position:'fixed',bottom:76,right:14,zIndex:1000,filter:'drop-shadow(0 4px 16px rgba(0,0,0,0.3))'}}>
      <img src="/vacaciones-frontend/bandera-mexico.png" alt="MX" style={{width:68,height:'auto',animation:'banderaWave 1.8s ease-in-out infinite',transformOrigin:'15% 90%',display:'block'}}/>
      <style>{`@keyframes banderaWave{0%,100%{transform:rotate(-6deg) skewX(2deg)}25%{transform:rotate(5deg) skewX(-3deg)}50%{transform:rotate(-4deg) skewX(2deg)}75%{transform:rotate(5deg) skewX(-2deg)}}`}</style>
    </div>
  );
}

export function useMexicoGame() {
  const [fase, setFase] = useState('idle');
  const [temaActivo, setTemaActivo] = useState(false);
  const activar = () => setFase('juego');
  const onGol = () => setFase('gol');
  const onSkip = () => setFase('idle');
  const onContinuar = () => {
    sessionStorage.setItem('mx-tema','1');
    inyectarCSS();
    setTemaActivo(true);
    setFase('idle');
  };
  const GameComponent = () => (
    <>
      {fase==='juego' && <PenaltyGame onGol={onGol} onSkip={onSkip}/>}
      {fase==='gol' && <PantallaGol onContinuar={onContinuar}/>}
      {temaActivo && fase==='idle' && <BanderaMexico />}
    </>
  );
  return { activar, GameComponent, temaActivo };
}

export default function MexicoMode() {
  const [tema, setTema] = useState(false);
  useEffect(()=>{ if(sessionStorage.getItem('mx-tema')==='1'){inyectarCSS();setTema(true);} },[]);
  if(!tema) return null;
  return <BanderaMexico />;
}
