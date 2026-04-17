import type { ReferenceRace } from './types';

/**
 * Default Riegel exponent scaled by runner ability (Vickers & Vertosick 2016):
 *   Elite:        1.06
 *   Sub-elite:    1.08
 *   Competitive:  1.10
 *   Recreational: 1.12
 *
 * Estimated from their best reference race pace.
 */
function defaultExponent(races: ReferenceRace[]): number {
  if (races.length === 0) return 1.10; // conservative default

  // Use fastest pace as proxy for runner level
  const bestPace = Math.min(...races.map(r => r.timeSeconds / r.distanceKm));
  if (bestPace <= 210)      return 1.06;  // <3:30/km → elite
  else if (bestPace <= 260) return 1.08;  // <4:20/km → sub-elite
  else if (bestPace <= 320) return 1.10;  // <5:20/km → competitive
  else                      return 1.12;  // recreational
}

/**
 * Recency weight for reference races.
 * Optimized for a 3-month primary window:
 *   0 months: 1.0,  1 month: 0.80,  3 months: 0.50,
 *   6 months: 0.25, 12 months: 0.06
 * Races >3 months still contribute but with rapidly diminishing confidence.
 */
function recencyWeight(raceDate: string, referenceDate?: string): number {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const race = new Date(raceDate);
  const monthsAgo = (ref.getTime() - race.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return Math.exp(-monthsAgo * 0.23);
}

interface WeightedRace {
  distanceKm: number;
  timeSeconds: number;
  weight: number;
}

/**
 * Effort-based weight multiplier. Penalises submaximal races so they don't
 * distort the Riegel exponent or the final prediction.
 *
 * Uses Karvonen HR Reserve when restingHR is available (more accurate).
 * At threshold (full effort): weight = 1.0
 * 7 pp below threshold: ~0.57; 10 pp below: ~0.45; floor: 0.1
 */
function calcEffortWeight(
  race: ReferenceRace,
  maxHR?: number,
  restingHR?: number
): number {
  if (!race.avgHeartRate || !maxHR) return 1.0;

  let effortRatio: number;
  let threshold: number;

  if (restingHR && restingHR > 0 && restingHR < maxHR) {
    // Karvonen HR Reserve
    const hrReserve = maxHR - restingHR;
    effortRatio = (race.avgHeartRate - restingHR) / hrReserve;
    threshold = race.type === 'race' ? 0.85 : 0.76;
  } else {
    // Fallback: raw %HRmax
    effortRatio = race.avgHeartRate / maxHR;
    threshold = race.type === 'race' ? 0.88 : 0.85;
  }

  if (effortRatio >= threshold) return 1.0;
  const gap = threshold - effortRatio;
  return Math.max(0.1, Math.exp(-8 * gap));
}

/**
 * Collapse races at similar distances into a single weighted representative.
 * Uses normalized times (climate+effort adjusted) so the exponent fitting
 * is not distorted by submaximal or hot-weather runs.
 */
function collapseByDistance(
  races: ReferenceRace[],
  maxHR?: number,
  restingHR?: number
): WeightedRace[] {
  const groups: ReferenceRace[][] = [];

  for (const race of races) {
    const existing = groups.find(g =>
      Math.abs(g[0].distanceKm - race.distanceKm) < 0.5
    );
    if (existing) {
      existing.push(race);
    } else {
      groups.push([race]);
    }
  }

  return groups.map(group => {
    let weightedTime = 0;
    let totalWeight = 0;
    for (const r of group) {
      // Combined weight: recency × effort quality
      const w = recencyWeight(r.date) * calcEffortWeight(r, maxHR, restingHR);
      // Use effort+climate normalized time so the exponent is fitted on
      // equivalent "full-effort, neutral-conditions" times
      const normTime = normalizeRaceTime(r.timeSeconds, r, maxHR, restingHR);
      weightedTime += normTime * w;
      totalWeight += w;
    }
    return {
      distanceKm: group[0].distanceKm,
      timeSeconds: weightedTime / totalWeight,
      weight: totalWeight,
    };
  });
}

export function fitExponent(
  races: ReferenceRace[],
  options?: { maxHeartRate?: number; restingHeartRate?: number }
): number {
  if (races.length < 2) return defaultExponent(races);

  // Solo usar carreras de tipo 'race' con esfuerzo suficiente para exponent fitting.
  // Los trainings y las carreras submáximas distorsionan el modelo de Riegel
  // porque su pace es por diseño más lento que el esfuerzo máximo.
  const highEffortRaces = options?.maxHeartRate
    ? races.filter(r => {
        if (r.type !== 'race') return false; // no usar trainings/pasadas
        if (!r.avgHeartRate) return true;    // sin HR → incluir
        const maxHR = options.maxHeartRate!;
        const restHR = options.restingHeartRate;
        const ratio = restHR && restHR < maxHR
          ? (r.avgHeartRate - restHR) / (maxHR - restHR)
          : r.avgHeartRate / maxHR;
        return ratio >= 0.85; // race threshold: 10km all-out típico ≥85% HRR
      })
    : races.filter(r => r.type === 'race');

  // Si no hay ≥2 carreras de alta intensidad → defaultExponent (no intentar ajustar
  // con carreras submáximas — distorsionaría el modelo de Riegel)
  if (highEffortRaces.length < 2) return defaultExponent(races);

  const collapsed = collapseByDistance(
    highEffortRaces,
    options?.maxHeartRate,
    options?.restingHeartRate
  );

  if (collapsed.length < 2) return defaultExponent(races);

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < collapsed.length; i++) {
    for (let j = i + 1; j < collapsed.length; j++) {
      const r1 = collapsed[i];
      const r2 = collapsed[j];

      const exp =
        Math.log(r2.timeSeconds / r1.timeSeconds) /
        Math.log(r2.distanceKm / r1.distanceKm);
      if (exp < 1.0 || exp > 1.2) continue;

      const weight = r1.weight * r2.weight;
      weightedSum += exp * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return defaultExponent(races);
  return weightedSum / totalWeight;
}

/**
 * Normalize a race time to neutral conditions (12°C, 50% hum, max effort).
 *
 * 1. Climate: Ely et al. 2007 penalty scales with race duration — a 45min 10K
 *    is much less affected by heat than a 3.5h marathon. We apply a duration
 *    scaling factor: full penalty at 3h+, 50% at 1.5h, ~25% at 45min.
 *
 * 2. Effort (HR): only adjusts for CLEARLY submaximal effort.
 *    If restingHeartRate is available, uses Karvonen HR Reserve formula
 *    (effort% relative to HR reserve), which is more accurate than raw %HRmax.
 *    Karvonen thresholds: race ~80% HRR, training ~76% HRR
 *    (equivalent to 88% / 85% HRmax for a typical runner with resting HR ~60).
 *    Without restingHR, falls back to raw %HRmax (88% / 85%).
 */
function normalizeRaceTime(
  timeSeconds: number,
  race: ReferenceRace,
  maxHeartRate?: number,
  restingHeartRate?: number
): number {
  let adjusted = timeSeconds;

  // --- Climate normalization, scaled by race duration ---
  if (race.temperatureC !== undefined) {
    const temp = race.temperatureC;
    const hum = race.humidityPercent ?? 50;
    const tempPenalty = Math.max(0, (temp - 12) * 0.004);
    const tempExcess = Math.max(0, temp - 12);
    const humPenalty = Math.max(0, (hum - 50) * 0.001) * (tempExcess / 10);
    const fullClimateFactor = 1 + tempPenalty + humPenalty;

    // Duration scaling: heat impact grows with time exposed
    // At 45min (~0.75h): ~25% of marathon penalty. At 1.5h: ~60%. At 3h+: 100%.
    const raceHours = timeSeconds / 3600;
    const durationScale = Math.min(1, raceHours / 3);
    const scaledClimateFactor = 1 + (fullClimateFactor - 1) * durationScale;

    adjusted = adjusted / scaledClimateFactor;
  }

  // --- Effort normalization: only for clearly submaximal HR ---
  if (race.avgHeartRate && maxHeartRate && maxHeartRate > 0) {
    let effortRatio: number;
    let threshold: number;

    if (restingHeartRate && restingHeartRate > 0 && restingHeartRate < maxHeartRate) {
      // Karvonen HR Reserve: more accurate because it accounts for the non-zero floor
      // effortRatio = (avgHR - restingHR) / (maxHR - restingHR)
      const hrReserve = maxHeartRate - restingHeartRate;
      effortRatio = (race.avgHeartRate - restingHeartRate) / hrReserve;
      // ~80% HRR = "full effort" race (≈88% HRmax at resting=60, max=170)
      // ~76% HRR = "full effort" training
      threshold = race.type === 'race' ? 0.85 : 0.76;
    } else {
      // Fallback: raw %HRmax
      effortRatio = race.avgHeartRate / maxHeartRate;
      threshold = race.type === 'race' ? 0.88 : 0.85;
    }

    if (effortRatio < threshold) {
      // Quadratic curve: gentle near threshold, stronger further below
      const gap = threshold - effortRatio;
      const adjustment = gap * gap * 8;
      adjusted = adjusted * (1 - Math.min(adjustment, 0.10)); // cap at 10%
    }
  }

  return adjusted;
}

function volumeAdjustment(weeklyKm?: number): number {
  if (!weeklyKm || weeklyKm < 30) return 1.0;
  const factor = 1 - 0.02 * Math.log2(weeklyKm / 30);
  return Math.max(factor, 0.92);
}

export function predictTime(
  races: ReferenceRace[],
  targetDistanceKm: number,
  options?: { weeklyKm?: number; maxHeartRate?: number; restingHeartRate?: number }
): number {
  // Pass HR options so fitExponent normalises times before fitting
  const exponent = fitExponent(races, {
    maxHeartRate: options?.maxHeartRate,
    restingHeartRate: options?.restingHeartRate,
  });

  let weightedPrediction = 0;
  let totalWeight = 0;

  for (const race of races) {
    // Normalize to neutral conditions + full effort before extrapolating
    const neutralTime = normalizeRaceTime(
      race.timeSeconds,
      race,
      options?.maxHeartRate,
      options?.restingHeartRate
    );
    const predicted =
      neutralTime * Math.pow(targetDistanceKm / race.distanceKm, exponent);

    // Combined weight: recency × effort quality
    // Submaximal training runs get much less influence on the final prediction
    const weight =
      recencyWeight(race.date) *
      calcEffortWeight(race, options?.maxHeartRate, options?.restingHeartRate);

    weightedPrediction += predicted * weight;
    totalWeight += weight;
  }

  const basePrediction = weightedPrediction / totalWeight;
  return basePrediction * volumeAdjustment(options?.weeklyKm);
}
