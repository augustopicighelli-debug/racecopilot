// Secuencias de email para RaceCopilot
// Onboarding, reactivación, upsell post-carrera, y newsletter
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://racecopilot.com';

// =============================================================================
// ONBOARDING SEQUENCE
// =============================================================================

/**
 * Day 1 ES: "¿Cargaste tu primera carrera?"
 * CTA: crear carrera si no tiene
 */
export async function sendOnboardingDay1Es(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'corredor';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu primera carrera en RaceCopilot</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding-bottom:16px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Hola ${displayName}
              </h2>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Queremos ayudarte a entrenar más inteligente. Lo primero es cargar tu próxima carrera.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                En 3 minutos generarás un plan personalizado basado en el recorrido, tu nivel y el clima del día.
              </p>
            </td>
          </tr>

          <!-- Botón CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/races/new"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Cargar mi primera carrera →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Email del día 1 de tu prueba.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Tu primera carrera en RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendOnboardingDay1Es: \${error.message}`);
}

/**
 * Day 1 EN: "Load your first race"
 * CTA: create race
 */
export async function sendOnboardingDay1En(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'runner';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your first race on RaceCopilot</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-bottom:16px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Hi ${displayName}
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                We're here to help you train smarter. First step: load your next race.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                In just 3 minutes, we'll generate a personalized plan based on the course, your level, and race-day weather.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/races/new"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Load my first race →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Day 1 email of your trial.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your first race on RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendOnboardingDay1En: \${error.message}`);
}

/**
 * Day 3 ES: "Así funciona el plan"
 * Educativo: qué genera el engine (ritmo, hidratación, nutrición, splits)
 */
export async function sendOnboardingDay3Es(to: string, firstName?: string, hasRace?: boolean): Promise<void> {
  const displayName = firstName ?? 'corredor';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cómo funciona tu plan en RaceCopilot</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Cómo funciona tu plan
              </h2>
            </td>
          </tr>

          <!-- Feature 1 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#f97316;">Ritmo personalizado</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Basado en tu perfil, el GPX del recorrido y ajustes por clima.</p>
              </div>
            </td>
          </tr>

          <!-- Feature 2 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#f97316;">Splits y segmentos</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Qué ritmo correr en cada kilómetro para llegar óptimo al final.</p>
              </div>
            </td>
          </tr>

          <!-- Feature 3 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#f97316;">Hidratación y nutrición</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Cuándo y cuánto tomar según la duración y condiciones.</p>
              </div>
            </td>
          </tr>

          <!-- Feature 4 -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#f97316;">Ajustes por clima</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Tu plan se actualiza si cambian las condiciones del día.</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <a href="${hasRace ? `${APP_URL}/races` : `${APP_URL}/races/new`}"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                ${hasRace ? 'Ver mi plan →' : 'Crear mi carrera →'}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Email del día 3 de tu prueba.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Cómo funciona tu plan en RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendOnboardingDay3Es: \${error.message}`);
}

/**
 * Day 3 EN: "How your plan works"
 */
export async function sendOnboardingDay3En(to: string, firstName?: string, hasRace?: boolean): Promise<void> {
  const displayName = firstName ?? 'runner';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>How your plan works on RaceCopilot</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                How your plan works
              </h2>
            </td>
          </tr>

          <!-- Feature 1 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#f97316;">Personalized pacing</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Based on your profile, course elevation, and weather adjustments.</p>
              </div>
            </td>
          </tr>

          <!-- Feature 2 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#f97316;">Splits & segments</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">What pace to run each kilometer to arrive strong at the finish.</p>
              </div>
            </td>
          </tr>

          <!-- Feature 3 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#f97316;">Hydration & nutrition</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">When and how much to fuel based on race duration and conditions.</p>
              </div>
            </td>
          </tr>

          <!-- Feature 4 -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#f97316;">Live weather updates</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Your plan adjusts if conditions change on race day.</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <a href="${hasRace ? `${APP_URL}/races` : `${APP_URL}/races/new`}"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                ${hasRace ? 'View my plan →' : 'Create my race →'}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Day 3 email of your trial.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'How your plan works on RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendOnboardingDay3En: \${error.message}`);
}

