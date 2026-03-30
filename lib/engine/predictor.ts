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
 * Collapse races at similar distances into a single weighted representative,
 * so that recency weighting of same-distance races feeds into exponent fitting.
 */
function collapseByDistance(races: ReferenceRace[]): WeightedRace[] {
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
      const w = recencyWeight(r.date);
      weightedTime += r.timeSeconds * w;
      totalWeight += w;
    }
    return {
      distanceKm: group[0].distanceKm,
      timeSeconds: weightedTime / totalWeight,
      weight: totalWeight,
    };
  });
}

export function fitExponent(races: ReferenceRace[]): number {
  if (races.length < 2) return defaultExponent(races);

  const collapsed = collapseByDistance(races);

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
 *    For races (type='race'), 88-93% HRmax is normal race effort for non-elite
 *    runners — only adjust below 88%. For training, threshold is 85%.
 *    Uses a quadratic curve (gentle) instead of linear.
 */
function normalizeRaceTime(
  timeSeconds: number,
  race: ReferenceRace,
  maxHeartRate?: number
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
    const effortRatio = race.avgHeartRate / maxHeartRate;
    // Race: 88-93% HRmax is normal race effort for competitive runners
    // Training: 85%+ is expected hard effort
    const threshold = race.type === 'race' ? 0.88 : 0.85;

    if (effortRatio < threshold) {
      // Quadratic curve: gentle near threshold, stronger further below
      const gap = threshold - effortRatio;
      const adjustment = gap * gap * 8; // at 83% race: gap=0.05, adj=2%
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
  options?: { weeklyKm?: number; maxHeartRate?: number }
): number {
  const exponent = fitExponent(races);

  let weightedPrediction = 0;
  let totalWeight = 0;

  for (const race of races) {
    // Normalize to neutral conditions before extrapolating
    const neutralTime = normalizeRaceTime(race.timeSeconds, race, options?.maxHeartRate);
    const predicted =
      neutralTime * Math.pow(targetDistanceKm / race.distanceKm, exponent);
    const weight = recencyWeight(race.date);
    weightedPrediction += predicted * weight;
    totalWeight += weight;
  }

  const basePrediction = weightedPrediction / totalWeight;
  return basePrediction * volumeAdjustment(options?.weeklyKm);
}
