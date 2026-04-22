// Cliente Resend y funciones para emails transaccionales de RaceCopilot
import { Resend } from 'resend';

// Instancia singleton del cliente — usa la API key del entorno
const resend = new Resend(process.env.RESEND_API_KEY);

// Remitente por defecto.
// Usar onboarding@resend.dev para testing hasta verificar el dominio racecopilot.com
const FROM = 'RaceCopilot <racecopilot@racecopilot.com>';

// URL base de la app (para links en los emails)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://racecopilot.com';

// Días válidos para enviar recordatorio (incluye día 0 = race day)
const REMINDER_DAYS = [30, 14, 10, 7, 5, 4, 3, 2, 1, 0];

// =============================================================================
// sendWelcomeEmail
// Envía un email de bienvenida al usuario que acaba de crear su perfil
// =============================================================================
export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  // Nombre a mostrar: si no hay nombre, usamos "corredor"
  const displayName = name ?? 'corredor';

  // HTML inline con dark theme (fondo #0a0a0a, texto blanco, acento naranja)
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a RaceCopilot</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;padding:40px 32px;">

          <!-- Logo / título -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:800;color:#18181b;letter-spacing:-0.01em;">Race<span style="color:#f97316;">Copilot</span></span>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding-bottom:16px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#18181b;">
                ¡Bienvenido, ${displayName}!
              </h2>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">
                Tu cuenta está lista. Cargá tu primera carrera y generá tu plan personalizado.
              </p>
            </td>
          </tr>

          <!-- Botón CTA naranja -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${APP_URL}/dashboard"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Ir al dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e4e4e7;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Este email fue enviado porque creaste una cuenta.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Enviar — lanzamos error si falla para que el caller lo maneje
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Bienvenido a RaceCopilot',
    html,
  });

  if (error) throw new Error(`[Resend] sendWelcomeEmail: ${error.message}`);
}

