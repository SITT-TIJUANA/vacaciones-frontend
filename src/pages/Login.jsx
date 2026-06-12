import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import escudoSitt from '../assets/escudo-sitt.png';
import { VacacionesLogo, useMexicoGame } from '../components/MexicoMode';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const canvasRef = useRef(null);

  // Aplicar/mantener tema México si está activo
  useEffect(() => {
    if (sessionStorage.getItem('mx-tema') === '1') {
      document.body.classList.add('tema-mexico');
    } else {
      document.body.classList.remove('tema-mexico');
    }
  }, []);
  const { activar: onMxActivar, GameComponent: MexicoGame } = useMexicoGame();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 0.5,
      speed: Math.random() * 0.7 + 0.2,
      swing: Math.random() * 2 - 1,
      swingSpeed: Math.random() * 0.02 + 0.005,
      t: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.4 + 0.08,
    }));
    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.t += p.swingSpeed;
        p.x += Math.sin(p.t) * p.swing;
        p.y += p.speed;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    };
    animate();
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  const onMxActivar = () => setMxFase('juego');
  const onMxGol = () => setMxFase('gol');
  const onMxContinuar = () => { sessionStorage.setItem('mx-tema','1'); setMxFase('idle'); };
  const onMxSkip = () => setMxFase('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Completa todos los campos'); return; }
    setCargando(true); setError('');
    try {
      await login(form.username, form.password);
      window.location.href = '/vacaciones-frontend/#/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally { setCargando(false); }
  };

  return (
    <>
    <div className="login-page">
      <canvas ref={canvasRef} className="particles-canvas" />

      <div className="login-container">
        <div className="login-header">
          <img src={escudoSitt} alt="SITT" className="login-escudo" />
          <div>
            <div className="login-title-main">
              H. XXV Ayuntamiento de <em>Tijuana</em>
            </div>
            <div className="login-subtitle">SITT</div>
            <VacacionesLogo onActivar={onMxActivar} />
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <div className="login-form-title">Iniciar Sesión</div>
            <div className="login-form-sub">Ingresa tus credenciales institucionales</div>
          </div>

          {error && (
            <div className="login-error"><span>⚠️</span> {error}</div>
          )}

          <div className="flex-column">
            <label>Usuario</label>
            <div className="inputForm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input className="input" type="text" placeholder="Usuario institucional"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                autoComplete="username" />
            </div>
          </div>

          <div className="flex-column">
            <label>Contraseña</label>
            <div className="inputForm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px', color: 'var(--g60)', fontSize: 18 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-institucional filled btn-xl"
            style={{ width: '100%', marginTop: '6px' }} disabled={cargando}>
            {cargando
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Verificando...
                </span>
              : <>🔐 Entrar al Sistema</>
            }
          </button>
        </form>

        <p className="login-footer">
          Sistema Integral de Transporte de Tijuana<br />
          <span>Uso exclusivo del personal autorizado</span>
        </p>
      </div>
    </div>
    
    {mxFase==='juego' && <PenaltyGame onGol={()=>setMxFase('gol')} onSkip={()=>setMxFase('idle')}/>}
    {mxFase==='gol' && <PantallaGol onContinuar={()=>{
      sessionStorage.setItem('mx-tema','1');
      document.body.classList.add('tema-mexico');
      // Aplicar tema México al login inmediatamente
      let el = document.getElementById('mx-style');
      if (!el) { el = document.createElement('style'); el.id='mx-style'; document.head.appendChild(el); }
      el.textContent = `:root{--g:#006847!important;--d:#CE1126!important;--g-soft:rgba(0,104,71,0.07)!important;--g10:rgba(0,104,71,0.1)!important;--g20:rgba(0,104,71,0.2)!important;--g60:rgba(0,104,71,0.6)!important;} .login-page{background:linear-gradient(135deg,#003d2a 0%,#006847 50%,#004d35 100%)!important;} .login-container{border-top:3px solid #CE1126!important;} .btn-institucional.filled{background:linear-gradient(135deg,#006847,#004d35)!important;} .login-header{border-bottom-color:rgba(0,104,71,0.2)!important;}`;
      setMxTema(true);
      setMxFase('idle');
    }}/>}}
  </>
  );
}