/**
 * Day 5 ES: "Cómo leer tu plan"
 * Tip educativo: segmentos, ajustes por clima
 */
export async function sendOnboardingDay5Es(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'corredor';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cómo leer tu plan de carrera</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Guía rápida: cómo leer tu plan
              </h2>
            </td>
          </tr>

          <!-- Tip 1 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#ffffff;">1. Los segmentos son tu GPS</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Cada fila es un kilómetro. El ritmo mostrado es lo que deberías correr en ese tramo considerando la elevación.</p>
              </div>
            </td>
          </tr>

          <!-- Tip 2 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#ffffff;">2. El color indica cómo vas</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Verde: dentro del plan. Amarillo: un poco rápido. Rojo: demasiado rápido para tu meta.</p>
              </div>
            </td>
          </tr>

          <!-- Tip 3 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#ffffff;">3. Ajustes por clima</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Si hay mucho calor, el ritmo se relaja automáticamente. Si lluvia fuerte, más cuidado en descensos.</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;">
                ¿Dudas? Nos falta 1 día de prueba. Carga una carrera ahora y practica.
              </p>
              <a href="${APP_URL}/races/new"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Crear carrera →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Email del día 5 de tu prueba. Quedan 2 días.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Guía rápida: cómo leer tu plan',
    html,
  });

  if (error) throw new Error(`[Resend] sendOnboardingDay5Es: \${error.message}`);
}

/**
 * Day 5 EN: "How to read your plan"
 */
export async function sendOnboardingDay5En(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'runner';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>How to read your race plan</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Quick guide: reading your plan
              </h2>
            </td>
          </tr>

          <!-- Tip 1 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#ffffff;">1. Segments are your GPS</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Each row is one kilometer. The pace shown accounts for the elevation profile in that section.</p>
              </div>
            </td>
          </tr>

          <!-- Tip 2 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#ffffff;">2. Colors show your progress</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">Green: on track. Yellow: slightly faster than plan. Red: too fast for your goal.</p>
              </div>
            </td>
          </tr>

          <!-- Tip 3 -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#ffffff;">3. Weather adjustments</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">High heat? Pace relaxes automatically. Heavy rain? Extra caution on downhills.</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;">
                Questions? You have 2 days of trial left. Load a race and try it out.
              </p>
              <a href="${APP_URL}/races/new"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Create a race →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Day 5 email of your trial. 2 days left.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Quick guide: reading your plan',
    html,
  });

  if (error) throw new Error(`[Resend] sendOnboardingDay5En: \${error.message}`);
}

/**
 * Day 7 ES: "¿Necesitás ayuda? Last chance"
 * Enfoque en lo que pierden si no activan (plan, PDF, clima real, etc.)
 */
export async function sendOnboardingDay7Es(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'corredor';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Último día de tu prueba — ¿necesitás ayuda?</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:16px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Hoy termina tu prueba, ${displayName}
              </h2>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Si activas tu plan hoy, continuarás sin interrupciones. Si no, pierdes acceso a todo lo que generaste.
              </p>
            </td>
          </tr>

          <!-- What they lose -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#ffffff;">Lo que perderías:</p>
              <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#a1a1aa;">
                <li style="margin-bottom:8px;">Tu plan detallado con splits por kilómetro</li>
                <li style="margin-bottom:8px;">Ajustes de clima en tiempo real (24hs antes de carrera)</li>
                <li style="margin-bottom:8px;">Plan de hidratación personalizado</li>
                <li style="margin-bottom:8px;">Descarga en PDF para llevar offline</li>
                <li>Seguimiento post-carrera: comparación real vs plan</li>
              </ul>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/dashboard"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Activar mi plan ahora →
              </a>
            </td>
          </tr>

          <!-- Secondary CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                ¿Preguntas? Respondemos en el dashboard. Todo es muy fácil.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Tu último email de prueba.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Último día — Activá tu plan',
    html,
  });

  if (error) throw new Error(`[Resend] sendOnboardingDay7Es: \${error.message}`);
}

