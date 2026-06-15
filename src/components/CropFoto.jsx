import { useState, useRef, useCallback, useEffect } from 'react';

export default function CropFoto({ archivo, onConfirmar, onCancelar }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgSrc, setImgSrc] = useState('');
  const [drag, setDrag] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const lastPos = useRef(null);
  const CROP_SIZE = 280;

  useEffect(() => {
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target.result);
    reader.readAsDataURL(archivo);
  }, [archivo]);

  const onImgLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.target;
    setImgSize({ w, h });
    // Escala inicial para que quepa en el crop
    const s = Math.max(CROP_SIZE / w, CROP_SIZE / h);
    setScale(s);
    setOffset({ x: 0, y: 0 });
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgSize.w) return;
    const ctx = canvas.getContext('2d');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Dibujar imagen centrada con offset y scale
    const dw = imgSize.w * scale;
    const dh = imgSize.h * scale;
    const dx = (CROP_SIZE - dw) / 2 + offset.x;
    const dy = (CROP_SIZE - dh) / 2 + offset.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE/2, CROP_SIZE/2, CROP_SIZE/2, 0, Math.PI*2);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }, [scale, offset, imgSize]);

  useEffect(() => { draw(); }, [draw]);

  const onMouseDown = (e) => {
    setDrag(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!drag) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
  };
  const onMouseUp = () => setDrag(false);

  // Touch
  const onTouchStart = (e) => { lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
  };

  const confirmar = () => {
    const canvas = canvasRef.current;
    canvas.toBlob(blob => {
      const file = new File([blob], 'foto-perfil.jpg', { type: 'image/jpeg' });
      onConfirmar(file);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal" style={{ maxWidth:380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✂️ Ajustar foto</h2>
          <button className="modal-close" onClick={onCancelar}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <p style={{ fontSize:12, color:'#718096', textAlign:'center', margin:0 }}>
            Arrastra para mover · Desliza para hacer zoom
          </p>

          {/* Canvas de preview */}
          <div style={{ position:'relative', userSelect:'none' }}>
            <canvas
              ref={canvasRef}
              width={CROP_SIZE}
              height={CROP_SIZE}
              style={{ borderRadius:'50%', border:'3px solid #C9A84C', cursor:drag?'grabbing':'grab', display:'block', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
            />
            {/* Imagen oculta para referencia */}
            {imgSrc && <img ref={imgRef} src={imgSrc} alt="" style={{ display:'none' }} onLoad={onImgLoad}/>}
          </div>

          {/* Zoom */}
          <div style={{ width:'100%', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:14 }}>🔍</span>
            <input type="range" min={0.3} max={3} step={0.05} value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              style={{ flex:1, accentColor:'#6B0F2B' }}/>
            <span style={{ fontSize:14 }}>🔍+</span>
          </div>

          <button onClick={() => { setScale(Math.max(CROP_SIZE/imgSize.w, CROP_SIZE/imgSize.h)); setOffset({x:0,y:0}); }}
            style={{ fontSize:12, color:'#718096', background:'none', border:'1px solid #e2e8f0', borderRadius:8, padding:'4px 12px', cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}>
            ↺ Restablecer
          </button>
        </div>
        <div className="modal-footer">
          <button className="btn-institucional btn-sm" onClick={onCancelar}>Cancelar</button>
          <button onClick={confirmar}
            style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6B0F2B,#9B1540)', color:'#fff', cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13 }}>
            ✅ Usar esta foto
          </button>
        </div>
      </div>
    </div>
  );
}
