// Cron endpoint: detecta cambios significativos de clima 24-48hs antes de cada carrera
// y envía un email de alerta al corredor para que regenere su plan.
// Se ejecuta 1 vez por día a las 10am UTC vía vercel.json
// Protegido con Authorization: Bearer {CRON_SECRET}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchWeather } from '@/lib/weather/open-meteo';
import { sendWeatherAlertEmail } from '@/lib/email/resend';
import type { AggregatedWeather } from '@/lib/engine/types';

// Umbral de cambio significativo: diferencia de temperatura > 3°C
const TEMP_THRESHOLD = 3;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Buscar carreras en las próximas 24-48 horas que tengan plan generado
  const now   = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600000).toISOString().split('T')[0];
  const in48h = new Date(now.getTime() + 48 * 3600000).toISOString().split('T')[0];

  const { data: races, error: racesErr } = await supabaseAdmin
    .from('races')
    .select('id, name, race_date, city, runner_id, last_plan_weather, last_plan_at')
    .gte('race_date', in24h)
    .lte('race_date', in48h)
    .not('last_plan_weather', 'is', null); // solo carreras con plan generado

  if (racesErr) return NextResponse.json({ error: racesErr.message }, { status: 500 });
  if (!races || races.length === 0) return NextResponse.json({ sent: 0, checked: 0 });

  // Cargar runners para obtener emails
  const { data: runners } = await supabaseAdmin
    .from('runners')
    .select('id, user_id');

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  const runnerEmailMap: Record<string, string> = {};
  for (const runner of runners ?? []) {
    const user = users.find(u => u.id === runner.user_id);
    if (user?.email) runnerEmailMap[runner.id] = user.email;
  }

  let sent = 0;
  const errors: string[] = [];

  for (const race of races) {
    const email = runnerEmailMap[race.runner_id];
    if (!email || !race.city) continue; // sin email o sin ciudad no podemos comparar

    const daysUntil = Math.ceil(
      (new Date(race.race_date + 'T12:00:00').getTime() - Date.now()) / 86400000
    );

    try {
      // Obtener clima fresco
      const freshWeather: AggregatedWeather = await fetchWeather(race.city, race.race_date, daysUntil);
      const oldWeather = race.last_plan_weather as AggregatedWeather;

      // Calcular diferencia de temperatura
      const tempDiff = Math.abs(freshWeather.temperature - oldWeather.temperature);

      // Solo alertar si el cambio supera el umbral
      if (tempDiff < TEMP_THRESHOLD) continue;

      await sendWeatherAlertEmail(
        email,
        race.name,
        race.race_date,
        race.id,
        oldWeather.temperature,
        freshWeather.temperature,
        freshWeather.humidity,
        freshWeather.windSpeedKmh,
      );

      // Actualizar last_plan_weather con el clima fresco para no enviar duplicados
      await supabaseAdmin.from('races').update({
        last_plan_weather: freshWeather,
      }).eq('id', race.id);

      sent++;
    } catch (err: any) {
      errors.push(`Race ${race.id}: ${err.message}`);
    }
  }

  return NextResponse.json({ sent, checked: races.length, errors: errors.length ? errors : undefined });
}
