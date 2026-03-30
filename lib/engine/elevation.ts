import type { GpxPoint, ElevationSegment, CourseProfile } from './types';

const FLAT_PROFILE_WARNING =
  'Sin perfil de elevación, los splits son estimados en terreno plano. Subí el GPX para mejor precisión.';

/**
 * Dead-band elevation filter to remove GPS noise.
 * Only registers a change when cumulative drift exceeds the threshold (default 2m).
 * This is the standard approach used by Garmin, Strava, and most GPS platforms.
 */
function smoothElevation(points: GpxPoint[], deadBandM: number = 4): GpxPoint[] {
  if (points.length === 0) return points;

  const smoothed: GpxPoint[] = [{ ...points[0] }];
  let lastAnchorEle = points[0].elevation;

  for (let i = 1; i < points.length; i++) {
    const diff = points[i].elevation - lastAnchorEle;
    if (Math.abs(diff) >= deadBandM) {
      lastAnchorEle = points[i].elevation;
      smoothed.push({ ...points[i] });
    } else {
      // Keep point but with anchored elevation (preserves lat/lon/distance)
      smoothed.push({ ...points[i], elevation: lastAnchorEle });
    }
  }

  return smoothed;
}

/**
 * Builds a CourseProfile from parsed GPX points.
 * Groups points into per-km segments, computing elevation gain/loss, gradient, and bearing.
 */
export function buildElevationProfile(
  points: GpxPoint[],
  distanceKm: number
): CourseProfile {
  if (points.length === 0) {
    return buildFlatProfile(distanceKm);
  }

  // Smooth elevation to remove GPS noise before computing D+/D-
  const smoothedPoints = smoothElevation(points);

  const totalDistanceM = distanceKm * 1000;
  const segments: ElevationSegment[] = [];

  let totalElevationGain = 0;
  let totalElevationLoss = 0;

  for (let km = 0; km < Math.ceil(distanceKm); km++) {
    const startDistanceM = km * 1000;
    const endDistanceM = Math.min((km + 1) * 1000, totalDistanceM);

    // Collect points within this km segment (inclusive boundaries)
    const segmentPoints = smoothedPoints.filter(
      p => p.distanceFromStart >= startDistanceM && p.distanceFromStart <= endDistanceM
    );

    // If no points fall directly in range, interpolate from nearest neighbors
    const effectivePoints = segmentPoints.length >= 2
      ? segmentPoints
      : getInterpolatedBoundaryPoints(smoothedPoints, startDistanceM, endDistanceM);

    let elevationGain = 0;
    let elevationLoss = 0;

    for (let i = 1; i < effectivePoints.length; i++) {
      const diff = effectivePoints[i].elevation - effectivePoints[i - 1].elevation;
      if (diff > 0) elevationGain += diff;
      else elevationLoss += Math.abs(diff);
    }

    const segmentLengthM = endDistanceM - startDistanceM;
    const netElevationChange =
      effectivePoints.length >= 2
        ? effectivePoints[effectivePoints.length - 1].elevation - effectivePoints[0].elevation
        : 0;
    const avgGradientPercent =
      segmentLengthM > 0 ? (netElevationChange / segmentLengthM) * 100 : 0;

    // Bearing from first to last point in segment
    const bearing =
      effectivePoints.length >= 2
        ? computeBearing(
            effectivePoints[0].lat,
            effectivePoints[0].lon,
            effectivePoints[effectivePoints.length - 1].lat,
            effectivePoints[effectivePoints.length - 1].lon
          )
        : 0;

    totalElevationGain += elevationGain;
    totalElevationLoss += elevationLoss;

    segments.push({
      kmIndex: km,
      startDistance: startDistanceM,
      endDistance: endDistanceM,
      elevationGain,
      elevationLoss,
      avgGradientPercent,
      bearing,
    });
  }

  return {
    distanceKm,
    totalElevationGain,
    totalElevationLoss,
    segments,
    hasGpx: true,
  };
}

/**
 * Creates a uniform CourseProfile when no GPX is available.
 * D+ and D- are distributed separately and stored as elevationGain/elevationLoss per segment.
 * avgGradientPercent uses the NET (gain - loss) for pace adjustment direction,
 * but the gross D+ and D- are preserved for fatigue modeling.
 */
export function buildFlatProfile(
  distanceKm: number,
  manualElevationGain?: number,
  manualElevationLoss?: number
): CourseProfile {
  const numSegments = Math.ceil(distanceKm);
  const totalDistanceM = distanceKm * 1000;
  const gain = manualElevationGain ?? 0;
  const loss = manualElevationLoss ?? 0;
  const gainPerSegment = numSegments > 0 ? gain / numSegments : 0;
  const lossPerSegment = numSegments > 0 ? loss / numSegments : 0;

  const segments: ElevationSegment[] = [];

  for (let km = 0; km < numSegments; km++) {
    const startDistanceM = km * 1000;
    const endDistanceM = Math.min((km + 1) * 1000, totalDistanceM);
    const segmentLengthM = endDistanceM - startDistanceM;
    // Net gradient for pace direction (up = slower, down = faster)
    const netElevation = gainPerSegment - lossPerSegment;
    const avgGradientPercent =
      segmentLengthM > 0 ? (netElevation / segmentLengthM) * 100 : 0;

    segments.push({
      kmIndex: km,
      startDistance: startDistanceM,
      endDistance: endDistanceM,
      elevationGain: gainPerSegment,
      elevationLoss: lossPerSegment,
      avgGradientPercent,
      bearing: 0,
    });
  }

  return {
    distanceKm,
    totalElevationGain: gain,
    totalElevationLoss: loss,
    segments,
    hasGpx: false,
    manualElevationGain: gain,
    warningMessage: FLAT_PROFILE_WARNING,
  };
}

// --- Helpers ---

/**
 * Returns two interpolated boundary points for a km segment when insufficient
 * GPS points fall directly within the range.
 */
function getInterpolatedBoundaryPoints(
  points: GpxPoint[],
  startDistanceM: number,
  endDistanceM: number
): GpxPoint[] {
  const startPt = interpolateAtDistance(points, startDistanceM);
  const endPt = interpolateAtDistance(points, endDistanceM);
  if (!startPt || !endPt) return [];
  return [startPt, endPt];
}

function interpolateAtDistance(
  points: GpxPoint[],
  targetDistanceM: number
): GpxPoint | null {
  if (points.length === 0) return null;

  // Clamp to first/last point
  if (targetDistanceM <= points[0].distanceFromStart) return points[0];
  if (targetDistanceM >= points[points.length - 1].distanceFromStart) {
    return points[points.length - 1];
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (
      targetDistanceM >= prev.distanceFromStart &&
      targetDistanceM <= curr.distanceFromStart
    ) {
      const span = curr.distanceFromStart - prev.distanceFromStart;
      const t = span > 0 ? (targetDistanceM - prev.distanceFromStart) / span : 0;
      return {
        lat: prev.lat + t * (curr.lat - prev.lat),
        lon: prev.lon + t * (curr.lon - prev.lon),
        elevation: prev.elevation + t * (curr.elevation - prev.elevation),
        distanceFromStart: targetDistanceM,
      };
    }
  }

  return points[points.length - 1];
}

function computeBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}
