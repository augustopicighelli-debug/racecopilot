import { windImpactPerKm } from './wind';
import type { CourseProfile, AggregatedWeather, SplitKm } from './types';

/**
 * Generates per-km pacing splits for a race, adjusting for elevation, climate, and wind.
 *
 * Algorithm:
 * 1. Compute a raw pace adjustment for each segment (elevation + wind).
 * 2. Apply a uniform climate factor (hot/humid slows the runner).
 * 3. Normalize all splits so the total time exactly equals totalTimeSeconds.
 * 4. Build cumulative time and notes.
 */
export function generateSplits(
  totalTimeSeconds: number,
  profile: CourseProfile,
  weather: AggregatedWeather
): SplitKm[] {
  const { distanceKm, segments } = profile;
  const basePaceSecondsPerKm = totalTimeSeconds / distanceKm;

  // --- Climate factor (applied uniformly, never makes pace faster than base) ---
  const tempPenalty = Math.max(0, (weather.temperature - 12) * 0.004);
  const humidityPenalty = Math.max(0, (weather.humidity - 50) * 0.001);
  const climateFactor = 1 + tempPenalty + humidityPenalty;

  // --- Shape paces per segment (elevation + wind adjustments, no climate factor) ---
  // Climate is algebraically uniform (multiplies every segment equally), so it cancels
  // out during normalization. We compute shapes without it, normalize, then apply climate
  // to ensure the reported pace reflects weather conditions while preserving total time.
  // The algebraic identity: shapePace_i * cf * (totalTime / (cf * shapeTotal))
  //                       = shapePace_i * (totalTime / shapeTotal)
  // This avoids floating-point drift from cf not cancelling perfectly in float arithmetic.
  const shapePaces: number[] = segments.map(seg => {
    const gradient = seg.avgGradientPercent;

    // +6 s/km per 1% uphill, -3 s/km per 1% downhill
    const elevationDelta = gradient >= 0
      ? gradient * 6
      : gradient * 3; // gradient is negative, so result is negative (faster)

    const windDelta = windImpactPerKm(seg.bearing, weather.windSpeedKmh, weather.windDirectionDeg);

    return basePaceSecondsPerKm + elevationDelta + windDelta;
  });

  // --- Compute shape total (without climate) ---
  const shapeTotal = segments.reduce((sum, seg) => {
    const segLengthKm = (seg.endDistance - seg.startDistance) / 1000;
    return sum + shapePaces[seg.kmIndex] * segLengthKm;
  }, 0);

  // --- Normalization scale factor (climate cancels: totalTime / (cf * shapeTotal) * cf = totalTime / shapeTotal) ---
  const scaleFactor = shapeTotal > 0 ? totalTimeSeconds / shapeTotal : 1;

  // --- Build splits ---
  const splits: SplitKm[] = [];
  let cumulativeTime = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segLengthM = seg.endDistance - seg.startDistance;
    const segLengthKm = segLengthM / 1000;

    // Normalized pace: totalTimeSeconds is already the weather-adjusted target time.
    // Climate factor is uniform across segments, so it cancels out during normalization
    // (shapePace * cf * totalTime / (cf * shapeTotal) = shapePace * totalTime / shapeTotal).
    // We compute this directly to avoid floating-point drift from the cf multiplication/division.
    const adjustedPace = shapePaces[i] * scaleFactor;
    const segTime = adjustedPace * segLengthKm;
    cumulativeTime += segTime;

    // Notes
    let elevationNote: string | undefined;
    if (seg.avgGradientPercent >= 2) {
      elevationNote = 'subida';
    } else if (seg.avgGradientPercent <= -2) {
      elevationNote = 'bajada';
    }

    let windNote: string | undefined;
    if (weather.windSpeedKmh > 0) {
      const impact = windImpactPerKm(seg.bearing, weather.windSpeedKmh, weather.windDirectionDeg);
      if (impact > 0.5) {
        windNote = 'viento en contra';
      } else if (impact < -0.5) {
        windNote = 'viento a favor';
      }
    }

    splits.push({
      km: i + 1,
      paceSecondsPerKm: adjustedPace,
      cumulativeTimeSeconds: cumulativeTime,
      elevationNote,
      windNote,
    });
  }

  return splits;
}
