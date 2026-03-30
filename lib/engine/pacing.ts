import { windImpactPerKm } from './wind';
import type { CourseProfile, AggregatedWeather, SplitKm, SplitBreakdown, PacingStrategyConfig } from './types';

/**
 * Fatigue factor: glycogen depletion penalty after ~30km in marathon.
 * Models the exponential slowdown that most runners experience.
 * Scaled by runner level (Haney & Mercer 2011, Trubee 2014):
 *   Elite (<2:45):      max 3%
 *   Sub-elite (<3:15):  max 5%
 *   Competitive (<3:45): max 7%
 *   Recreational (4h+): max 10%
 *
 * basePaceSecondsPerKm is used to estimate runner level.
 */
export function fatigueFactor(km: number, totalDistanceKm: number, basePaceSecondsPerKm?: number): number {
  // Only applies to races > 25km (marathon/ultra territory)
  if (totalDistanceKm <= 25) return 1.0;

  const fatigueOnsetKm = totalDistanceKm * 0.72; // ~30.4km for marathon (Rapoport 2010)
  if (km <= fatigueOnsetKm) return 1.0;

  // Max penalty scaled by runner level (estimated from pace)
  const pace = basePaceSecondsPerKm ?? 300; // default ~5:00/km
  let maxPenalty: number;
  if (pace <= 235)      maxPenalty = 0.03;  // elite <3:55/km → <2:45
  else if (pace <= 275) maxPenalty = 0.05;  // sub-elite <4:35/km → <3:15
  else if (pace <= 320) maxPenalty = 0.07;  // competitive <5:20/km → <3:45
  else                  maxPenalty = 0.10;  // recreational 4h+

  // Progressive fatigue: exponential curve from onset to finish
  const progress = (km - fatigueOnsetKm) / (totalDistanceKm - fatigueOnsetKm);
  return 1 + maxPenalty * Math.pow(progress, 1.5);
}

/**
 * Computes per-km strategy deltas based on pacing strategy.
 *
 * The strategy divides the race into N segments and applies a pace delta
 * that increases/decreases across segments. The deltas are zero-sum so
 * they don't change the total time (normalization handles that).
 *
 * - even: all deltas are 0
 * - negative: first segment is slower (+delta), last is faster (-delta)
 * - positive: first segment is faster (-delta), last is slower (+delta)
 *
 * Terrain always wins: strategy is an intention layer, elevation/wind
 * adjustments stack on top.
 */
export function computeStrategyDeltas(
  totalKm: number,
  strategy?: PacingStrategyConfig
): number[] {
  const km = Math.ceil(totalKm);
  if (!strategy || strategy.type === 'even') {
    return new Array(km).fill(0);
  }

  const { segments, deltaSecondsPerKm, type } = strategy;
  const segCount = Math.max(2, Math.min(segments, km));
  const kmPerSegment = totalKm / segCount;

  // For N segments, deltas go from +(N-1)/2 * delta to -(N-1)/2 * delta
  // This keeps them centered around 0 (zero-sum before normalization)
  const deltas: number[] = [];
  for (let i = 0; i < km; i++) {
    const distanceKm = i + 0.5; // midpoint of this km
    const segIndex = Math.min(Math.floor(distanceKm / kmPerSegment), segCount - 1);

    // Center index: 0 = first segment, segCount-1 = last
    const center = (segCount - 1) / 2;
    const offset = segIndex - center; // ranges from -center to +center

    if (type === 'negative') {
      // negative split: first segments slower (+), last faster (-)
      deltas.push(-offset * deltaSecondsPerKm);
    } else {
      // positive split: first segments faster (-), last slower (+)
      deltas.push(offset * deltaSecondsPerKm);
    }
  }

  return deltas;
}

/**
 * Computes per-km climate factor based on temperature progression during the race.
 * Temperature interpolates linearly from start to end over the race duration.
 * If temperatureEnd is not provided, assumes +1.5°C/hour warming (morning race).
 */
export function computeClimateFactorAtKm(
  kmIndex: number,
  basePaceSecondsPerKm: number,
  totalKm: number,
  weather: AggregatedWeather
): number {
  const totalTimeHours = (basePaceSecondsPerKm * totalKm) / 3600;
  const tempEnd = weather.temperatureEnd ?? weather.temperature + 1.5 * totalTimeHours;

  // Progress through race (0 = start, 1 = finish)
  const progress = (kmIndex + 0.5) / totalKm;

  // Interpolated temperature at this km
  const tempAtKm = weather.temperature + (tempEnd - weather.temperature) * progress;

  const tempPenalty = Math.max(0, (tempAtKm - 12) * 0.004);
  // Humidity scales with temperature excess (multiplicative interaction — Ely et al. WBGT)
  const tempExcess = Math.max(0, tempAtKm - 12);
  const humidityPenalty = Math.max(0, (weather.humidity - 50) * 0.001) * (tempExcess / 10);
  return 1 + tempPenalty + humidityPenalty;
}

