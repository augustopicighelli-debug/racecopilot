// Cron horario: envía el email de race day cuando son las 5am en la timezone de la carrera
// Corre cada hora. Marca raceday_email_sent=true para no reenviar.
// Protegido con CRON_SECRET
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendRaceDayEmail, sendRaceDayEmailEn } from '@/lib/email/resend';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Traer carreras de hoy que no hayan recibido el email todavía
  const { data: races, error: racesError } = await supabase
    .from('races')
    .select('id, name, runner_id, timezone')
    .eq('race_date', todayStr)
    .eq('raceday_email_sent', false);

  if (racesError) return NextResponse.json({ error: racesError.message }, { status: 500 });
  if (!races || races.length === 0) return NextResponse.json({ sent: 0 });

  // Emails de usuarios
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const { data: runners } = await supabase.from('runners').select('id, user_id, language');
  const runnerMap: Record<string, { email: string; language: string }> = {};
  for (const runner of runners ?? []) {
    const user = users?.find(u => u.id === runner.user_id);
    if (user?.email) runnerMap[runner.id] = { email: user.email, language: runner.language ?? 'es' };
  }

  let sent = 0;
  const errors: string[] = [];

  for (const race of races) {
    // Si no hay timezone, usar UTC-3 (Argentina) como fallback
    const tz = race.timezone ?? 'America/Argentina/Buenos_Aires';

    // Obtener la hora local actual en esa timezone
    const now = new Date();
    const localHour = parseInt(
      new Intl.DateTimeFormat('en', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false,
      }).format(now),
      10,
    );

    // Solo enviar si son las 5am en la timezone de la carrera
    if (localHour !== 5) continue;

    const runner = runnerMap[race.runner_id];
    if (!runner) continue;
    const { email, language } = runner;

    try {
      const en = language === 'en';
      await (en ? sendRaceDayEmailEn : sendRaceDayEmail)(email, race.name, race.id);
      // Marcar como enviado para no reenviar en la próxima hora
      await supabase.from('races').update({ raceday_email_sent: true }).eq('id', race.id);
      sent++;
    } catch (err: any) {
      errors.push(`Race ${race.id}: ${err.message}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined });
}