// =============================================================================
// sendRaceCreatedEmail
// Confirma que la carrera fue creada y lleva al usuario a generar el plan
// =============================================================================
export async function sendRaceCreatedEmail(
  to: string,
  raceName: string,
  raceDate: string,
  raceId: string,
  distanceKm: number,
  city?: string | null,
): Promise<void> {
  const formattedDate = new Date(raceDate + 'T12:00:00')
    .toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const distLabel = `${distanceKm % 1 === 0 ? distanceKm : distanceKm.toFixed(1)} km`;
  const cityLine = city ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${city}</p>` : '';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Carrera guardada — ${raceName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;padding:40px 32px;">

          <tr><td style="padding-bottom:32px;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">Race<span style="color:#f97316;">Copilot</span></h1>
          </td></tr>

          <tr><td style="padding-bottom:8px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#f97316;text-transform:uppercase;letter-spacing:0.06em;">✓ Carrera guardada</p>
          </td></tr>
          <tr><td style="padding-bottom:24px;">
            <h2 style="margin:0;font-size:20px;font-weight:600;color:#18181b;">${raceName}</h2>
          </td></tr>

          <!-- Detalles de la carrera -->
          <tr><td style="padding-bottom:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;">
              <tr>
                <td style="padding-bottom:12px;">
                  <p style="margin:0;font-size:12px;color:#52525b;text-transform:uppercase;letter-spacing:0.06em;">Fecha</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#18181b;font-weight:500;">${formattedDate}</p>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="margin:0;font-size:12px;color:#52525b;text-transform:uppercase;letter-spacing:0.06em;">Distancia</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#18181b;font-weight:500;">${distLabel}</p>
                  ${cityLine}
                </td>
              </tr>
            </table>
          </td></tr>

          <tr><td style="padding-bottom:16px;">
            <p style="margin:0;font-size:14px;color:#6b7280;">El plan se genera con clima real 24hs antes. Podés verlo en cualquier momento.</p>
          </td></tr>

          <tr><td style="padding-bottom:32px;">
            <a href="${APP_URL}/races/${raceId}"
               style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                      font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
              Ver mi carrera →
            </a>
          </td></tr>

          <tr><td style="border-top:1px solid #e4e4e7;padding-top:24px;">
            <p style="margin:0;font-size:12px;color:#52525b;">RaceCopilot · Confirmación de carrera.</p>
          </td></tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `✓ ${raceName} guardada — ${formattedDate}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendRaceCreatedEmail: ${error.message}`);
}

// =============================================================================
// sendRaceDayEmail
// Se manda el día de la carrera (~5am hora local vía cron 8am UTC)
// =============================================================================
export async function sendRaceDayEmail(
  to: string,
  raceName: string,
  raceId: string,
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>¡Hoy corrés! — ${raceName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #f97316;padding:40px 32px;">

          <tr><td style="padding-bottom:32px;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">Race<span style="color:#f97316;">Copilot</span></h1>
          </td></tr>

          <!-- Countdown cero -->
          <tr><td style="padding-bottom:24px;text-align:center;">
            <div style="display:inline-block;background:#f9fafb;border:1px solid #f97316;border-radius:12px;padding:24px 48px;">
              <p style="margin:0 0 4px;font-size:14px;color:#f97316;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">HOY</p>
              <p style="margin:0;font-size:48px;font-weight:700;color:#18181b;line-height:1;">🏁</p>
            </div>
          </td></tr>

          <tr><td style="padding-bottom:8px;text-align:center;">
            <h2 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">¡Es el día de ${raceName}!</h2>
          </td></tr>
          <tr><td style="padding-bottom:32px;text-align:center;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">
              Meses de entrenamiento para este momento. Confiá en tu preparación.
            </p>
          </td></tr>

          <!-- Tips rápidos -->
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;">
              <tr><td style="padding-bottom:12px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#f97316;">Recordatorios de último momento</p>
              </td></tr>
              <tr><td style="padding-bottom:8px;">
                <p style="margin:0;font-size:13px;color:#6b7280;">💧 Hidratate bien antes de salir</p>
              </td></tr>
              <tr><td style="padding-bottom:8px;">
                <p style="margin:0;font-size:13px;color:#6b7280;">🍌 Desayuno liviano 2-3 horas antes</p>
              </td></tr>
              <tr><td style="padding-bottom:8px;">
                <p style="margin:0;font-size:13px;color:#6b7280;">👟 Entrá despacio — el ritmo llega solo</p>
              </td></tr>
              <tr><td>
                <p style="margin:0;font-size:13px;color:#6b7280;">📋 Revisá tu plan con el clima de hoy</p>
              </td></tr>
            </table>
          </td></tr>

          <tr><td style="padding-bottom:32px;text-align:center;">
            <a href="${APP_URL}/races/${raceId}"
               style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                      font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
              Ver mi plan de hoy →
            </a>
          </td></tr>

          <tr><td style="border-top:1px solid #e4e4e7;padding-top:24px;">
            <p style="margin:0;font-size:12px;color:#52525b;">RaceCopilot · ¡Buena carrera!</p>
          </td></tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `🏁 Hoy corrés — ${raceName}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendRaceDayEmail: ${error.message}`);
}

// =============================================================================
// sendRaceReminderEmail
// Envía recordatorio de carrera — días 30, 14, 10, 7, 5, 4, 3, 2, 1
// El día 0 (race day) se maneja por sendRaceDayEmail
// =============================================================================
export async function sendRaceReminderEmail(
  to: string,
  raceName: string,
  daysUntil: number,
  raceDate: string,
  raceId: string,
): Promise<void> {
  if (!REMINDER_DAYS.includes(daysUntil) || daysUntil === 0) return;

  const formattedDate = new Date(raceDate + 'T12:00:00')
    .toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Copy específico según el día
  const copy: Record<number, { label: string; tip: string }> = {
    30: { label: 'Tenés 30 días para prepararte', tip: 'Es el momento ideal para ajustar el volumen de entrenamiento y asegurarte de tener el equipo listo.' },
    14: { label: '2 semanas — afinando detalles', tip: 'Empezá a reducir el volumen. El tapering te va a llevar a la largada en tu mejor versión.' },
    10: { label: '10 días — recta final', tip: 'Últimas tiradas largas. A partir de ahora, el descanso es entrenamiento.' },
    7:  { label: '1 semana — modo carrera', tip: 'Preparate la ropa, la mochila y el plan de nutrición. Nada de cosas nuevas en el entrenamiento.' },
    5:  { label: '5 días — casi ahí', tip: 'Entrenamiento suave. Tu cuerpo ya tiene todo lo que necesita para el día de la carrera.' },
    4:  { label: '4 días — bajá la intensidad', tip: 'Caminatas, elongación suave. Guardá energía para el domingo.' },
    3:  { label: '3 días — ya falta poco', tip: 'Descansá bien, tomá agua y evitá comidas pesadas. El cuerpo se está cargando.' },
    2:  { label: '2 días — preparate mentalmente', tip: 'Preparate la indumentaria, los geles y todo lo que necesitás. Mañana es el día previo.' },
    1:  { label: 'Mañana es el día', tip: 'Dormí temprano, cená liviano y confiá en todo lo que entrenaste. Mañana sos protagonista.' },
  };

  const { label, tip } = copy[daysUntil] ?? { label: `${daysUntil} días para ${raceName}`, tip: 'Revisá tu plan.' };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${label} — ${raceName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;padding:40px 32px;">

          <tr><td style="padding-bottom:32px;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">Race<span style="color:#f97316;">Copilot</span></h1>
          </td></tr>

          <!-- Cuenta regresiva -->
          <tr><td style="padding-bottom:24px;text-align:center;">
            <div style="display:inline-block;background:#f9fafb;border:1px solid #e4e4e7;border-radius:12px;padding:20px 40px;">
              <p style="margin:0 0 4px;font-size:52px;font-weight:700;color:#f97316;line-height:1;">${daysUntil}</p>
              <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">${daysUntil === 1 ? 'día' : 'días'}</p>
            </div>
          </td></tr>

          <tr><td style="padding-bottom:8px;text-align:center;">
            <h2 style="margin:0;font-size:19px;font-weight:600;color:#18181b;">${label}</h2>
          </td></tr>
          <tr><td style="padding-bottom:8px;text-align:center;">
            <p style="margin:0;font-size:15px;color:#f97316;font-weight:500;">${raceName}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${formattedDate}</p>
          </td></tr>

          <!-- Tip del día -->
          <tr><td style="padding:24px 0;">
            <div style="background:#f9fafb;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${tip}</p>
            </div>
          </td></tr>

          <tr><td style="padding-bottom:32px;text-align:center;">
            <a href="${APP_URL}/races/${raceId}"
               style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                      font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
              Ver mi plan →
            </a>
          </td></tr>

          <tr><td style="border-top:1px solid #e4e4e7;padding-top:24px;">
            <p style="margin:0;font-size:12px;color:#52525b;">RaceCopilot · Recordatorio automático de carrera.</p>
          </td></tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${daysUntil === 1 ? 'Mañana corrés' : `${daysUntil} días`} — ${raceName}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendRaceReminderEmail: ${error.message}`);
}

