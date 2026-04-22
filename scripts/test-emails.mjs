// Script de test para enviar emails de muestra a la dirección del dev
// Uso: node scripts/test-emails.mjs
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM      = 'RaceCopilot <racecopilot@racecopilot.com>';
const TO        = 'augustopicighelli@gmail.com';
const APP       = 'https://racecopilot.com';
const RACE_NAME = 'Maratón de Mendoza';
const RACE_DATE = '27 de abril de 2026';
const RACE_ID   = 'test';

// ── helpers ──────────────────────────────────────────────────────────────────

const LOGO = `<span style="font-size:22px;font-weight:800;color:#18181b;letter-spacing:-0.01em;">Race<span style="color:#f97316;">Copilot</span></span>`;

function card(content, borderColor = '#e4e4e7') {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid ${borderColor};padding:40px 32px;">
      <tr><td style="padding-bottom:32px;">${LOGO}</td></tr>
      ${content}
      <tr><td style="border-top:1px solid #e4e4e7;padding-top:24px;">
        <p style="margin:0;font-size:12px;color:#52525b;">RaceCopilot · Email de prueba.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(text, url) {
  return `<a href="${url}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">${text}</a>`;
}

function tip(text) {
  return `<div style="background:#f9fafb;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
    <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${text}</p>
  </div>`;
}

// ── emails ───────────────────────────────────────────────────────────────────

const emails = [
  {
    subject: 'Tu primera carrera en RaceCopilot',
    html: card(`
      <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:20px;font-weight:600;color:#18181b;">Hola Augusto</h2></td></tr>
      <tr><td style="padding-bottom:32px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6b7280;">Queremos ayudarte a entrenar más inteligente. Lo primero es cargar tu próxima carrera.</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">En 3 minutos generarás un plan personalizado basado en el recorrido, tu nivel y el clima del día.</p>
      </td></tr>
      <tr><td style="padding-bottom:32px;">${btn('Cargar mi primera carrera →', APP + '/races/new')}</td></tr>
    `),
  },
  {
    subject: '7 días — ' + RACE_NAME,
    html: card(`
      <tr><td style="padding-bottom:24px;text-align:center;">
        <div style="display:inline-block;background:#f9fafb;border:1px solid #e4e4e7;border-radius:12px;padding:20px 40px;">
          <p style="margin:0 0 4px;font-size:52px;font-weight:700;color:#f97316;line-height:1;">7</p>
          <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">días</p>
        </div>
      </td></tr>
      <tr><td style="padding-bottom:8px;text-align:center;"><h2 style="margin:0;font-size:19px;font-weight:600;color:#18181b;">1 semana — modo carrera</h2></td></tr>
      <tr><td style="padding-bottom:8px;text-align:center;">
        <p style="margin:0;font-size:15px;color:#f97316;font-weight:500;">${RACE_NAME}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${RACE_DATE}</p>
      </td></tr>
      <tr><td style="padding:24px 0;">${tip('Preparate la ropa, la mochila y el plan de nutrición. Nada de cosas nuevas en el entrenamiento.')}</td></tr>
      <tr><td style="padding-bottom:32px;text-align:center;">${btn('Ver mi plan →', APP + '/races/' + RACE_ID)}</td></tr>
    `),
  },
  {
    subject: '🏁 Hoy corrés — ' + RACE_NAME,
    html: card(`
      <tr><td style="padding-bottom:24px;text-align:center;">
        <div style="display:inline-block;background:#fff7ed;border:1px solid #f97316;border-radius:12px;padding:24px 48px;">
          <p style="margin:0 0 4px;font-size:14px;color:#f97316;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">HOY</p>
          <p style="margin:0;font-size:48px;font-weight:700;color:#18181b;line-height:1;">🏁</p>
        </div>
      </td></tr>
      <tr><td style="padding-bottom:8px;text-align:center;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">¡Es el día de ${RACE_NAME}!</h2></td></tr>
      <tr><td style="padding-bottom:32px;text-align:center;"><p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">Meses de entrenamiento para este momento. Confiá en tu preparación.</p></td></tr>
      <tr><td style="padding-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;">
          <tr><td style="padding-bottom:12px;"><p style="margin:0;font-size:13px;font-weight:600;color:#f97316;">Recordatorios de último momento</p></td></tr>
          <tr><td style="padding-bottom:8px;"><p style="margin:0;font-size:13px;color:#6b7280;">💧 Hidratate bien antes de salir</p></td></tr>
          <tr><td style="padding-bottom:8px;"><p style="margin:0;font-size:13px;color:#6b7280;">🍌 Desayuno liviano 2-3 horas antes</p></td></tr>
          <tr><td style="padding-bottom:8px;"><p style="margin:0;font-size:13px;color:#6b7280;">👟 Entrá despacio — el ritmo llega solo</p></td></tr>
          <tr><td><p style="margin:0;font-size:13px;color:#6b7280;">📋 Revisá tu plan con el clima de hoy</p></td></tr>
        </table>
      </td></tr>
      <tr><td style="padding-bottom:32px;text-align:center;">${btn('Ver mi plan de hoy →', APP + '/races/' + RACE_ID)}</td></tr>
    `, '#f97316'),
  },
];

// ── enviar ────────────────────────────────────────────────────────────────────

for (const email of emails) {
  const { data, error } = await resend.emails.send({ from: FROM, to: TO, ...email });
  if (error) console.error('✗', email.subject, error.message);
  else console.log('✓', email.subject, '→', data.id);
}
