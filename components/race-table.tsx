'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

interface Chunk {
  index: number;
  label: string;
  avgPaceChunk: number;
  endTime: number;
  splits: SplitKm[];
}

export function RaceTable({ splits, avgPace, hydration, nutrition }: RaceTableProps) {
  const [expandAll, setExpandAll] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

  // Build lookup maps
  const hydrationByKm = new Map<number, number>();
  for (const e of hydration.events) {
    hydrationByKm.set(e.km, e.mlToDrink);
  }

  const nutritionByKm = new Map<number, string[]>();
  for (const e of nutrition.events) {
    const items = nutritionByKm.get(e.km) ?? [];
    const label = e.product.type === 'salt_pill'
      ? e.product.name
      : `${e.product.name} (${e.carbsGrams}g)`;
    items.push(label);
    nutritionByKm.set(e.km, items);
  }

  // Group into 5km chunks
  const chunkSize = 5;
  const chunks: Chunk[] = [];
  for (let i = 0; i < splits.length; i += chunkSize) {
    const chunk = splits.slice(i, i + chunkSize);
    const startKm = chunk[0].km;
    const endKm = chunk[chunk.length - 1].km;
    const avgPaceChunk = chunk.reduce((sum, s) => sum + s.paceSecondsPerKm, 0) / chunk.length;
    const endTime = chunk[chunk.length - 1].cumulativeTimeSeconds;
    chunks.push({ index: Math.floor(i / chunkSize), label: `Km ${startKm}-${endKm}`, avgPaceChunk, endTime, splits: chunk });
  }

  function toggleChunk(index: number) {
    setExpandedChunks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleExpandAll() {
    if (expandAll) {
      setExpandAll(false);
      setExpandedChunks(new Set());
    } else {
      setExpandAll(true);
      setExpandedChunks(new Set(chunks.map(c => c.index)));
    }
  }

  function isChunkExpanded(index: number) {
    return expandAll || expandedChunks.has(index);
  }

  function renderDetailRow(s: SplitKm) {
    const ml = hydrationByKm.get(s.km);
    const nutItems = nutritionByKm.get(s.km);
    const notes = [s.elevationNote, s.windNote].filter(Boolean);

    return (
      <tr key={`detail-${s.km}`} className="border-b border-[var(--border)]/30 bg-[var(--background)]/50">
        <td className="py-1 pl-6 pr-2 font-mono text-[var(--muted-foreground)]">{s.km}</td>
        <td className={`py-1 px-2 text-right font-mono ${paceColor(s.paceSecondsPerKm, avgPace)}`}>
          {formatPaceShort(s.paceSecondsPerKm)}
        </td>
        <td className="py-1 px-2 text-right font-mono text-[var(--muted-foreground)]">
          {formatTime(s.cumulativeTimeSeconds)}
        </td>
        <td className="py-1 px-2">
          {ml ? <span className="text-blue-400 text-xs">{ml}ml</span> : null}
        </td>
        <td className="py-1 px-2 text-xs">
          {nutItems && nutItems.map((n, i) => (
            <span key={i} className="text-amber-400">{n}{i < nutItems.length - 1 ? ', ' : ''}</span>
          ))}
        </td>
        <td className="py-1 pl-2 text-xs text-[var(--muted-foreground)]">
          {notes.join(', ')}
        </td>
      </tr>
    );
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
          onClick={handleExpandAll}
          className="text-xs text-[var(--primary)] hover:underline flex-shrink-0"
        >
          {expandAll ? 'Colapsar todo' : 'Ver km a km'}
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
              <th className="text-left py-2 px-2">Nutricion</th>
              <th className="text-left py-2 pl-2">Terreno</th>
            </tr>
          </thead>
          <tbody>
            {chunks.map((chunk) => {
              const open = isChunkExpanded(chunk.index);
              const chunkMl = chunk.splits.reduce((sum, s) => sum + (hydrationByKm.get(s.km) ?? 0), 0);
              const chunkNut = chunk.splits.flatMap(s => nutritionByKm.get(s.km) ?? []);
              const chunkNotes = chunk.splits.flatMap(s => [s.elevationNote, s.windNote].filter(Boolean));
              const uniqueNotes = [...new Set(chunkNotes)];

              return [
                <tr
                  key={`chunk-${chunk.index}`}
                  className="border-b border-[var(--border)]/50 cursor-pointer hover:bg-[var(--accent)]/30 transition-colors"
                  onClick={() => toggleChunk(chunk.index)}
                >
                  <td className="py-2 pr-2 font-medium">
                    <span className="inline-block w-4 text-[var(--muted-foreground)] text-xs">
                      {open ? '▾' : '▸'}
                    </span>
                    {chunk.label}
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${paceColor(chunk.avgPaceChunk, avgPace)}`}>
                    {formatPaceShort(chunk.avgPaceChunk)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-[var(--muted-foreground)]">
                    {formatTime(chunk.endTime)}
                  </td>
                  <td className="py-2 px-2">
                    {chunkMl > 0 && <span className="text-blue-400 text-xs">{chunkMl}ml</span>}
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {chunkNut.length > 0 && (
                      <span className="text-amber-400">{chunkNut.length}x gel/sal</span>
                    )}
                  </td>
                  <td className="py-2 pl-2 text-xs text-[var(--muted-foreground)]">
                    {uniqueNotes.length > 0 && uniqueNotes.join(', ')}
                  </td>
                </tr>,
                ...(open ? chunk.splits.map(s => renderDetailRow(s)) : []),
              ];
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