/**
 * Day 7 EN: "Last day — activate your plan"
 */
export async function sendOnboardingDay7En(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'runner';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your trial ends today — need help?</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:16px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Your trial ends today, ${displayName}
              </h2>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Activate your plan today to continue seamlessly. If you don't, you'll lose access to everything you created.
              </p>
            </td>
          </tr>

          <!-- What they lose -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#ffffff;">What you'd lose:</p>
              <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#a1a1aa;">
                <li style="margin-bottom:8px;">Your detailed race plan with per-km splits</li>
                <li style="margin-bottom:8px;">Real-time weather adjustments (24hs before race)</li>
                <li style="margin-bottom:8px;">Personalized hydration strategy</li>
                <li style="margin-bottom:8px;">Offline PDF download</li>
                <li>Post-race analysis: actual vs planned performance</li>
              </ul>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/dashboard"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Activate my plan now →
              </a>
            </td>
          </tr>

          <!-- Secondary message -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                Questions? We're in your dashboard. Everything is super easy.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Your final trial email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Last day — activate your plan',
    html,
  });

  if (error) throw new Error(`[Resend] sendOnboardingDay7En: \${error.message}`);
}

// =============================================================================
// REACTIVATION SEQUENCE
// =============================================================================

/**
 * Day 3 post-cancel ES: "¿Qué pasó?"
 * Pedir feedback sin oferta (soft, no desperate)
 */
export async function sendReactivationDay3Es(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'corredor';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>¿Qué pasó con tu plan de carrera?</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Te echamos de menos, ${displayName}
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Vimos que cancelaste tu suscripción. Nos gustaría saber por qué.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                ¿Fue caro? ¿Algo no funcionó? ¿Necesitás más features? Tu feedback nos ayuda a mejorar.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="mailto:hola@racecopilot.com?subject=Feedback%20sobre%20mi%20cancelación"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Contar qué pasó →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Email de reactivación.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: '¿Qué pasó con tu suscripción?',
    html,
  });

  if (error) throw new Error(`[Resend] sendReactivationDay3Es: \${error.message}`);
}

/**
 * Day 3 post-cancel EN: "What happened?"
 */
export async function sendReactivationDay3En(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'runner';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>What happened to your race plan?</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                We miss you, ${displayName}
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                We noticed you cancelled your subscription. We'd love to know why.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Was it the price? Something didn't work? Missing a feature? Your feedback helps us improve.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="mailto:hola@racecopilot.com?subject=Feedback%20about%20my%20cancellation"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Tell us what happened →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Reactivation email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'What happened to your subscription?',
    html,
  });

  if (error) throw new Error(`[Resend] sendReactivationDay3En: \${error.message}`);
}

/**
 * Day 14 post-cancel ES: "Vuelve con 30% off 3 meses"
 * Oferta de reactivación
 */
export async function sendReactivationDay14Es(
  to: string,
  firstName?: string,
  discountCode?: string,
): Promise<void> {
  const displayName = firstName ?? 'corredor';
  const code = discountCode ?? 'VUELVE30';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vuelve con 30% off en tu suscripción</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:16px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Vuelve con una sorpresa
              </h2>
            </td>
          </tr>

          <!-- Offer highlight -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <div style="background:#1a1a1a;border-radius:10px;padding:24px;border:1px solid #f97316;">
                <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;text-transform:uppercase;">Oferta exclusiva</p>
                <p style="margin:0 0 16px;font-size:28px;font-weight:700;color:#f97316;">30% off</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">en 3 meses de suscripción</p>
              </div>
            </td>
          </tr>

          <!-- Code -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">Usa el código:</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;font-family:monospace;">
                ${code}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Esperamos hayas disfrutado de RaceCopilot. Si algo no funcionó o podemos mejorar, escríbenos. Esta oferta es solo para ti.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/pricing"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Volver a suscribirse →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Oferta válida por 7 días.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: '30% off para volver a RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendReactivationDay14Es: \${error.message}`);
}