/**
 * Generates per-km pacing splits for a race, adjusting for strategy, elevation, climate, and wind.
 *
 * Algorithm:
 * 1. Apply pacing strategy deltas (intention layer).
 * 2. Compute elevation + wind adjustments per segment.
 * 3. Apply per-km climate factor (temperature rises during the race).
 * 4. Normalize all splits so the total time exactly equals totalTimeSeconds.
 *
 * Order: strategy + elevation + wind + climate → normalize. Terrain wins over strategy.
 */
export function generateSplits(
  totalTimeSeconds: number,
  profile: CourseProfile,
  weather: AggregatedWeather,
  strategy?: PacingStrategyConfig
): SplitKm[] {
  const { distanceKm, segments } = profile;
  const basePaceSecondsPerKm = totalTimeSeconds / distanceKm;

  // --- Strategy deltas (intention layer, applied before terrain adjustments) ---
  const strategyDeltas = computeStrategyDeltas(distanceKm, strategy);

  // --- Compute per-km breakdowns (strategy + elevation + wind + per-km climate) ---
  interface RawBreakdown {
    stratDelta: number;
    elevDelta: number;
    windDelta: number;
    climateFactor: number;
    fatigueFact: number;
    shapePace: number;
  }

  const rawBreakdowns: RawBreakdown[] = segments.map(seg => {
    const segLengthM = seg.endDistance - seg.startDistance;

    // Elevation: compute cost of climbing and benefit of descending SEPARATELY
    // This captures the asymmetric effort: 50m up + 50m down ≠ flat
    // +6 s/km per 1% uphill cost, -3 s/km per 1% downhill benefit
    const uphillGradient = segLengthM > 0 ? (seg.elevationGain / segLengthM) * 100 : 0;
    const downhillGradient = segLengthM > 0 ? (seg.elevationLoss / segLengthM) * 100 : 0;
    const elevDelta = (uphillGradient * 6) + (downhillGradient * -3);

    // Wind only applies when we have GPX (for bearing) AND reliable weather (≤3 days out).
    // Beyond 3 days, wind forecasts are too unreliable to adjust pacing.
    const windDelta = (profile.hasGpx && weather.daysUntilRace <= 3)
      ? windImpactPerKm(seg.bearing, weather.windSpeedKmh, weather.windDirectionDeg)
      : 0;
    const stratDelta = strategyDeltas[seg.kmIndex] ?? 0;
    const climateFactor = computeClimateFactorAtKm(
      seg.kmIndex, basePaceSecondsPerKm, distanceKm, weather
    );
    const fatigueFact = fatigueFactor(seg.kmIndex + 1, distanceKm, basePaceSecondsPerKm);
    const shapePace = (basePaceSecondsPerKm + stratDelta + elevDelta + windDelta) * climateFactor * fatigueFact;
    return { stratDelta, elevDelta, windDelta, climateFactor, fatigueFact, shapePace };
  });

  // --- Normalize so total time is preserved ---
  const shapeTotal = segments.reduce((sum, seg) => {
    const segLengthKm = (seg.endDistance - seg.startDistance) / 1000;
    return sum + rawBreakdowns[seg.kmIndex].shapePace * segLengthKm;
  }, 0);

  const scaleFactor = shapeTotal > 0 ? totalTimeSeconds / shapeTotal : 1;

  // --- Build splits with breakdown ---
  const splits: SplitKm[] = [];
  let cumulativeTime = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segLengthKm = (seg.endDistance - seg.startDistance) / 1000;
    const raw = rawBreakdowns[i];

    const adjustedPace = raw.shapePace * scaleFactor;
    const segTime = adjustedPace * segLengthKm;
    cumulativeTime += segTime;

    // Notes
    let elevationNote: string | undefined;
    if (seg.avgGradientPercent >= 2) elevationNote = 'subida';
    else if (seg.avgGradientPercent <= -2) elevationNote = 'bajada';

    let windNote: string | undefined;
    if (weather.windSpeedKmh > 0) {
      if (raw.windDelta > 0.5) windNote = 'viento en contra';
      else if (raw.windDelta < -0.5) windNote = 'viento a favor';
    }

    const breakdown: SplitBreakdown = {
      basePace: basePaceSecondsPerKm,
      strategyDelta: raw.stratDelta,
      elevationDelta: raw.elevDelta,
      windDelta: raw.windDelta,
      climateFactor: raw.climateFactor,
      fatigueFactor: raw.fatigueFact,
      finalPace: adjustedPace,
    };

    splits.push({
      km: i + 1,
      paceSecondsPerKm: adjustedPace,
      cumulativeTimeSeconds: cumulativeTime,
      elevationNote,
      windNote,
      breakdown,
    });
  }

  return splits;
}
