// GET /api/plan/share/[token]
// Endpoint público (sin auth) que genera el plan de una carrera compartida.
// El token UUID es opaco — no expone el ID de la carrera ni el runner.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRacePlan } from '@/lib/engine/plan';
import { buildFlatProfile } from '@/lib/engine/elevation';
import { fetchWeather } from '@/lib/weather/open-meteo';
import type { RunnerProfile, AggregatedWeather } from '@/lib/engine/types';

// Solo usamos el cliente admin porque esta ruta es pública (sin JWT de usuario)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  // 1. Buscar la carrera por share_token
  const { data: race, error: raceErr } = await supabaseAdmin
    .from('races')
    .select('id,distance_km,race_date,target_time_s,elevation_gain,runner_id,city,name')
    .eq('share_token', token)
    .maybeSingle();

  if (raceErr || !race) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
  }

  // 2. Cargar perfil del corredor (sin datos sensibles — solo los necesarios para el engine)
  const { data: runner } = await supabaseAdmin
    .from('runners')
    .select('id,weight_kg,height_cm,sweat_level,max_hr,weekly_km')
    .eq('id', race.runner_id)
    .maybeSingle();

  if (!runner) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
  }

  // 3. Carreras de referencia
  const { data: refRaces } = await supabaseAdmin
    .from('reference_races')
    .select('distance_km,time_seconds,race_date,race_type,avg_heart_rate')
    .eq('runner_id', runner.id);

  if (!refRaces || refRaces.length === 0) {
    return NextResponse.json({ error: 'Sin carreras de referencia' }, { status: 400 });
  }

  // 4. Productos de nutrición
  const { data: nutritionProds } = await supabaseAdmin
    .from('nutrition_products')
    .select('name,type,carbs_grams,sodium_mg,caffeine_mg')
    .eq('runner_id', runner.id);

  // 5. Armar RunnerProfile
  const runnerProfile: RunnerProfile = {
    weightKg:     runner.weight_kg,
    heightCm:     runner.height_cm,
    sweatLevel:   runner.sweat_level,
    maxHeartRate: runner.max_hr    ?? undefined,
    weeklyKm:     runner.weekly_km ?? undefined,
    nutritionProducts: (nutritionProds ?? []).map(p => ({
      name:       p.name,
      type:       p.type as 'gel' | 'salt_pill',
      carbsGrams: p.carbs_grams,
      sodiumMg:   p.sodium_mg,
      caffeineMg: p.caffeine_mg,
    })),
    referenceRaces: refRaces.map(r => ({
      distanceKm:   r.distance_km,
      timeSeconds:  r.time_seconds,
      date:         r.race_date,
      type:         r.race_type,
      avgHeartRate: r.avg_heart_rate ?? undefined,
    })),
  };

  // 6. Perfil del recorrido
  const course = buildFlatProfile(race.distance_km, race.elevation_gain ?? undefined);

  // 7. Clima
  const daysUntilRace = Math.ceil(
    (new Date(race.race_date + 'T12:00:00').getTime() - Date.now()) / 86400000
  );
  const weather: AggregatedWeather = race.city
    ? await fetchWeather(race.city, race.race_date, daysUntilRace)
    : { temperature: 12, humidity: 50, windSpeedKmh: 0, windDirectionDeg: 0, sourcesCount: 0, sourceAgreement: 'low', daysUntilRace };

  // 8. Ritmo objetivo
  const targetPacePerKm = race.target_time_s
    ? race.target_time_s / race.distance_km
    : undefined;

  // 9. Generar plan + incluir metadatos de la carrera para la página pública
  try {
    const plan = generateRacePlan({ runner: runnerProfile, course, weather, targetPacePerKm, breakfastHoursAgo: 3 });
    return NextResponse.json({
      plan,
      race: {
        name:          race.name,
        distanceKm:    race.distance_km,
        raceDate:      race.race_date,
        city:          race.city,
        targetTimeS:   race.target_time_s,
        elevationGain: race.elevation_gain,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error generando plan';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
