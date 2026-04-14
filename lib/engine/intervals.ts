import type { IntervalSession } from './types';

/**
 * Estimates marathon pace ceiling from interval sessions.
 *
 * Uses a simplified Jack Daniels approach:
 * - 1000m intervals approximate VO2max pace (vVO2max)
 * - 2000m intervals approximate threshold pace
 * - Marathon pace is typically 78-82% of vVO2max (i.e. pace × 1.22-1.28)
 * - Threshold pace to marathon: pace × 1.10-1.15
 *
 * Returns the fastest sustainable marathon pace (s/km) — the "ceiling".
 * If intervals suggest the runner can't sustain the predicted pace, this caps it.
 */

// Conversion factors from interval pace to marathon pace ceiling
// Training intervals are hard effort, not all-out — factors reflect that
const INTERVAL_TO_MARATHON: Record<number, number> = {
  400: 1.30,   // 400m ≈ VAM/VO2max → marathon at ~78% VO2max
  1000: 1.12,  // 1000m ≈ threshold effort → marathon ≈ 1.10-1.15x
  2000: 1.10,  // 2000m ≈ threshold effort → marathon ≈ 1.08-1.12x
};

/**
 * Recency weight for interval sessions.
 * Optimized for a 1-month primary window:
 *   0 months: 1.0,  1 month: 0.50,  2 months: 0.25,  3 months: 0.12
 * Intervals >1 month still contribute but with low confidence.
 */
function recencyWeight(date: string): number {
  const now = new Date();
  const d = new Date(date);
  const monthsAgo = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return Math.exp(-monthsAgo * 0.7);
}

/**
 * Normalize an interval pace to neutral conditions.
 * Climate: intervals are short (~3-8min reps), so heat impact is small.
 * We apply ~30% of the full marathon climate penalty.
 * Effort: threshold at 85% HRmax (or 76% HRR with Karvonen if restingHR known).
 */
function normalizePace(
  paceSecondsPerKm: number,
  session: IntervalSession,
  maxHeartRate?: number,
  restingHeartRate?: number
): number {
  let adjusted = paceSecondsPerKm;

  // Climate: intervals are short efforts, heat impact is minimal (~30% of marathon)
  if (session.temperatureC !== undefined) {
    const temp = session.temperatureC;
    const hum = session.humidityPercent ?? 50;
    const tempPenalty = Math.max(0, (temp - 12) * 0.004);
    const tempExcess = Math.max(0, temp - 12);
    const humPenalty = Math.max(0, (hum - 50) * 0.001) * (tempExcess / 10);
    const fullClimateFactor = 1 + tempPenalty + humPenalty;
    const scaledClimateFactor = 1 + (fullClimateFactor - 1) * 0.3;
    adjusted = adjusted / scaledClimateFactor;
  }

  // Effort: training intervals — use Karvonen if restingHR available, else raw %HRmax
  if (session.avgHeartRate && maxHeartRate && maxHeartRate > 0) {
    let effortRatio: number;
    let threshold: number;

    if (restingHeartRate && restingHeartRate > 0 && restingHeartRate < maxHeartRate) {
      const hrReserve = maxHeartRate - restingHeartRate;
      effortRatio = (session.avgHeartRate - restingHeartRate) / hrReserve;
      threshold = 0.76; // ~76% HRR = hard interval effort
    } else {
      effortRatio = session.avgHeartRate / maxHeartRate;
      threshold = 0.85; // fallback: 85% HRmax
    }

    if (effortRatio < threshold) {
      const gap = threshold - effortRatio;
      const adjustment = gap * gap * 8;
      adjusted = adjusted * (1 - Math.min(adjustment, 0.10));
    }
  }

  return adjusted;
}

/**
 * Returns estimated marathon pace (s/km) from interval data.
 * This is a prediction in its own right, not just a ceiling.
 * Returns undefined if no intervals provided.
 */
export function estimateMarathonPaceFromIntervals(
  intervals?: IntervalSession[],
  maxHeartRate?: number,
  restingHeartRate?: number
): number | undefined {
  if (!intervals || intervals.length === 0) return undefined;

  let weightedPace = 0;
  let totalWeight = 0;

  for (const session of intervals) {
    // Find closest known distance factor
    const knownDistances = Object.keys(INTERVAL_TO_MARATHON).map(Number);
    const closest = knownDistances.reduce((prev, curr) =>
      Math.abs(curr - session.distanceM) < Math.abs(prev - session.distanceM) ? curr : prev
    );
    const factor = INTERVAL_TO_MARATHON[closest];

    // Normalize pace to neutral conditions before applying factor
    // Pass restingHeartRate for Karvonen-based effort normalization if available
    const neutralPace = normalizePace(session.paceSecondsPerKm, session, maxHeartRate, restingHeartRate);
    const marathonPace = neutralPace * factor;
    const weight = recencyWeight(session.date) * session.reps;

    weightedPace += marathonPace * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedPace / totalWeight : undefined;
}
