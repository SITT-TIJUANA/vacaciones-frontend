const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const CORREO_RRHH  = process.env.EMAIL_RRHH  || 'ejimenezp@tijuana.gob.mx';
const CORREO_ADMIN = process.env.EMAIL_ADMIN || 'sminzunza@tijuana.gob.mx';

function fmtFecha(f) {
  if (!f) return '—';
  const [y,m,d] = f.substring(0,10).split('-');
  return new Date(parseInt(y),parseInt(m)-1,parseInt(d)).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
}

const headerHtml = `
  <div style="background:linear-gradient(135deg,#4A0A1E,#6B0F2B);padding:32px 40px;text-align:center">
    <h1 style="color:#C9A84C;font-family:Georgia,serif;font-style:italic;margin:0;font-size:26px">Control de Vacaciones</h1>
    <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px">SITT · H. XXV Ayuntamiento de Tijuana</p>
  </div>`;

const footerHtml = `<p style="color:#aaa;font-size:11px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;text-align:center">Generado automáticamente por el Sistema de Control de Vacaciones SITT</p>`;

async function enviarNuevaSolicitud({ nombre, apellido, puesto, departamento, fecha_inicio, fecha_fin, dias }) {
  try {
    await transporter.sendMail({
      from: `"Sistema Vacaciones SITT" <${process.env.EMAIL_USER}>`,
      to: [CORREO_RRHH, CORREO_ADMIN],
      subject: `📋 Nueva solicitud — ${nombre} ${apellido}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        ${headerHtml}
        <div style="padding:36px;background:#fff">
          <div style="background:#E3F2FD;border-left:4px solid #1565C0;border-radius:8px;padding:14px 18px;margin-bottom:20px">
            <p style="color:#1565C0;font-weight:bold;font-size:16px;margin:0">📋 Nueva solicitud de vacaciones pendiente de aprobación</p>
          </div>
          <div style="background:#F5F3F0;border-radius:10px;padding:18px 22px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:7px 0;color:#888;font-size:13px;width:140px">Empleado</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B;font-size:15px">${nombre} ${apellido}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Puesto</td><td style="padding:7px 0;color:#333">${puesto||'—'}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Departamento</td><td style="padding:7px 0;color:#333">${departamento||'—'}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Fecha inicio</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B">${fmtFecha(fecha_inicio)}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Fecha fin</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B">${fmtFecha(fecha_fin)}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Días hábiles</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B;font-size:18px">${dias}</td></tr>
            </table>
          </div>
          <p style="color:#555;font-size:14px">Ingresa al sistema para aprobar o rechazar esta solicitud.</p>
          ${footerHtml}
        </div>
      </div>`,
    });
  } catch(e) { console.error('Email error:', e.message); }
}

async function enviarAprobacion({ nombre, apellido, correo, fecha_inicio, fecha_fin, dias }) {
  if (!correo) return;
  try {
    await transporter.sendMail({
      from: `"Sistema Vacaciones SITT" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: `✅ Vacaciones aprobadas — SITT Tijuana`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        ${headerHtml}
        <div style="padding:36px;background:#fff">
          <div style="background:#E8F5E9;border-left:4px solid #27ae60;border-radius:8px;padding:14px 18px;margin-bottom:20px">
            <p style="color:#1B5E20;font-weight:bold;font-size:16px;margin:0">✅ ¡Tus vacaciones fueron aprobadas!</p>
          </div>
          <p style="color:#333;font-size:15px">Hola <strong>${nombre} ${apellido}</strong>,</p>
          <div style="background:#F5F3F0;border-radius:10px;padding:18px 22px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:7px 0;color:#888;font-size:13px;width:140px">Fecha inicio</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B">${fmtFecha(fecha_inicio)}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Fecha fin</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B">${fmtFecha(fecha_fin)}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Días hábiles</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B;font-size:18px">${dias}</td></tr>
            </table>
          </div>
          <div style="background:#FFF8E1;border:2px solid #C9A84C;border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center">
            <p style="color:#856404;font-weight:bold;font-size:15px;margin:0 0 8px">⚠️ IMPORTANTE</p>
            <p style="color:#856404;font-size:14px;margin:0;line-height:1.6">Favor de acudir <strong>el día de hoy</strong> en horario de <strong>8:00 AM a 5:00 PM</strong> a <strong>Recursos Humanos</strong> para firmar tu permiso de vacaciones.</p>
          </div>
          ${footerHtml}
        </div>
      </div>`,
    });
  } catch(e) { console.error('Email error:', e.message); }
}

async function enviarRechazo({ nombre, apellido, correo, fecha_inicio, fecha_fin, dias, motivo }) {
  if (!correo) return;
  try {
    await transporter.sendMail({
      from: `"Sistema Vacaciones SITT" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: `❌ Solicitud de vacaciones rechazada — SITT Tijuana`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        ${headerHtml}
        <div style="padding:36px;background:#fff">
          <div style="background:#FFEBEE;border-left:4px solid #B71C1C;border-radius:8px;padding:14px 18px;margin-bottom:20px">
            <p style="color:#B71C1C;font-weight:bold;font-size:16px;margin:0">❌ Tu solicitud fue rechazada</p>
          </div>
          <p style="color:#333;font-size:15px">Hola <strong>${nombre} ${apellido}</strong>,</p>
          <div style="background:#F5F3F0;border-radius:10px;padding:18px 22px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:7px 0;color:#888;font-size:13px;width:140px">Fecha inicio</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B">${fmtFecha(fecha_inicio)}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Fecha fin</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B">${fmtFecha(fecha_fin)}</td></tr>
              <tr><td style="padding:7px 0;color:#888;font-size:13px">Días hábiles</td><td style="padding:7px 0;font-weight:bold;color:#6B0F2B;font-size:18px">${dias}</td></tr>
              ${motivo?`<tr><td style="padding:7px 0;color:#888;font-size:13px">Motivo</td><td style="padding:7px 0;color:#B71C1C;font-weight:bold">${motivo}</td></tr>`:''}
            </table>
          </div>
          <p style="color:#555;font-size:14px">Si tienes dudas, acércate a Recursos Humanos.</p>
          ${footerHtml}
        </div>
      </div>`,
    });
  } catch(e) { console.error('Email error:', e.message); }
}

module.exports = { enviarNuevaSolicitud, enviarAprobacion, enviarRechazo };
