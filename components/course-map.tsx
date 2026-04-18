'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPaceShort } from '@/lib/format';
import type { GpxPoint, SplitKm } from '@/lib/engine/types';

interface CourseMapProps {
  points: GpxPoint[];
  distanceKm: number;
  splits: SplitKm[];
  avgPace: number;
}

function project(lat: number, lon: number, b: Bounds) {
  const x = (lon - b.minLon) / (b.maxLon - b.minLon);
  const y = 1 - (lat - b.minLat) / (b.maxLat - b.minLat);
  return { x, y };
}

interface Bounds {
  minLat: number; maxLat: number; minLon: number; maxLon: number;
}

/** Color from pace delta: green (fast) → gray (avg) → red (slow) */
function paceToColor(pace: number, avgPace: number): string {
  const diff = pace - avgPace;
  if (diff < -5) return 'oklch(0.75 0.17 160)';       // very fast - bright green
  if (diff < -2) return 'oklch(0.65 0.12 160 / 0.8)'; // fast - green
  if (diff > 5) return 'oklch(0.65 0.2 27)';           // very slow - bright red
  if (diff > 2) return 'oklch(0.6 0.15 27 / 0.8)';    // slow - red
  return 'oklch(0.6 0 0 / 0.6)';                       // average - gray
}