// =============================================================================
// sendRaceReminderEmailEn — English version
// =============================================================================
export async function sendRaceReminderEmailEn(
  to: string,
  raceName: string,
  daysUntil: number,
  raceDate: string,
  raceId: string,
): Promise<void> {
  if (!REMINDER_DAYS.includes(daysUntil) || daysUntil === 0) return;

  const formattedDate = new Date(raceDate + 'T12:00:00')
    .toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const copy: Record<number, { label: string; tip: string }> = {
    30: { label: '30 days to go — time to prepare', tip: 'Perfect time to fine-tune your training volume and make sure your gear is ready.' },
    14: { label: '2 weeks out — sharpening up', tip: 'Start reducing your volume. The taper will get you to the start line feeling your best.' },
    10: { label: '10 days — final stretch', tip: 'Last long runs. From here on, rest IS training.' },
    7:  { label: '1 week — race mode on', tip: 'Prep your kit, your bag, and your nutrition plan. Nothing new in training from here.' },
    5:  { label: '5 days — almost there', tip: 'Easy sessions only. Your body already has everything it needs for race day.' },
    4:  { label: '4 days — dial it back', tip: 'Light walks and stretching. Save your energy for the race.' },
    3:  { label: '3 days — the countdown is real', tip: 'Rest well, stay hydrated, avoid heavy meals. Your body is loading up.' },
    2:  { label: '2 days — get ready mentally', tip: 'Lay out your kit, pack your gels. Tomorrow is the day before.' },
    1:  { label: 'Tomorrow is race day', tip: 'Sleep early, eat light, trust your training. Tomorrow you race.' },
  };

  const { label, tip } = copy[daysUntil] ?? { label: `${daysUntil} days to ${raceName}`, tip: 'Check your plan.' };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${label} — ${raceName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;padding:40px 32px;">

        <tr><td style="padding-bottom:32px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">Race<span style="color:#f97316;">Copilot</span></h1>
        </td></tr>

        <tr><td style="padding-bottom:24px;text-align:center;">
          <div style="display:inline-block;background:#f9fafb;border:1px solid #e4e4e7;border-radius:12px;padding:20px 40px;">
            <p style="margin:0 0 4px;font-size:52px;font-weight:700;color:#f97316;line-height:1;">${daysUntil}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">${daysUntil === 1 ? 'day' : 'days'}</p>
          </div>
        </td></tr>

        <tr><td style="padding-bottom:8px;text-align:center;">
          <h2 style="margin:0;font-size:19px;font-weight:600;color:#18181b;">${label}</h2>
        </td></tr>
        <tr><td style="padding-bottom:8px;text-align:center;">
          <p style="margin:0;font-size:15px;color:#f97316;font-weight:500;">${raceName}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${formattedDate}</p>
        </td></tr>

        <tr><td style="padding:24px 0;">
          <div style="background:#f9fafb;border-radius:10px;padding:16px;border-left:3px solid #f97316;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${tip}</p>
          </div>
        </td></tr>

        <tr><td style="padding-bottom:32px;text-align:center;">
          <a href="${APP_URL}/races/${raceId}"
             style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                    font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
            View my plan →
          </a>
        </td></tr>

        <tr><td style="border-top:1px solid #e4e4e7;padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#52525b;">RaceCopilot · Automatic race reminder.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${daysUntil === 1 ? 'Race day tomorrow' : `${daysUntil} days`} — ${raceName}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendRaceReminderEmailEn: ${error.message}`);
}

// =============================================================================
// sendRaceDayEmailEn — English version
// =============================================================================
export async function sendRaceDayEmailEn(
  to: string,
  raceName: string,
  raceId: string,
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Race day! — ${raceName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #f97316;padding:40px 32px;">

        <tr><td style="padding-bottom:32px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">Race<span style="color:#f97316;">Copilot</span></h1>
        </td></tr>

        <tr><td style="padding-bottom:24px;text-align:center;">
          <div style="display:inline-block;background:#f9fafb;border:1px solid #f97316;border-radius:12px;padding:24px 48px;">
            <p style="margin:0 0 4px;font-size:14px;color:#f97316;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">TODAY</p>
            <p style="margin:0;font-size:48px;font-weight:700;color:#18181b;line-height:1;">🏁</p>
          </div>
        </td></tr>

        <tr><td style="padding-bottom:8px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">It's ${raceName} day!</h2>
        </td></tr>
        <tr><td style="padding-bottom:32px;text-align:center;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">Months of training for this moment. Trust your preparation.</p>
        </td></tr>

        <tr><td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;">
            <tr><td style="padding-bottom:12px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#f97316;">Last-minute reminders</p>
            </td></tr>
            <tr><td style="padding-bottom:8px;"><p style="margin:0;font-size:13px;color:#6b7280;">💧 Hydrate well before heading out</p></td></tr>
            <tr><td style="padding-bottom:8px;"><p style="margin:0;font-size:13px;color:#6b7280;">🍌 Light breakfast 2-3 hours before</p></td></tr>
            <tr><td style="padding-bottom:8px;"><p style="margin:0;font-size:13px;color:#6b7280;">👟 Start easy — your pace will come</p></td></tr>
            <tr><td><p style="margin:0;font-size:13px;color:#6b7280;">📋 Check your plan with today's weather</p></td></tr>
          </table>
        </td></tr>

        <tr><td style="padding-bottom:32px;text-align:center;">
          <a href="${APP_URL}/races/${raceId}"
             style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                    font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
            View today's plan →
          </a>
        </td></tr>

        <tr><td style="border-top:1px solid #e4e4e7;padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#52525b;">RaceCopilot · Good luck out there!</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `🏁 Race day — ${raceName}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendRaceDayEmailEn: ${error.message}`);
}

// =============================================================================
// sendWeatherAlertEmail
// Avisa que el clima cambió significativamente respecto al plan generado
// =============================================================================
export async function sendWeatherAlertEmail(
  to: string,
  raceName: string,
  raceDate: string,
  raceId: string,
  oldTemp: number,
  newTemp: number,
  newHumidity: number,
  newWindKmh: number,
): Promise<void> {
  const formattedDate = new Date(raceDate + 'T12:00:00')
    .toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  const tempDiff = Math.round(newTemp - oldTemp);
  const tempArrow = tempDiff > 0 ? '↑' : '↓';
  const diffText = `${Math.abs(tempDiff)}°C ${tempArrow} respecto al plan`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cambio de clima — ${raceName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #f97316;padding:40px 32px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">
                Race<span style="color:#f97316;">Copilot</span>
              </h1>
            </td>
          </tr>

          <!-- Alerta -->
          <tr>
            <td style="padding-bottom:8px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#f97316;text-transform:uppercase;letter-spacing:0.06em;">
                ⚠ Alerta de clima
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:8px;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#18181b;">
                El clima cambió para ${raceName}
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:14px;color:#6b7280;">${formattedDate}</p>
            </td>
          </tr>

          <!-- Comparativa -->
          <tr>
            <td style="padding-bottom:28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <p style="margin:0;font-size:13px;color:#6b7280;">Temperatura al generar el plan</p>
                    <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#18181b;">${Math.round(oldTemp)}°C</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#6b7280;">Temperatura actualizada</p>
                    <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#f97316;">${Math.round(newTemp)}°C <span style="font-size:14px;">(${diffText})</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;border-top:1px solid #333;">
                    <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Humedad: ${newHumidity}% · Viento: ${Math.round(newWindKmh)} km/h</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                Te recomendamos regenerar tu plan para que refleje las condiciones actuales.
              </p>
              <a href="${APP_URL}/races/${raceId}"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Regenerar mi plan →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e4e4e7;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Alerta automática 24hs antes de tu carrera.
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
    subject: `⚠ Cambio de clima para ${raceName}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendWeatherAlertEmail: ${error.message}`);
}
