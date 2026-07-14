import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMexicoGame } from '../components/MexicoMode';

// ─── Íconos lluvia ────────────────────────────────────────
const ICONOS_LLUVIA = [
  { left:'4%',   size:28, delay:'0s',    duration:'12s', tipo:'palmera' },
  { left:'12%',  size:18, delay:'3.5s',  duration:'9s',  tipo:'avion' },
  { left:'20%',  size:24, delay:'1.2s',  duration:'13s', tipo:'calendario' },
  { left:'29%',  size:16, delay:'6s',    duration:'8.5s',tipo:'sol' },
  { left:'37%',  size:26, delay:'2.4s',  duration:'12s', tipo:'palmera' },
  { left:'46%',  size:18, delay:'8s',    duration:'10s', tipo:'avion' },
  { left:'54%',  size:20, delay:'0.8s',  duration:'11.5s',tipo:'calendario' },
  { left:'62%',  size:28, delay:'4.5s',  duration:'9.5s',tipo:'sol' },
  { left:'70%',  size:16, delay:'7s',    duration:'13.5s',tipo:'palmera' },
  { left:'78%',  size:22, delay:'2s',    duration:'10.5s',tipo:'avion' },
  { left:'86%',  size:18, delay:'5.5s',  duration:'12.5s',tipo:'calendario' },
  { left:'93%',  size:24, delay:'1.6s',  duration:'9s',  tipo:'sol' },
  { left:'8%',   size:14, delay:'9.5s',  duration:'14s', tipo:'avion' },
  { left:'65%',  size:15, delay:'10s',   duration:'11s', tipo:'palmera' },
];

function IconoVacaciones({ tipo, ...p }) {
  const comun = { fill:'none', stroke:'rgba(107,15,43,0.25)', strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' };
  if (tipo === 'palmera') return (
    <svg {...p} viewBox="0 0 24 24" {...comun}>
      <path d="M12 20V10"/>
      <path d="M12 10C12 10 8 8 7 5c3 0 5 2 5 5z"/>
      <path d="M12 10C12 10 16 8 17 5c-3 0-5 2-5 5z"/>
      <path d="M12 10C12 10 10 6 12 4c2 4 0 6 0 6z"/>
      <path d="M10 20h4"/>
    </svg>
  );
  if (tipo === 'avion') return (
    <svg {...p} viewBox="0 0 24 24" {...comun}>
      <path d="M21 16l-9-9-9 4 4 1-2 4 4-2 1 4 4-9z"/>
    </svg>
  );
  if (tipo === 'calendario') return (
    <svg {...p} viewBox="0 0 24 24" {...comun}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  );
  // sol
  return (
    <svg {...p} viewBox="0 0 24 24" {...comun}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}

function LluviaIconos() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      <style>{`
        @keyframes caidaVac {
          0%   { transform: translateY(-8vh) rotate(0deg); opacity:0; }
          10%  { opacity: 0.3; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(108vh) rotate(20deg); opacity:0; }
        }
      `}</style>
      {ICONOS_LLUVIA.map((it,i) => (
        <IconoVacaciones key={i} tipo={it.tipo} width={it.size} height={it.size}
          style={{ position:'absolute', top:0, left:it.left,
            animation:`caidaVac ${it.duration} linear ${it.delay} infinite` }}/>
      ))}
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { activar, GameComponent } = useMexicoGame();

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(''); setCargando(true);
    try {
      await login(username, password);
      navigate('/menu');
    } catch(err) {
      setError(err.response?.data?.error || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, position:'relative', overflow:'hidden',
      background:'linear-gradient(135deg, #f8f4f0 0%, #fff5f5 50%, #fdf8f0 100%)' }}>

      <LluviaIconos/>
      <GameComponent/>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:460,
        background:'#fff', borderRadius:24, overflow:'hidden',
        boxShadow:'0 20px 60px rgba(107,15,43,0.15), 0 4px 20px rgba(0,0,0,0.08)' }}>

        {/* Portada 16:9 */}
        <div style={{ aspectRatio:'16/9', width:'100%', position:'relative',
          backgroundImage:`url('${import.meta.env.BASE_URL}login-bg.jpg')`,
          backgroundSize:'cover', backgroundPosition:'center',
          backgroundColor:'#6B0F2B' }}>
          {/* Overlay sutil + clic para modo México */}
          <div onClick={activar} style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 60%, rgba(107,15,43,0.3) 100%)', cursor:'pointer' }} title="⚽ Haz clic aquí"/>
        </div>

        {/* Formulario */}
        <div style={{ padding:'28px 36px 36px' }}>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontWeight:900,
            fontSize:22, color:'#6B0F2B', marginBottom:4 }}>
            Bienvenido de vuelta
          </h2>
          <p style={{ fontSize:13, color:'#9ca3af', marginBottom:24, fontFamily:'Montserrat,sans-serif' }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={manejarSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label>Usuario</label>
              <input className="form-control" type="text" required placeholder="tu.usuario" autoComplete="username"
                value={username} onChange={e=>setUsername(e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input className="form-control" type="password" required placeholder="••••••••" autoComplete="current-password"
                value={password} onChange={e=>setPassword(e.target.value)}/>
            </div>

            {error && (
              <div style={{ background:'#fff5f5', color:'#B71C1C', fontSize:13,
                padding:'10px 14px', borderRadius:10, border:'1px solid #fca5a5',
                fontFamily:'Montserrat,sans-serif', fontWeight:600 }}>
                ⚠️ {error}
              </div>
            )}

            <button className="btn-institucional filled btn-lg" type="submit"
              disabled={cargando} style={{ width:'100%', marginTop:4 }}>
              {cargando ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.3)',
                    borderTop:'2.5px solid #fff', borderRadius:'50%',
                    animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
                  Entrando...
                </span>
              ) : 'Entrar al sistema'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:11, color:'#9ca3af',
            marginTop:20, fontFamily:'Montserrat,sans-serif' }}>
            H. XXV Ayuntamiento de Tijuana · SITT
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
