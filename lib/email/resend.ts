// Cliente Resend y funciones para emails transaccionales de RaceCopilot
import { Resend } from 'resend';

// Instancia singleton del cliente — usa la API key del entorno
const resend = new Resend(process.env.RESEND_API_KEY);

// Remitente por defecto.
// Usar onboarding@resend.dev para testing hasta verificar el dominio racecopilot.com
const FROM = 'onboarding@resend.dev';

// URL base de la app (para links en los emails)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://racecopilot.com';

// Días válidos para enviar recordatorio
const REMINDER_DAYS = [30, 14, 7, 3, 1];

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
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222222;padding:40px 32px;">

          <!-- Logo / título -->
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
                ¡Bienvenido, ${displayName}!
              </h2>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
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
            <td style="border-top:1px solid #222222;padding-top:24px;">
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
// sendRaceReminderEmail
// Envía recordatorio de carrera — SOLO si daysUntil es 30, 14, 7, 3 o 1
// =============================================================================
export async function sendRaceReminderEmail(
  to: string,
  raceName: string,
  daysUntil: number,
  raceDate: string,
  raceId: string,
): Promise<void> {
  // Validar que es un día de recordatorio válido; si no, no enviamos
  if (!REMINDER_DAYS.includes(daysUntil)) return;

  // Texto descriptivo según los días que faltan
  const urgencyLabel =
    daysUntil === 1 ? '¡Mañana es el día!' :
    daysUntil === 3 ? '¡En 3 días!' :
    `Faltan ${daysUntil} días`;

  // Formatear la fecha para mostrarla en el email (ej: "15 de mayo de 2025")
  const formattedDate = new Date(raceDate + 'T12:00:00')
    .toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${daysUntil} días para ${raceName}</title>
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

          <!-- Cuenta regresiva visual -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <div style="display:inline-block;background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px 40px;">
                <p style="margin:0 0 4px 0;font-size:56px;font-weight:700;color:#f97316;line-height:1;">
                  ${daysUntil}
                </p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;">
                  ${daysUntil === 1 ? 'día' : 'días'}
                </p>
              </div>
            </td>
          </tr>

          <!-- Info de la carrera -->
          <tr>
            <td style="padding-bottom:8px;text-align:center;">
              <h2 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">
                ${urgencyLabel}
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <p style="margin:0;font-size:15px;color:#f97316;font-weight:500;">
                ${raceName}
              </p>
              <p style="margin:4px 0 0 0;font-size:13px;color:#a1a1aa;">
                ${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Botón CTA -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <a href="${APP_URL}/races/${raceId}"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Ver mi plan →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #222222;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                RaceCopilot · Recordatorio automático de carrera.
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
    subject: `${daysUntil} días para ${raceName}`,
    html,
  });

  if (error) throw new Error(`[Resend] sendRaceReminderEmail: ${error.message}`);
}