/**
 * Day 14 post-cancel EN: "Come back with 30% off 3 months"
 */
export async function sendReactivationDay14En(
  to: string,
  firstName?: string,
  discountCode?: string,
): Promise<void> {
  const displayName = firstName ?? 'runner';
  const code = discountCode ?? 'COMEBACK30';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Come back with 30% off your subscription</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:16px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Come back with a surprise
              </h2>
            </td>
          </tr>

          <!-- Offer highlight -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <div style="background:#1a1a1a;border-radius:10px;padding:24px;border:1px solid #f97316;">
                <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;text-transform:uppercase;">Exclusive offer</p>
                <p style="margin:0 0 16px;font-size:28px;font-weight:700;color:#f97316;">30% off</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">3 months of subscription</p>
              </div>
            </td>
          </tr>

          <!-- Code -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">Use code:</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;font-family:monospace;">
                ${code}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                We hope you enjoyed RaceCopilot. If something didn't work or we can improve, let us know. This offer is just for you.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/pricing"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Resubscribe →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Offer valid for 7 days.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: '30% off to come back to RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendReactivationDay14En: \${error.message}`);
}

/**
 * Day 45 post-cancel ES: Último recordatorio con testimonio fuerte
 */
export async function sendReactivationDay45Es(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'corredor';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Un último recordatorio: RaceCopilot te espera</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Testimony -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:24px;border-left:4px solid #f97316;">
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#ffffff;font-style:italic;">
                  "Corría sin plan. Probé RaceCopilot y cambió todo. Ahora entiendo qué ritmo correr en cada segmento. Mi último 21K lo hice en 1:58 siguiendo el plan, justo mi meta. No vuelvo atrás."
                </p>
                <p style="margin:0;font-size:13px;font-weight:600;color:#f97316;">
                  — Martín, Buenos Aires
                </p>
              </div>
            </td>
          </tr>

          <!-- Final message -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Este es nuestro último email. Sabemos que decidiste no continuar, pero sabemos que corres.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Si tu próxima carrera es importante, RaceCopilot sigue esperándote.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/pricing"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Volver a RaceCopilot →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Último recordatorio. Después de esto, no recibirás más emails.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Un último recordatorio — RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendReactivationDay45Es: \${error.message}`);
}

/**
 * Day 45 post-cancel EN: Last reminder with strong testimony
 */
