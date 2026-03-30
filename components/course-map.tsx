'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPaceShort } from '@/lib/format';
import type { GpxPoint } from '@/lib/engine/types';

interface CourseMapProps {
  points: GpxPoint[];
  distanceKm: number;
}

// Project lat/lon to x/y using Mercator-like projection
function project(lat: number, lon: number, bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }) {
  const x = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
  // Invert Y because SVG y goes down but lat goes up
  const y = 1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
  return { x, y };
}

export function CourseMap({ points, distanceKm }: CourseMapProps) {
  const [hoverKm, setHoverKm] = useState<number | null>(null);

  const { pathD, kmMarkers, bounds, startPoint, endPoint } = useMemo(() => {
    if (points.length === 0) return { pathD: '', kmMarkers: [], bounds: null, startPoint: null, endPoint: null };

    // Calculate bounds with padding
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Add 5% padding
    const latPad = (maxLat - minLat) * 0.05 || 0.001;
    const lonPad = (maxLon - minLon) * 0.05 || 0.001;
    const b = {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLon: minLon - lonPad,
      maxLon: maxLon + lonPad,
    };

    // Correct aspect ratio (longitude shrinks at higher latitudes)
    const midLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos(midLat * Math.PI / 180);
    const latRange = b.maxLat - b.minLat;
    const lonRange = (b.maxLon - b.minLon) * cosLat;

    // SVG viewBox dimensions
    const svgW = 500;
    const svgH = svgW * (latRange / lonRange);

    // Build SVG path - sample every Nth point for performance
    const step = Math.max(1, Math.floor(points.length / 2000));
    const sampled = points.filter((_, i) => i % step === 0 || i === points.length - 1);

    const projectedPoints = sampled.map(p => {
      const { x, y } = project(p.lat, p.lon, b);
      return { x: x * svgW, y: y * svgH, dist: p.distanceFromStart };
    });

    let d = `M ${projectedPoints[0].x.toFixed(1)} ${projectedPoints[0].y.toFixed(1)}`;
    for (let i = 1; i < projectedPoints.length; i++) {
      d += ` L ${projectedPoints[i].x.toFixed(1)} ${projectedPoints[i].y.toFixed(1)}`;
    }

    // Km markers - find closest point to each km
    const markers: { km: number; x: number; y: number }[] = [];
    for (let km = 5; km <= distanceKm; km += 5) {
      const targetDist = km * 1000;
      let closest = sampled[0];
      let closestDiff = Infinity;
      for (const p of sampled) {
        const diff = Math.abs(p.distanceFromStart - targetDist);
        if (diff < closestDiff) {
          closestDiff = diff;
          closest = p;
        }
      }
      const { x, y } = project(closest.lat, closest.lon, b);
      markers.push({ km, x: x * svgW, y: y * svgH });
    }

    // Start and end
    const sp = project(points[0].lat, points[0].lon, b);
    const ep = project(points[points.length - 1].lat, points[points.length - 1].lon, b);

    return {
      pathD: d,
      kmMarkers: markers,
      bounds: { svgW, svgH },
      startPoint: { x: sp.x * svgW, y: sp.y * svgH },
      endPoint: { x: ep.x * svgW, y: ep.y * svgH },
    };
  }, [points, distanceKm]);

  if (!bounds) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Circuito</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${bounds.svgW} ${bounds.svgH}`}
          className="w-full"
          style={{ maxHeight: '350px' }}
        >
          {/* Route line */}
          <path
            d={pathD}
            fill="none"
            stroke="oklch(0.75 0.15 160)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Km markers */}
          {kmMarkers.map(m => (
            <g key={m.km}>
              <circle
                cx={m.x}
                cy={m.y}
                r="3"
                fill="oklch(0.178 0 0)"
                stroke="oklch(0.708 0 0)"
                strokeWidth="1"
              />
              <text
                x={m.x}
                y={m.y - 7}
                textAnchor="middle"
                fill="oklch(0.708 0 0)"
                fontSize="8"
                fontFamily="system-ui"
              >
                {m.km}
              </text>
            </g>
          ))}

          {/* Start marker */}
          {startPoint && (
            <g>
              <circle cx={startPoint.x} cy={startPoint.y} r="5" fill="oklch(0.75 0.17 160)" />
              <text
                x={startPoint.x}
                y={startPoint.y - 9}
                textAnchor="middle"
                fill="oklch(0.75 0.17 160)"
                fontSize="9"
                fontWeight="bold"
                fontFamily="system-ui"
              >
                LARGADA
              </text>
            </g>
          )}

          {/* End marker */}
          {endPoint && (
            <g>
              <circle cx={endPoint.x} cy={endPoint.y} r="5" fill="oklch(0.65 0.2 27)" />
              <text
                x={endPoint.x}
                y={endPoint.y - 9}
                textAnchor="middle"
                fill="oklch(0.65 0.2 27)"
                fontSize="9"
                fontWeight="bold"
                fontFamily="system-ui"
              >
                META
              </text>
            </g>
          )}
        </svg>
      </CardContent>
    </Card>
  );
}
