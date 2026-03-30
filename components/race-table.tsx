'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPaceShort, formatTime } from '@/lib/format';
import type { SplitKm, HydrationPlan, NutritionPlan } from '@/lib/engine/types';

interface RaceTableProps {
  splits: SplitKm[];
  avgPace: number;
  hydration: HydrationPlan;
  nutrition: NutritionPlan;
}

function paceColor(pace: number, avgPace: number): string {
  const diff = pace - avgPace;
  if (diff < -3) return 'text-emerald-400';
  if (diff > 3) return 'text-red-400';
  return '';
}

export function RaceTable({ splits, avgPace, hydration, nutrition }: RaceTableProps) {
  const [expanded, setExpanded] = useState(false);

  // Build lookup maps for hydration and nutrition events by km
  const hydrationByKm = new Map<number, number>();
  for (const e of hydration.events) {
    hydrationByKm.set(e.km, e.mlToDrink);
  }

  const nutritionByKm = new Map<number, string[]>();
  for (const e of nutrition.events) {
    const items = nutritionByKm.get(e.km) ?? [];
    const label = e.product.type === 'salt_pill'
      ? `${e.product.name}`
      : `${e.product.name} (${e.carbsGrams}g)`;
    items.push(label);
    nutritionByKm.set(e.km, items);
  }

  // Group splits into 5km chunks for collapsed view
  const chunkSize = 5;
  const chunks: { label: string; startKm: number; endKm: number; avgPaceChunk: number; endTime: number; splits: SplitKm[] }[] = [];

  for (let i = 0; i < splits.length; i += chunkSize) {
    const chunk = splits.slice(i, i + chunkSize);
    const startKm = chunk[0].km;
    const endKm = chunk[chunk.length - 1].km;
    const avgPaceChunk = chunk.reduce((sum, s) => sum + s.paceSecondsPerKm, 0) / chunk.length;
    const endTime = chunk[chunk.length - 1].cumulativeTimeSeconds;
    chunks.push({ label: `Km ${startKm}-${endKm}`, startKm, endKm, avgPaceChunk, endTime, splits: chunk });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Plan de carrera</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Sudoracion: {hydration.sweatRateMlPerHour} ml/h
            {nutrition.preRaceGel && (
              <> — Pre-carrera: {nutrition.preRaceGel.product.name} ({nutrition.preRaceGel.carbsGrams}g)</>
            )}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[var(--primary)] hover:underline flex-shrink-0"
        >
          {expanded ? 'Resumen 5K' : 'Ver km a km'}
        </button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="text-left py-2 pr-2">Km</th>
              <th className="text-right py-2 px-2">Ritmo</th>
              <th className="text-right py-2 px-2">Tiempo</th>
              <th className="text-left py-2 px-2">Hidrat.</th>
              <th className="text-left py-2 pl-2">Nutricion</th>
            </tr>
          </thead>
          <tbody>
            {expanded
              ? splits.map((s) => {
                  const ml = hydrationByKm.get(s.km);
                  const nutItems = nutritionByKm.get(s.km);
                  const notes = [s.elevationNote, s.windNote].filter(Boolean).join(', ');
                  return (
                    <tr key={s.km} className="border-b border-[var(--border)]/50">
                      <td className="py-1.5 pr-2 font-mono">{s.km}</td>
                      <td className={`py-1.5 px-2 text-right font-mono ${paceColor(s.paceSecondsPerKm, avgPace)}`}>
                        {formatPaceShort(s.paceSecondsPerKm)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-[var(--muted-foreground)]">
                        {formatTime(s.cumulativeTimeSeconds)}
                      </td>
                      <td className="py-1.5 px-2">
                        {ml && <span className="text-blue-400 text-xs">{ml}ml</span>}
                      </td>
                      <td className="py-1.5 pl-2 text-xs">
                        {nutItems && nutItems.map((n, i) => (
                          <span key={i} className="text-amber-400">{n}{i < nutItems.length - 1 ? ', ' : ''}</span>
                        ))}
                        {notes && !nutItems && (
                          <span className="text-[var(--muted-foreground)]">{notes}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              : chunks.map((chunk) => {
                  // Collect hydration and nutrition events in this chunk
                  const chunkMl = chunk.splits.reduce((sum, s) => sum + (hydrationByKm.get(s.km) ?? 0), 0);
                  const chunkNut = chunk.splits.flatMap(s => nutritionByKm.get(s.km) ?? []);
                  return (
                    <tr key={chunk.label} className="border-b border-[var(--border)]/50">
                      <td className="py-2 pr-2 font-medium">{chunk.label}</td>
                      <td className={`py-2 px-2 text-right font-mono ${paceColor(chunk.avgPaceChunk, avgPace)}`}>
                        {formatPaceShort(chunk.avgPaceChunk)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-[var(--muted-foreground)]">
                        {formatTime(chunk.endTime)}
                      </td>
                      <td className="py-2 px-2">
                        {chunkMl > 0 && <span className="text-blue-400 text-xs">{chunkMl}ml</span>}
                      </td>
                      <td className="py-2 pl-2 text-xs">
                        {chunkNut.length > 0 && (
                          <span className="text-amber-400">{chunkNut.length}x gel/sal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
