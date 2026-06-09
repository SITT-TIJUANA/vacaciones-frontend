import { useState, useEffect } from 'react';

export default function InstalarApp() {
  const [show, setShow] = useState(false);
  const [instalado, setInstalado] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dispositivo, setDispositivo] = useState('android');

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalado(true);
      return;
    }

    // Detectar dispositivo
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setDispositivo('ios');
    else if (/android/.test(ua)) setDispositivo('android');
    else setDispositivo('desktop');

    // Capturar evento de instalación Chrome/Android
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setInstalado(true);
      setShow(false);
    });
  }, []);

  const instalarDirecto = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalado(true);
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  if (instalado) return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setShow(true)}
        style={{
          position: 'fixed', bottom: 85, right: 16, zIndex: 200,
          background: 'linear-gradient(135deg, var(--g), var(--g-dk))',
          border: '2px solid var(--d)',
          color: '#fff', borderRadius: 30,
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(107,15,43,0.4)',
          fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 12,
          transition: 'all 0.3s', animation: 'float 3s ease-in-out infinite',
        }}
        title="Instalar aplicación"
      >
        <span style={{ fontSize: 18 }}>📲</span>
        <span>Instalar App</span>
      </button>

      {/* Modal instrucciones */}
      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📲 Instalar Vacaciones SITT</h2>
              <button className="modal-close" onClick={() => setShow(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--g-soft)', borderRadius: 14, border: '1px solid rgba(107,15,43,0.15)' }}>
                <img src="/vacaciones-frontend/icon-96x96.png" alt="Logo" style={{ width: 60, height: 60, borderRadius: 14 }} />
                <div>
                  <div style={{ fontFamily: 'Playfair Display,serif', fontStyle: 'italic', fontWeight: 900, fontSize: 16, color: 'var(--g)' }}>Control de Vacaciones</div>
                  <div style={{ fontSize: 12, color: 'var(--g60)', fontFamily: 'Montserrat,sans-serif', fontWeight: 600 }}>SITT · Ayto. Tijuana</div>
                </div>
              </div>

              {/* Tabs dispositivo */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'android', label: '🤖 Android', },
                  { id: 'ios', label: '🍎 iPhone', },
                  { id: 'desktop', label: '💻 Laptop', },
                ].map(d => (
                  <button key={d.id} onClick={() => setDispositivo(d.id)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 10,
                      background: dispositivo === d.id ? 'var(--g)' : 'var(--g10)',
                      border: `2px solid ${dispositivo === d.id ? 'var(--g)' : 'var(--g20)'}`,
                      color: dispositivo === d.id ? '#fff' : 'var(--g60)',
                      fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 11,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Instrucciones Android */}
              {dispositivo === 'android' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {deferredPrompt ? (
                    <>
                      <div style={{ padding: '12px 14px', background: '#E8F5E9', borderRadius: 12, border: '1px solid #C8E6C9', fontSize: 13, color: '#1B5E20', fontWeight: 600 }}>
                        ✅ Tu dispositivo soporta instalación directa
                      </div>
                      <button className="btn-institucional filled btn-lg" style={{ width: '100%' }} onClick={instalarDirecto}>
                        📲 Instalar ahora
                      </button>
                    </>
                  ) : (
                    <>
                      {[
                        { num: '1', icon: '🌐', texto: 'Abre esta página en Chrome' },
                        { num: '2', icon: '⋮', texto: 'Toca los 3 puntos (⋮) arriba a la derecha' },
                        { num: '3', icon: '📲', texto: 'Selecciona "Añadir a pantalla de inicio" o "Instalar app"' },
                        { num: '4', icon: '✅', texto: 'Confirma tocando "Instalar"' },
                      ].map(({ num, icon, texto }) => (
                        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--g10)', borderRadius: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--g)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{num}</div>
                          <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                          <span style={{ fontSize: 13, color: 'var(--txt)', fontWeight: 500 }}>{texto}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Instrucciones iPhone */}
              {dispositivo === 'ios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { num: '1', icon: '🧭', texto: 'Abre esta página en Safari (no Chrome)' },
                    { num: '2', icon: '⬆️', texto: 'Toca el botón de compartir (cuadrado con flecha) en la barra inferior' },
                    { num: '3', icon: '➕', texto: 'Desplázate y toca "Añadir a pantalla de inicio"' },
                    { num: '4', icon: '✅', texto: 'Toca "Añadir" arriba a la derecha' },
                  ].map(({ num, icon, texto }) => (
                    <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--g10)', borderRadius: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--g)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{num}</div>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: 13, color: 'var(--txt)', fontWeight: 500 }}>{texto}</span>
                    </div>
                  ))}
                  <div style={{ padding: '10px 12px', background: '#FFF8E1', borderRadius: 10, border: '1px solid #FFE082', fontSize: 12, color: '#856404' }}>
                    ⚠️ En iPhone solo funciona desde Safari, no desde Chrome
                  </div>
                </div>
              )}

              {/* Instrucciones Desktop */}
              {dispositivo === 'desktop' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { num: '1', icon: '🌐', texto: 'Abre el sistema en Chrome o Edge' },
                    { num: '2', icon: '🖥️', texto: 'Busca el ícono de instalar (➕) en la barra de dirección, a la derecha' },
                    { num: '3', icon: '📲', texto: 'Haz clic en "Instalar" o "Abrir en aplicación"' },
                    { num: '4', icon: '✅', texto: 'Confirma la instalación' },
                  ].map(({ num, icon, texto }) => (
                    <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--g10)', borderRadius: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--g)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{num}</div>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: 13, color: 'var(--txt)', fontWeight: 500 }}>{texto}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-institucional btn-sm" onClick={() => setShow(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
