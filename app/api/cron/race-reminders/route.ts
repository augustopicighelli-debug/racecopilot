// Cron endpoint: reminders de carrera y email del día de carrera
// Se llama cada día a las 8am UTC via vercel.json
// 8am UTC ≈ 5am Argentina (UTC-3) / 9am España (UTC+1)
// Protegido con Authorization: Bearer {CRON_SECRET}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendRaceReminderEmail } from '@/lib/email/resend';

// Días en los que se manda reminder (sin contar día 0 = race day)
const REMINDER_DAYS = [30, 14, 10, 7, 5, 4, 3, 2, 1];

export async function GET(req: NextRequest) {
  // Validar CRON_SECRET
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Faltan env vars de Supabase' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Calcular rango de fechas: hoy y los próximos 31 días (cubre el reminder de 30 días)
  const todayStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

  // Traer carreras desde hoy hasta 31 días (todos los reminders posibles)
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + 31);
  const limitStr = limitDate.toISOString().split('T')[0];

  const { data: races, error: racesError } = await supabaseAdmin
    .from('races')
    .select('id, name, race_date, runner_id')
    .gte('race_date', todayStr)
    .lte('race_date', limitStr);

  if (racesError) {
    return NextResponse.json({ error: racesError.message }, { status: 500 });
  }
  if (!races || races.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No hay carreras en rango' });
  }

  // Obtener usuarios de auth para los emails
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Mapa runner_id → email
  const { data: runners } = await supabaseAdmin.from('runners').select('id, user_id');
  const runnerEmailMap: Record<string, string> = {};
  for (const runner of runners ?? []) {
    const user = users.find(u => u.id === runner.user_id);
    if (user?.email) runnerEmailMap[runner.id] = user.email;
  }

  let sent = 0;
  const errors: string[] = [];

  for (const race of races) {
    const email = runnerEmailMap[race.runner_id];
    if (!email) continue;

    // Calcular días exactos comparando fechas en string (evita bugs por hora/timezone)
    const today = new Date(todayStr + 'T00:00:00Z');
    const raceDay = new Date(race.race_date + 'T00:00:00Z');
    const daysUntil = Math.round((raceDay.getTime() - today.getTime()) / 86400000);

    try {
      if (REMINDER_DAYS.includes(daysUntil)) {
        await sendRaceReminderEmail(email, race.name, daysUntil, race.race_date, race.id);
        sent++;
      }
    } catch (err: any) {
      errors.push(`Race ${race.id} (day ${daysUntil}): ${err.message}`);
    }
  }

  return NextResponse.json({
    sent,
    total: races.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