export function CourseMap({ points, distanceKm, splits, avgPace }: CourseMapProps) {
  const [view, setView] = useState<'plano' | 'isometrica'>('plano');

  const data = useMemo(() => {
    if (points.length === 0) return null;

    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const latPad = (maxLat - minLat) * 0.05 || 0.001;
    const lonPad = (maxLon - minLon) * 0.05 || 0.001;
    const b: Bounds = {
      minLat: minLat - latPad, maxLat: maxLat + latPad,
      minLon: minLon - lonPad, maxLon: maxLon + lonPad,
    };

    const midLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos(midLat * Math.PI / 180);
    const latRange = b.maxLat - b.minLat;
    const lonRange = (b.maxLon - b.minLon) * cosLat;
    const svgW = 500;
    const svgH = svgW * (latRange / lonRange);

    // Project all points
    const projected = points.map(p => {
      const { x, y } = project(p.lat, p.lon, b);
      return { x: x * svgW, y: y * svgH, dist: p.distanceFromStart, elev: p.elevation };
    });

    // Build pace-colored km segments.
    // Extendemos cada segmento 1 punto en cada extremo para evitar gaps
    // entre segmentos cuando ningún punto GPX cae exactamente en el límite del km.
    const kmSegments: { path: string; color: string; km: number }[] = [];
    for (const split of splits) {
      const kmStart = (split.km - 1) * 1000;
      const kmEnd = split.km * 1000;
      const indices = projected.reduce<number[]>((acc, p, i) => {
        if (p.dist >= kmStart && p.dist <= kmEnd) acc.push(i);
        return acc;
      }, []);
      if (indices.length < 1) continue;
      // Extender 1 punto en cada extremo para conectar con el segmento vecino
      const first = Math.max(0, indices[0] - 1);
      const last = Math.min(projected.length - 1, indices[indices.length - 1] + 1);
      const segPoints = projected.slice(first, last + 1);
      if (segPoints.length < 2) continue;

      let d = `M ${segPoints[0].x.toFixed(1)} ${segPoints[0].y.toFixed(1)}`;
      for (let i = 1; i < segPoints.length; i++) {
        d += ` L ${segPoints[i].x.toFixed(1)} ${segPoints[i].y.toFixed(1)}`;
      }
      kmSegments.push({
        path: d,
        color: paceToColor(split.paceSecondsPerKm, avgPace),
        km: split.km,
      });
    }

    // Km markers every 5km
    const markers: { km: number; x: number; y: number }[] = [];
    for (let km = 5; km <= distanceKm; km += 5) {
      const targetDist = km * 1000;
      let closest = projected[0];
      let closestDiff = Infinity;
      for (const p of projected) {
        const diff = Math.abs(p.dist - targetDist);
        if (diff < closestDiff) { closestDiff = diff; closest = p; }
      }
      markers.push({ km, x: closest.x, y: closest.y });
    }

    // Start/end
    const sp = projected[0];
    const ep = projected[projected.length - 1];

    // Isometric data
    const elevs = points.map(p => p.elevation);
    const minElev = Math.min(...elevs);
    const maxElev = Math.max(...elevs);
    const elevRange = maxElev - minElev || 1;

    // Isometric projection: tilt the flat map, add elevation as vertical offset
    const isoW = 500;
    const isoH = 350;
    const tiltX = 0.9;   // horizontal compression
    const tiltY = 0.45;  // vertical compression (perspective)
    const elevScale = isoH * 0.3; // how much elevation affects Y

    const isoProjected = projected.map((p, i) => {
      const normElev = (points[i].elevation - minElev) / elevRange;
      const ix = p.x * tiltX + p.y * 0.15;
      const iy = p.y * tiltY - normElev * elevScale + elevScale + 30;
      return { x: ix, y: iy, dist: p.dist, elev: points[i].elevation };
    });

    // Iso km segments — mismo fix: extender 1 punto en cada extremo
    const isoKmSegments: { path: string; color: string; km: number }[] = [];
    for (const split of splits) {
      const kmStart = (split.km - 1) * 1000;
      const kmEnd = split.km * 1000;
      const isoIndices = projected.reduce<number[]>((acc, p, i) => {
        if (p.dist >= kmStart && p.dist <= kmEnd) acc.push(i);
        return acc;
      }, []);
      if (isoIndices.length < 1) continue;
      const isoFirst = Math.max(0, isoIndices[0] - 1);
      const isoLast = Math.min(isoProjected.length - 1, isoIndices[isoIndices.length - 1] + 1);
      const segPoints = isoProjected.slice(isoFirst, isoLast + 1);
      if (segPoints.length < 2) continue;

      let d = `M ${segPoints[0].x.toFixed(1)} ${segPoints[0].y.toFixed(1)}`;
      for (let j = 1; j < segPoints.length; j++) {
        d += ` L ${segPoints[j].x.toFixed(1)} ${segPoints[j].y.toFixed(1)}`;
      }
      isoKmSegments.push({
        path: d,
        color: paceToColor(split.paceSecondsPerKm, avgPace),
        km: split.km,
      });
    }

    // Shadow/ground path for isometric (flat projection at bottom)
    const groundPoints = projected.map(p => ({
      x: p.x * tiltX + p.y * 0.15,
      y: p.y * tiltY + elevScale + 30,
    }));
    let groundPath = `M ${groundPoints[0].x.toFixed(1)} ${groundPoints[0].y.toFixed(1)}`;
    for (let i = 1; i < groundPoints.length; i++) {
      groundPath += ` L ${groundPoints[i].x.toFixed(1)} ${groundPoints[i].y.toFixed(1)}`;
    }

    // Iso markers
    const isoMarkers: { km: number; x: number; y: number }[] = [];
    for (let km = 5; km <= distanceKm; km += 5) {
      const targetDist = km * 1000;
      let closestIdx = 0;
      let closestDiff = Infinity;
      for (let i = 0; i < projected.length; i++) {
        const diff = Math.abs(projected[i].dist - targetDist);
        if (diff < closestDiff) { closestDiff = diff; closestIdx = i; }
      }
      isoMarkers.push({ km, x: isoProjected[closestIdx].x, y: isoProjected[closestIdx].y });
    }

    // Vertical lines connecting ground to route at markers (for depth)
    const isoVerticals: { x: number; yTop: number; yBottom: number; km: number }[] = [];
    for (let km = 10; km <= distanceKm; km += 10) {
      const targetDist = km * 1000;
      let closestIdx = 0;
      let closestDiff = Infinity;
      for (let i = 0; i < projected.length; i++) {
        const diff = Math.abs(projected[i].dist - targetDist);
        if (diff < closestDiff) { closestDiff = diff; closestIdx = i; }
      }
      isoVerticals.push({
        x: isoProjected[closestIdx].x,
        yTop: isoProjected[closestIdx].y,
        yBottom: groundPoints[closestIdx].y,
        km,
      });
    }

    const isoStart = isoProjected[0];
    const isoEnd = isoProjected[isoProjected.length - 1];

    // Elevation curtain: filled polygon from route down to ground
    // Go forward along route, then backward along ground to close the shape
    let curtainPath = `M ${isoProjected[0].x.toFixed(1)} ${isoProjected[0].y.toFixed(1)}`;
    for (let i = 1; i < isoProjected.length; i++) {
      curtainPath += ` L ${isoProjected[i].x.toFixed(1)} ${isoProjected[i].y.toFixed(1)}`;
    }
    // Go back along the ground
    for (let i = groundPoints.length - 1; i >= 0; i--) {
      curtainPath += ` L ${groundPoints[i].x.toFixed(1)} ${groundPoints[i].y.toFixed(1)}`;
    }
    curtainPath += ' Z';

    // Elevation labels every 5km showing altitude + arrow
    const elevLabels: { km: number; x: number; yRoute: number; yGround: number; elev: number; trend: 'up' | 'down' | 'flat' }[] = [];
    for (let km = 5; km <= distanceKm; km += 5) {
      const targetDist = km * 1000;
      let closestIdx = 0;
      let closestDiff = Infinity;
      for (let i = 0; i < projected.length; i++) {
        const diff = Math.abs(projected[i].dist - targetDist);
        if (diff < closestDiff) { closestDiff = diff; closestIdx = i; }
      }
      // Determine trend: compare elevation at this km vs 2km before
      const prevDist = (km - 2) * 1000;
      let prevIdx = 0;
      let prevDiff = Infinity;
      for (let i = 0; i < projected.length; i++) {
        const diff = Math.abs(projected[i].dist - prevDist);
        if (diff < prevDiff) { prevDiff = diff; prevIdx = i; }
      }
      const elevHere = points[closestIdx].elevation;
      const elevPrev = points[prevIdx].elevation;
      const delta = elevHere - elevPrev;
      const trend = delta > 15 ? 'up' : delta < -15 ? 'down' : 'flat';

      elevLabels.push({
        km,
        x: isoProjected[closestIdx].x,
        yRoute: isoProjected[closestIdx].y,
        yGround: groundPoints[closestIdx].y,
        elev: Math.round(elevHere),
        trend,
      });
    }

    return {
      svgW, svgH, kmSegments, markers, sp, ep,
      isoW, isoH: isoH, isoKmSegments, groundPath, curtainPath, isoMarkers, isoVerticals, isoStart, isoEnd,
      elevLabels,
      minElev: Math.round(minElev), maxElev: Math.round(maxElev),
      startElev: Math.round(points[0].elevation),
      endElev:   Math.round(points[points.length - 1].elevation),
    };
  }, [points, distanceKm, splits, avgPace]);

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Circuito</CardTitle>
        <div className="flex gap-1">
          <button
            onClick={() => setView('plano')}
            className={`text-xs px-2 py-1 rounded ${view === 'plano' ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            Plano
          </button>
          <button
            onClick={() => setView('isometrica')}
            className={`text-xs px-2 py-1 rounded ${view === 'isometrica' ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            3D
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-3 mb-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1.5 rounded" style={{ background: 'oklch(0.75 0.17 160)' }} /> Rapido
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1.5 rounded" style={{ background: 'oklch(0.6 0 0 / 0.6)' }} /> Promedio
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1.5 rounded" style={{ background: 'oklch(0.65 0.2 27)' }} /> Lento
          </span>
        </div>

        {view === 'plano' ? (
          <svg viewBox={`0 0 ${data.svgW} ${data.svgH}`} className="w-full" style={{ maxHeight: '350px' }}>
            {/* Pace-colored route segments */}
            {data.kmSegments.map((seg) => (
              <path
                key={seg.km}
                d={seg.path}
                fill="none"
                stroke={seg.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Km markers */}
            {data.markers.map(m => (
              <g key={m.km}>
                <circle cx={m.x} cy={m.y} r="3" fill="oklch(0.178 0 0)" stroke="oklch(0.708 0 0)" strokeWidth="1" />
                <text x={m.x} y={m.y - 7} textAnchor="middle" fill="oklch(0.708 0 0)" fontSize="8" fontFamily="system-ui">
                  {m.km}
                </text>
              </g>
            ))}

            {/* Start */}
            <g>
              <circle cx={data.sp.x} cy={data.sp.y} r="5" fill="oklch(0.75 0.17 160)" />
              <text x={data.sp.x} y={data.sp.y - 9} textAnchor="middle" fill="oklch(0.75 0.17 160)" fontSize="9" fontWeight="bold" fontFamily="system-ui">
                LARGADA
              </text>
            </g>

            {/* End */}
            <g>
              <circle cx={data.ep.x} cy={data.ep.y} r="5" fill="oklch(0.65 0.2 27)" />
              <text x={data.ep.x} y={data.ep.y - 9} textAnchor="middle" fill="oklch(0.65 0.2 27)" fontSize="9" fontWeight="bold" fontFamily="system-ui">
                META
              </text>
            </g>
          </svg>
        ) : (
          <svg viewBox={`-10 0 ${data.isoW + 20} ${data.isoH + 20}`} className="w-full" style={{ maxHeight: '400px' }}>
            <defs>
              <linearGradient id="curtainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.5 0.05 220)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="oklch(0.3 0 0)" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Elevation curtain fill - shows height visually */}
            <path
              d={data.curtainPath}
              fill="url(#curtainGrad)"
              stroke="none"
            />

            {/* Ground shadow */}
            <path
              d={data.groundPath}
              fill="none"
              stroke="oklch(0.3 0 0 / 0.4)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Vertical reference lines */}
            {data.isoVerticals.map(v => (
              <g key={v.km}>
                <line
                  x1={v.x} y1={v.yTop} x2={v.x} y2={v.yBottom}
                  stroke="oklch(0.4 0 0 / 0.3)"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                />
                <text x={v.x} y={v.yBottom + 12} textAnchor="middle" fill="oklch(0.5 0 0)" fontSize="7" fontFamily="system-ui">
                  {v.km}km
                </text>
              </g>
            ))}

            {/* Elevated route, pace-colored */}
            {data.isoKmSegments.map((seg) => (
              <path
                key={seg.km}
                d={seg.path}
                fill="none"
                stroke={seg.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Iso km markers */}
            {data.isoMarkers.map(m => (
              <g key={m.km}>
                <circle cx={m.x} cy={m.y} r="2.5" fill="oklch(0.178 0 0)" stroke="oklch(0.708 0 0)" strokeWidth="0.8" />
                <text x={m.x} y={m.y - 6} textAnchor="middle" fill="oklch(0.708 0 0)" fontSize="7" fontFamily="system-ui">
                  {m.km}
                </text>
              </g>
            ))}

            {/* Elevation labels with trend arrows */}
            {data.elevLabels.filter(l => l.trend !== 'flat').map(l => (
              <g key={`elev-${l.km}`}>
                <text
                  x={l.x + 8}
                  y={(l.yRoute + l.yGround) / 2}
                  textAnchor="start"
                  fontSize="7"
                  fontFamily="system-ui"
                  fill={l.trend === 'up' ? 'oklch(0.65 0.15 27 / 0.9)' : 'oklch(0.7 0.14 160 / 0.9)'}
                >
                  {l.trend === 'up' ? '▲' : '▼'} {l.elev}m
                </text>
              </g>
            ))}

            {/* Start — label + elevación */}
            <g>
              <circle cx={data.isoStart.x} cy={data.isoStart.y} r="4" fill="oklch(0.75 0.17 160)" />
              <text x={data.isoStart.x} y={data.isoStart.y - 16} textAnchor="middle" fill="oklch(0.75 0.17 160)" fontSize="8" fontWeight="bold" fontFamily="system-ui">
                LARGADA
              </text>
              <text x={data.isoStart.x} y={data.isoStart.y - 7} textAnchor="middle" fill="oklch(0.75 0.17 160 / 0.75)" fontSize="7" fontFamily="system-ui">
                {data.startElev}m
              </text>
            </g>

            {/* End — label + elevación */}
            <g>
              <circle cx={data.isoEnd.x} cy={data.isoEnd.y} r="4" fill="oklch(0.65 0.2 27)" />
              <text x={data.isoEnd.x} y={data.isoEnd.y - 16} textAnchor="middle" fill="oklch(0.65 0.2 27)" fontSize="8" fontWeight="bold" fontFamily="system-ui">
                META
              </text>
              <text x={data.isoEnd.x} y={data.isoEnd.y - 7} textAnchor="middle" fill="oklch(0.65 0.2 27 / 0.75)" fontSize="7" fontFamily="system-ui">
                {data.endElev}m
              </text>
            </g>

            {/* Elevation scale */}
            <text x={data.isoW + 5} y={30} fill="oklch(0.5 0 0)" fontSize="7" fontFamily="system-ui">
              {data.maxElev}m
            </text>
            <text x={data.isoW + 5} y={data.isoH - 30} fill="oklch(0.5 0 0)" fontSize="7" fontFamily="system-ui">
              {data.minElev}m
            </text>
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
