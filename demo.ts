import { readFileSync } from 'fs';
import { generateRacePlan, buildFlatProfile, buildElevationProfile, parseGpx } from './lib/engine';
import type { RunnerProfile, AggregatedWeather, PacingStrategyConfig } from './lib/engine';

// --- Perfil de Augusto ---
const runner: RunnerProfile = {
  weightKg: 84,
  heightCm: 183,
  sweatLevel: 'high',
  maxHeartRate: 187,
  referenceRaces: [
    {
      distanceKm: 10.04, timeSeconds: 45 * 60 + 20, date: '2026-03-01', type: 'race',
      avgHeartRate: 170, temperatureC: 22, humidityPercent: 70, // 10K 1/3 largada 7:30am
    },
  ],
  weeklyKm: 50.13,
  vam: 247, // VAM 4:07/km
  intervals: [
    { distanceM: 2000, reps: 2, paceSecondsPerKm: 4 * 60 + 27, date: '2026-03-17',
      avgHeartRate: 175, temperatureC: 21, humidityPercent: 74 }, // 2x2000m 17/3 19:54hs
    { distanceM: 1000, reps: 6, paceSecondsPerKm: 4 * 60 + 24, date: '2026-02-20',
      avgHeartRate: 176, temperatureC: 24, humidityPercent: 80 }, // 6x1000m 20/2 18:49hs
  ],
  nutritionProducts: [
    { name: 'Energy Race Maervyck', carbsGrams: 27, sodiumMg: 111, caffeineMg: 0, type: 'gel' },
    { name: 'Nutremax Pro Salts', carbsGrams: 0, sodiumMg: 215, caffeineMg: 0, type: 'salt_pill' },
  ],
};

// --- Carrera: Maratón de Mendoza, 3 de mayo 2026 ---
// GPX real del recorrido (Luján de Cuyo)
const gpxContent = readFileSync('./data/mendoza-maraton.gpx', 'utf-8');
const gpxPoints = parseGpx(gpxContent);
const course = buildElevationProfile(gpxPoints, 42.195);

// --- Clima: Mendoza 3 de mayo, largada 8am ---
// 8am ~ 8°C, 11:30am ~ 18°C (estimado, faltan ~43 días)
const weather: AggregatedWeather = {
  temperature: 8,          // temp a la hora de largada (8am)
  temperatureEnd: 18,      // temp estimada al terminar (~11:30am)
  humidity: 45,
  windSpeedKmh: 10,
  windDirectionDeg: 180,
  sourcesCount: 1,
  sourceAgreement: 'low',
  daysUntilRace: 43,
};

// --- Estrategia: negative split en 3 tercios, 5s/km de delta ---
const strategy: PacingStrategyConfig = {
  type: 'negative',
  segments: 3,
  deltaSecondsPerKm: 5,
};

// --- Generar plan con target de 3:30 (4:58.5/km) ---
const targetPace = (3 * 3600 + 30 * 60) / 42.195; // ~298.6 s/km
const plan = generateRacePlan({
  runner,
  course,
  weather,
  targetPacePerKm: targetPace,
  breakfastHoursAgo: 3,
  pacingStrategy: strategy,
});

// --- Mostrar resultados ---
const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  // Handle :60 rollover
  if (sec === 60) return `${h}:${String(m + 1).padStart(2,'0')}:00`;
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};
const fmtPace = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (sec === 60) return `${m + 1}:00/km`;
  return `${m}:${String(sec).padStart(2,'0')}/km`;
};

console.log('=== RACECOPILOT — Maratón de Mendoza 2026 ===\n');
console.log(`Distancia: ${course.distanceKm} km | D+: ${Math.round(course.totalElevationGain)}m | D-: ${Math.round(course.totalElevationLoss)}m | GPX: ${course.hasGpx ? 'sí' : 'no'}`);
console.log(`Clima: ${weather.temperature}°C, ${weather.humidity}% hum, viento ${weather.windSpeedKmh}km/h (estimado, faltan ${weather.daysUntilRace} días)`);
console.log(`Confianza: ${plan.forecast.confidence}%\n`);

// --- Waterfall ---
const wf = plan.forecast.waterfall;
if (wf) {
  console.log('--- WATERFALL (Pronóstico) ---');
  const fmtDelta = (s: number) => `${s >= 0 ? '+' : '-'}${Math.floor(Math.abs(s)/60)}:${String(Math.round(Math.abs(s)%60)).padStart(2,'0')}`;
  if (wf.riegelTimeSeconds) console.log(`  Riegel (carreras):           ${fmt(wf.riegelTimeSeconds)}`);
  if (wf.intervalTimeSeconds) console.log(`  Intervalos (pasadas):        ${fmt(wf.intervalTimeSeconds)}`);
  console.log(`  Blend base:                  ${fmt(wf.baseTimeSeconds)}`);
  console.log(`  Clima (${weather.temperature}→${weather.temperatureEnd ?? '?'}°C):             ${fmtDelta(wf.climateAdjustment)}`);
  console.log(`  Elevación (${Math.round(course.totalElevationGain)}↑ ${Math.round(course.totalElevationLoss)}↓):      ${fmtDelta(wf.elevationAdjustment)}`);
  console.log(`  Viento (${weather.windSpeedKmh}km/h):                 ${fmtDelta(wf.windAdjustment)}`);
  console.log(`  = Pronóstico final:          ${fmt(wf.finalTimeSeconds)}\n`);
}

console.log('--- OBJETIVOS ---');
console.log(`Pronóstico: ${fmt(plan.forecast.prediction.timeSeconds)} (${fmtPace(plan.forecast.prediction.paceSecondsPerKm)})`);
if (plan.target) console.log(`Target:     ${fmt(plan.target.prediction.timeSeconds)} (${fmtPace(plan.target.prediction.paceSecondsPerKm)})`);
if (plan.consensus) console.log(`Consenso:   ${fmt(plan.consensus.prediction.timeSeconds)} (${fmtPace(plan.consensus.prediction.paceSecondsPerKm)}) — ${plan.consensus.prediction.label}`);

console.log('\n--- SPLITS (Consenso) ---');
const splits = plan.consensus?.splits ?? plan.forecast.splits;
splits.forEach(s => {
  const notes = [s.elevationNote, s.windNote].filter(Boolean).join(', ');
  console.log(`  Km ${String(s.km).padStart(2)}: ${fmtPace(s.paceSecondsPerKm)}  (${fmt(s.cumulativeTimeSeconds)})${notes ? ` [${notes}]` : ''}`);
});

console.log('\n--- HIDRATACIÓN ---');
const hyd = plan.consensus?.hydration ?? plan.forecast.hydration;
console.log(`Tasa sudoración: ${hyd.sweatRateMlPerHour} ml/h | Pérdida total: ${hyd.totalFluidLosseMl} ml`);
hyd.events.forEach(e => console.log(`  Km ${e.km}: ${e.mlToDrink}ml (acumulado: ${e.cumulativeMl}ml)`));

console.log('\n--- NUTRICIÓN ---');
const nut = plan.consensus?.nutrition ?? plan.forecast.nutrition;
if (nut.preRaceGel) console.log(`  PRE-CARRERA: ${nut.preRaceGel.product.name} (${nut.preRaceGel.carbsGrams}g carbos)`);
nut.events.forEach(e => console.log(`  Km ${e.km} (~${e.minutesSinceStart}min): ${e.product.name} — ${e.carbsGrams}g carbos, ${e.sodiumMg}mg sodio`));
console.log(`\n  ⚕️ ${nut.disclaimer}`);
