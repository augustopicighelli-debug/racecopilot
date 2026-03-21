import type { ReferenceRace } from './types';

const DEFAULT_EXPONENT = 1.06;

function recencyWeight(raceDate: string, referenceDate?: string): number {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const race = new Date(raceDate);
  const monthsAgo = (ref.getTime() - race.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return Math.exp(-monthsAgo * 0.1);
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
  if (races.length < 2) return DEFAULT_EXPONENT;

  const collapsed = collapseByDistance(races);

  if (collapsed.length < 2) return DEFAULT_EXPONENT;

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

  if (totalWeight === 0) return DEFAULT_EXPONENT;
  return weightedSum / totalWeight;
}

function volumeAdjustment(weeklyKm?: number): number {
  if (!weeklyKm || weeklyKm < 30) return 1.0;
  const factor = 1 - 0.02 * Math.log2(weeklyKm / 30);
  return Math.max(factor, 0.92);
}

export function predictTime(
  races: ReferenceRace[],
  targetDistanceKm: number,
  options?: { weeklyKm?: number }
): number {
  const exponent = fitExponent(races);

  let weightedPrediction = 0;
  let totalWeight = 0;

  for (const race of races) {
    const predicted =
      race.timeSeconds * Math.pow(targetDistanceKm / race.distanceKm, exponent);
    const weight = recencyWeight(race.date);
    weightedPrediction += predicted * weight;
    totalWeight += weight;
  }

  const basePrediction = weightedPrediction / totalWeight;
  return basePrediction * volumeAdjustment(options?.weeklyKm);
}
