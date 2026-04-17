import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRacePlan } from '@/lib/engine/plan';
import fs from 'fs';
import path from 'path';

// Cliente admin para guardar el clima sin depender del JWT del usuario
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { buildFlatProfile, buildElevationProfile } from '@/lib/engine/elevation';
import { parseGpx } from '@/lib/gpx/parser';
import { fetchWeather } from '@/lib/weather/open-meteo';
import type { RunnerProfile, AggregatedWeather, PacingStrategyConfig } from '@/lib/engine/types';

/**
 * Convierte el objetivo del corredor en una PacingStrategyConfig.
 * - finish: arranca muy conservador (negative split 20s/km), evita explotar en los km finales
 * - pr:     split negativo leve (8s/km), estrategia óptima para rendimiento
 * - target: split parejo al tiempo objetivo (sin modificar — el engine lo maneja)
 */
function goalToPacingStrategy(goalType: string): PacingStrategyConfig | undefined {
  if (goalType === 'finish') {
    return { type: 'negative', segments: 2, deltaSecondsPerKm: 20 };
  }
  if (goalType === 'pr') {
    return { type: 'negative', segments: 2, deltaSecondsPerKm: 8 };
  }
  // 'target' → even split implícito, sin override
  return undefined;
}

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
    .select('id,distance_km,race_date,target_time_s,elevation_gain,elevation_loss,runner_id,city,goal_type,gpx_slug')
    .eq('id', raceId)
    .maybeSingle();

  if (raceErr || !race) {
    return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 });
  }

  // 2. Cargar perfil del corredor
  const { data: runner } = await supabase
    .from('runners')
    .select('id,weight_kg,height_cm,sweat_level,max_hr,resting_hr,weekly_km,is_premium')
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
    weightKg:           runner.weight_kg,
    heightCm:           runner.height_cm,
    sweatLevel:         runner.sweat_level,
    maxHeartRate:       runner.max_hr      ?? undefined,
    restingHeartRate:   runner.resting_hr  ?? undefined,  // para fórmula de Karvonen
    weeklyKm:           runner.weekly_km   ?? undefined,
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

  // 5. Perfil del recorrido — real desde GPX si existe, plano como fallback
  let course;
  if (race.gpx_slug) {
    try {
      const gpxPath = path.join(process.cwd(), 'public', 'gpx', `${race.gpx_slug}.gpx`);
      const xml = fs.readFileSync(gpxPath, 'utf-8');
      const points = parseGpx(xml);
      course = buildElevationProfile(points, race.distance_km);
    } catch {
      // Si el archivo no existe o falla el parseo, usar perfil plano
      course = buildFlatProfile(race.distance_km, race.elevation_gain ?? undefined, race.elevation_loss ?? undefined);
    }
  } else {
    course = buildFlatProfile(race.distance_km, race.elevation_gain ?? undefined, race.elevation_loss ?? undefined);
  }

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

  // 8. Estrategia de pacing según objetivo del corredor
  const pacingStrategy = goalToPacingStrategy(race.goal_type ?? 'pr');

  // 9. Generar plan
  try {
    const plan = generateRacePlan({
      runner:          runnerProfile,
      course,
      weather,
      targetPacePerKm,
      pacingStrategy,
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
