import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRacePlan } from '@/lib/engine/plan';

// Cliente admin para guardar el clima sin depender del JWT del usuario
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { buildFlatProfile } from '@/lib/engine/elevation';
import { fetchWeather } from '@/lib/weather/open-meteo';
import type { RunnerProfile, AggregatedWeather } from '@/lib/engine/types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ raceId: string }> }
) {
  // Next.js 15: params es una Promise
  const { raceId } = await context.params;

  // Auth: el cliente manda su JWT en el header Authorization
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Crear cliente con el JWT del usuario → RLS se aplica normalmente
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // 1. Cargar la carrera
  const { data: race, error: raceErr } = await supabase
    .from('races')
    .select('id,distance_km,race_date,target_time_s,elevation_gain,runner_id,city')
    .eq('id', raceId)
    .maybeSingle();

  if (raceErr || !race) {
    return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 });
  }

  // 2. Cargar perfil del corredor
  const { data: runner } = await supabase
    .from('runners')
    .select('id,weight_kg,height_cm,sweat_level,max_hr,weekly_km,is_premium')
    .eq('id', race.runner_id)
    .maybeSingle();

  if (!runner) {
    return NextResponse.json({ error: 'Perfil de corredor no encontrado' }, { status: 404 });
  }

  // Paywall: solo usuarios premium (o en trial activo) pueden generar planes
  if (!runner.is_premium) {
    return NextResponse.json({ error: 'premium_required' }, { status: 403 });
  }

  // 3. Cargar carreras de referencia
  const { data: refRaces } = await supabase
    .from('reference_races')
    .select('distance_km,time_seconds,race_date,race_type,avg_heart_rate')
    .eq('runner_id', runner.id);

  if (!refRaces || refRaces.length === 0) {
    return NextResponse.json({ error: 'Sin carreras de referencia' }, { status: 400 });
  }

  // 3.5. Cargar productos de nutrición del corredor
  const { data: nutritionProds } = await supabase
    .from('nutrition_products')
    .select('name,type,carbs_grams,sodium_mg,caffeine_mg')
    .eq('runner_id', runner.id);

  // 4. Armar RunnerProfile para el engine
  const runnerProfile: RunnerProfile = {
    weightKg:        runner.weight_kg,
    heightCm:        runner.height_cm,
    sweatLevel:      runner.sweat_level,
    maxHeartRate:    runner.max_hr    ?? undefined,
    weeklyKm:        runner.weekly_km ?? undefined,
    // Mapear columnas snake_case de DB a camelCase del engine
    nutritionProducts: (nutritionProds ?? []).map(p => ({
      name:        p.name,
      type:        p.type as 'gel' | 'salt_pill',
      carbsGrams:  p.carbs_grams,
      sodiumMg:    p.sodium_mg,
      caffeineMg:  p.caffeine_mg,
    })),
    referenceRaces: refRaces.map(r => ({
      distanceKm:    r.distance_km,
      timeSeconds:   r.time_seconds,
      date:          r.race_date,
      type:          r.race_type,
      avgHeartRate:  r.avg_heart_rate ?? undefined,
    })),
  };

  // 5. Perfil del recorrido (plano con desnivel manual si existe)
  const course = buildFlatProfile(
    race.distance_km,
    race.elevation_gain ?? undefined
  );

  // 6. Clima real vía Open-Meteo (o neutral si no hay ciudad o falla la API)
  const daysUntilRace = Math.ceil(
    (new Date(race.race_date + 'T12:00:00').getTime() - Date.now()) / 86400000
  );
  const weather: AggregatedWeather = race.city
    ? await fetchWeather(race.city, race.race_date, daysUntilRace)
    : {
        // Sin ciudad configurada → clima neutral
        temperature:      12,
        humidity:         50,
        windSpeedKmh:     0,
        windDirectionDeg: 0,
        sourcesCount:     0,
        sourceAgreement:  'low',
        daysUntilRace,
      };

  // 7. Ritmo objetivo (si el usuario lo cargó en la carrera)
  const targetPacePerKm = race.target_time_s
    ? race.target_time_s / race.distance_km
    : undefined;

  // 8. Generar plan
  try {
    const plan = generateRacePlan({
      runner:          runnerProfile,
      course,
      weather,
      targetPacePerKm,
      breakfastHoursAgo: 3,
    });

    // Guardar el clima usado en la carrera (para detectar cambios 24hs antes)
    // No-await: no bloqueamos la respuesta si falla
    supabaseAdmin.from('races').update({
      last_plan_weather: weather,
      last_plan_at:      new Date().toISOString(),
    }).eq('id', raceId).then(() => {});

    return NextResponse.json(plan);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error generando plan';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