export async function sendReactivationDay45En(to: string, firstName?: string): Promise<void> {
  const displayName = firstName ?? 'runner';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>One last reminder: RaceCopilot is here for you</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Testimony -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:24px;border-left:4px solid #f97316;">
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#ffffff;font-style:italic;">
                  "I used to race without a plan. RaceCopilot changed everything. Now I understand exactly what pace to run on each segment. My last half marathon was 1:58 following the plan — right on goal. I'm not going back."
                </p>
                <p style="margin:0;font-size:13px;font-weight:600;color:#f97316;">
                  — Martin, Buenos Aires
                </p>
              </div>
            </td>
          </tr>

          <!-- Final message -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#a1a1aa;">
                This is our last email. We know you chose not to continue, but we know you're still running.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                When your next race matters, RaceCopilot is still here.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/pricing"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Back to RaceCopilot →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Final reminder. After this, no more emails.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'One last reminder — RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendReactivationDay45En: \${error.message}`);
}

// =============================================================================
// POST-RACE UPSELL
// =============================================================================

/**
 * Post-race upsell ES: Usuario free con carrera pasada
 * Mostrar qué hubiera obtenido con premium
 */
export async function sendPostRaceUpsellEs(
  to: string,
  firstName?: string,
  raceName?: string,
): Promise<void> {
  const displayName = firstName ?? 'corredor';
  const race = raceName ?? 'tu carrera';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>¿Qué te perdiste en ${race}?</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                ¡Felicitaciones por ${race}!
              </h2>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Correr una carrera es una victoria. Ahora, imagina hacerla con un plan.
              </p>
            </td>
          </tr>

          <!-- What they missed -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#ffffff;">Esto es lo que te perdiste:</p>
              <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#a1a1aa;">
                <li style="margin-bottom:8px;">Plan detallado con ritmo para cada kilómetro</li>
                <li style="margin-bottom:8px;">Ajustes de clima real 24hs antes de la carrera</li>
                <li style="margin-bottom:8px;">Plan de hidratación personalizado para tu tiempo</li>
                <li style="margin-bottom:8px;">Splits para gastar energía de forma inteligente</li>
                <li>Comparador post-carrera: qué tal vs el plan</li>
              </ul>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;">
                Para tu próxima carrera, vamos a hacerla diferente.
              </p>
              <a href="${APP_URL}/pricing"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Activar plan premium →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Email post-carrera.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `¿Qué te perdiste en ${race}?`,
    html,
  });

  if (error) throw new Error(`[Resend] sendPostRaceUpsellEs: \${error.message}`);
}

/**
 * Post-race upsell EN: Free user with past race
 */
export async function sendPostRaceUpsellEn(
  to: string,
  firstName?: string,
  raceName?: string,
): Promise<void> {
  const displayName = firstName ?? 'runner';
  const race = raceName ?? 'your race';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>What you missed at ${race}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                Congrats on ${race}!
              </h2>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Finishing a race is a victory. Now imagine doing it with a plan.
              </p>
            </td>
          </tr>

          <!-- What they missed -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#ffffff;">Here's what you missed:</p>
              <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#a1a1aa;">
                <li style="margin-bottom:8px;">Detailed plan with pace for every kilometer</li>
                <li style="margin-bottom:8px;">Real-time weather adjustments 24hs before race</li>
                <li style="margin-bottom:8px;">Personalized hydration strategy for your pace</li>
                <li style="margin-bottom:8px;">Smart splits to manage your energy</li>
                <li>Post-race analysis: actual performance vs plan</li>
              </ul>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;">
                For your next race, we'll make it different.
              </p>
              <a href="${APP_URL}/pricing"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Activate premium plan →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Post-race email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `What you missed at \${race}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendPostRaceUpsellEn: \${error.message}`);
}

// =============================================================================
// MONTHLY NEWSLETTER
// =============================================================================

/**
 * Monthly newsletter ES
 * Contenido educativo + feature mention + upcoming races (hispanas + anglo)
 */
export async function sendMonthlyNewsletterEs(
  to: string,
  firstName?: string,
  tipTitle?: string,
  tipBody?: string,
  featureTitle?: string,
  featureBody?: string,
): Promise<void> {
  const displayName = firstName ?? 'corredor';
  const month = new Date().toLocaleDateString('es-AR', { month: 'long' });

  const title = tipTitle ?? 'Hidratación inteligente en carreras de montaña';
  const tip = tipBody ?? 'En carreras largas de montaña, la clave no es hidratarse al máximo, sino hidratar de forma inteligente. Pequeños sorbos cada 15-20 min previenen tanto la deshidratación como el sobrehidratación. Tu RaceCopilot calcula exactamente cuándo y cuánto tomar según tu peso, ritmo y elevación.';
  const feature = featureTitle ?? 'Descargas en PDF';
  const fBody = featureBody ?? 'Ahora podés descargar tu plan en PDF para llevar offline. Imprímelo o guárdalo en tu teléfono. Funciona sin conexión.';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RaceCopilot — Newsletter de ${month}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;text-transform:uppercase;">
                Newsletter de ${month.toUpperCase()}
              </p>
            </td>
          </tr>

          <!-- Section 1: Tip -->
          <tr>
            <td style="padding-bottom:32px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#ffffff;">
                🏃 ${title}
              </h2>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                ${tip}
              </p>
            </td>
          </tr>

          <!-- Section 2: Feature -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:20px;border-left:3px solid #f97316;">
                <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#f97316;">
                  ✨ ${feature}
                </h3>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">
                  ${fBody}
                </p>
              </div>
            </td>
          </tr>

          <!-- Section 3: Upcoming races -->
          <tr>
            <td style="padding-bottom:32px;">
              <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#ffffff;">
                🏁 Próximas carreras para seguir
              </h3>

              <!-- Race 1 -->
              <div style="margin-bottom:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">
                  Carrera de Montaña del Chicamocha (Colombia)
                </p>
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  42K · Elevación: 1.600m · 12 de mayo
                </p>
              </div>

              <!-- Race 2 -->
              <div style="margin-bottom:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">
                  Maratón de Buenos Aires
                </p>
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  42K · Plano · 19 de mayo
                </p>
              </div>

              <!-- Race 3 -->
              <div style="margin-bottom:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">
                  Boston Marathon (USA)
                </p>
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  42K · Rolling · 15 de abril
                </p>
              </div>

              <!-- CTA -->
              <div style="margin-top:20px;">
                <a href="${APP_URL}/races/new"
                   style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                          font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">
                  Ver más carreras →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Recibís este newsletter porque sos usuario de nuestra plataforma.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `RaceCopilot Newsletter — \${month}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendMonthlyNewsletterEs: \${error.message}`);
}

/**
 * Monthly newsletter EN
 */
export async function sendMonthlyNewsletterEn(
  to: string,
  firstName?: string,
  tipTitle?: string,
  tipBody?: string,
  featureTitle?: string,
  featureBody?: string,
): Promise<void> {
  const displayName = firstName ?? 'runner';
  const month = new Date().toLocaleDateString('en-US', { month: 'long' });

  const title = tipTitle ?? 'Smart hydration in mountain races';
  const tip = tipBody ?? "In long mountain races, the key isn't hydrating at maximum, but hydrating smartly. Small sips every 15-20 minutes prevent both dehydration and over-hydration. Your RaceCopilot calculates exactly when and how much to drink based on your weight, pace, and elevation.";
  const feature = featureTitle ?? 'PDF downloads';
  const fBody = featureBody ?? 'Now you can download your plan as a PDF to keep offline. Print it or save it on your phone. Works without connection.';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RaceCopilot — ${month} Newsletter</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;text-transform:uppercase;">
                ${month.toUpperCase()} NEWSLETTER
              </p>
            </td>
          </tr>

          <!-- Section 1: Tip -->
          <tr>
            <td style="padding-bottom:32px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#ffffff;">
                🏃 ${title}
              </h2>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                ${tip}
              </p>
            </td>
          </tr>

          <!-- Section 2: Feature -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="background:#1a1a1a;border-radius:10px;padding:20px;border-left:3px solid #f97316;">
                <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#f97316;">
                  ✨ ${feature}
                </h3>
                <p style="margin:0;font-size:13px;color:#a1a1aa;">
                  ${fBody}
                </p>
              </div>
            </td>
          </tr>

          <!-- Section 3: Upcoming races -->
          <tr>
            <td style="padding-bottom:32px;">
              <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#ffffff;">
                🏁 Upcoming races to follow
              </h3>

              <!-- Race 1 -->
              <div style="margin-bottom:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">
                  Chicamocha Mountain Race (Colombia)
                </p>
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  26M · Elevation: 5,250ft · May 12
                </p>
              </div>

              <!-- Race 2 -->
              <div style="margin-bottom:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">
                  Buenos Aires Marathon (Argentina)
                </p>
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  26M · Flat · May 19
                </p>
              </div>

              <!-- Race 3 -->
              <div style="margin-bottom:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">
                  Boston Marathon (USA)
                </p>
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  26M · Rolling · April 15
                </p>
              </div>

              <!-- CTA -->
              <div style="margin-top:20px;">
                <a href="${APP_URL}/races/new"
                   style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                          font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">
                  See more races →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · You're receiving this newsletter because you're a RaceCopilot user.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `RaceCopilot Newsletter — \${month}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendMonthlyNewsletterEn: \${error.message}`);
}
