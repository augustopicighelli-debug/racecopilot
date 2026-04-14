// Cron endpoint: recorre todas las carreras futuras y envía recordatorios por email
// Se llama automáticamente cada día a las 8am UTC via vercel.json
// Protegido con Authorization: Bearer {CRON_SECRET}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendRaceReminderEmail } from '@/lib/email/resend';

// =============================================================================
// GET /api/cron/race-reminders
// =============================================================================
export async function GET(req: NextRequest) {
  // --- Validar CRON_SECRET en el header Authorization ---
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  // Si hay CRON_SECRET configurado, verificamos que el header coincida
  if (secret) {
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // --- Crear cliente Supabase con service role (bypasa RLS) ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Faltan env vars de Supabase (URL o SERVICE_ROLE_KEY)' },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }, // server-side: no persistir sesión
  });

  // --- Leer todas las carreras futuras junto con su runner ---
  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

  const { data: races, error: racesError } = await supabaseAdmin
    .from('races')
    .select('id, name, race_date, runner_id')
    .gte('race_date', today); // solo carreras que aún no pasaron

  if (racesError) {
    return NextResponse.json({ error: racesError.message }, { status: 500 });
  }

  if (!races || races.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No hay carreras futuras' });
  }

  // --- Obtener todos los users de auth para buscar emails ---
  // listUsers devuelve paginado; para apps pequeñas una página alcanza (max 1000)
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Mapa: runner_id → email (pasando por la tabla runners)
  // Necesitamos saber el user_id de cada runner para buscar en auth.users
  const { data: runners, error: runnersError } = await supabaseAdmin
    .from('runners')
    .select('id, user_id');

  if (runnersError) {
    return NextResponse.json({ error: runnersError.message }, { status: 500 });
  }

  // Construir mapa runner_id → email
  const runnerEmailMap: Record<string, string> = {};
  for (const runner of runners ?? []) {
    const user = users.find((u) => u.id === runner.user_id);
    if (user?.email) {
      runnerEmailMap[runner.id] = user.email;
    }
  }

  // --- Recorrer carreras y enviar recordatorios según días que faltan ---
  let sent = 0;
  const errors: string[] = [];

  for (const race of races) {
    // Calcular días hasta la carrera (redondeando hacia arriba)
    const msUntil = new Date(race.race_date + 'T12:00:00').getTime() - Date.now();
    const daysUntil = Math.ceil(msUntil / 86400000);

    // Buscar el email del runner de esta carrera
    const email = runnerEmailMap[race.runner_id];
    if (!email) continue; // no tenemos email, saltear

    try {
      // sendRaceReminderEmail ignora internamente si daysUntil no es válido
      await sendRaceReminderEmail(email, race.name, daysUntil, race.race_date, race.id);
      // Solo contamos como enviado si el día era válido (la función no lanza en ese caso)
      // Los días válidos son 30, 14, 7, 3, 1
      if ([30, 14, 7, 3, 1].includes(daysUntil)) sent++;
    } catch (err: any) {
      // Capturamos errores individuales para no abortar el loop completo
      errors.push(`Race ${race.id}: ${err.message}`);
    }
  }

  return NextResponse.json({
    sent,
    total: races.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
