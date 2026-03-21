import { XMLParser } from 'fast-xml-parser';
import type { GpxPoint } from '../engine/types';

export function parseGpx(gpxContent: string): GpxPoint[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(gpxContent);

  // Navigate to track points - handle gpx > trk > trkseg > trkpt
  const trk = parsed.gpx?.trk;
  if (!trk) throw new Error('No track found in GPX file');

  const trkseg = trk.trkseg;
  let trkpts = trkseg?.trkpt;
  if (!trkpts) throw new Error('No track points found');
  if (!Array.isArray(trkpts)) trkpts = [trkpts];

  let cumulativeDistance = 0;
  const points: GpxPoint[] = [];

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt['@_lat']);
    const lon = parseFloat(pt['@_lon']);
    const elevation = parseFloat(pt.ele) || 0;

    if (i > 0) {
      const prev = points[i - 1];
      cumulativeDistance += haversineDistance(prev.lat, prev.lon, lat, lon);
    }

    points.push({ lat, lon, elevation, distanceFromStart: cumulativeDistance });
  }

  return points;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
