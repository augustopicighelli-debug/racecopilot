'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatTime } from '@/lib/format';
import { useUnits } from '@/lib/units';
import { useLang } from '@/lib/lang';
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
  const { fmtVol, fmtPace } = useUnits();
  const { t } = useLang();
  const p = t.plan;

  const fmtPaceShort = (secPerKm: number) => {
    const full = fmtPace(secPerKm);
    return full.replace(' /km', '').replace(' /mi', '');
  };

  /** Notas explicativas por km usando el diccionario de idioma */
  function buildNotes(s: SplitKm, hasHydration: boolean, hasNutrition: boolean): string[] {
    const notes: string[] = [];
    const bd = s.breakdown;
    if (s.km === 1)               notes.push(p.noteStart);
    if (bd.elevationDelta > 2)    notes.push(p.noteClimb);
    else if (bd.elevationDelta < -2) notes.push(p.noteDescent);
    if (bd.windDelta > 1)         notes.push(p.noteHeadwind);
    else if (bd.windDelta < -1)   notes.push(p.noteTailwind);
    if (bd.fatigueFactor > 1.01)  notes.push(p.noteFatigue);
    if (hasHydration)             notes.push(p.noteHydration);
    if (hasNutrition)             notes.push(p.noteNutrition);
    if (bd.climateFactor > 1.02)  notes.push(p.noteHeat);
    return notes;
  }

  const hydrationByKm = new Map<number, number>();
  for (const e of hydration.events) hydrationByKm.set(e.km, e.mlToDrink);

  const nutritionByKm = new Map<number, { label: string; type: string }[]>();
  for (const e of nutrition.events) {
    const items = nutritionByKm.get(e.km) ?? [];
    const label = e.product.type === 'salt_pill'
      ? e.product.name
      : `${e.product.name} (${e.carbsGrams}g)`;
    items.push({ label, type: e.product.type });
    nutritionByKm.set(e.km, items);
  }

  const chunkSize = 5;
  const chunks: Chunk[] = [];
  for (let i = 0; i < splits.length; i += chunkSize) {
    const chunk = splits.slice(i, i + chunkSize);
    const avgPaceChunk = chunk.reduce((sum, s) => sum + s.paceSecondsPerKm, 0) / chunk.length;
    const endTime = chunk[chunk.length - 1].cumulativeTimeSeconds;
    chunks.push({
      index: Math.floor(i / chunkSize),
      label: `Km ${chunk[0].km}-${chunk[chunk.length - 1].km}`,
      avgPaceChunk,
      endTime,
      splits: chunk,
    });
  }

  function toggleChunk(index: number) {
    setExpandedChunks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  function handleExpandAll() {
    if (expandAll) { setExpandAll(false); setExpandedChunks(new Set()); }
    else { setExpandAll(true); setExpandedChunks(new Set(chunks.map(c => c.index))); }
  }

  function renderDetailRow(s: SplitKm) {
    const ml = hydrationByKm.get(s.km);
    const nutItems = nutritionByKm.get(s.km);
    const notes = buildNotes(s, hydrationByKm.has(s.km), nutritionByKm.has(s.km));
    return (
      <tr key={`detail-${s.km}`} className="border-b border-[var(--border)]/30 bg-[var(--background)]/50">
        <td className="py-1 pl-5 pr-1 font-mono text-[var(--muted-foreground)]">{s.km}</td>
        <td className={`py-1 px-1 text-right font-mono ${paceColor(s.paceSecondsPerKm, avgPace)}`}>
          {fmtPaceShort(s.paceSecondsPerKm)}
        </td>
        <td className="py-1 px-1 text-right font-mono text-[var(--muted-foreground)]">
          {formatTime(s.cumulativeTimeSeconds)}
        </td>
        <td className="py-1 px-1">
          {ml ? <span className="text-blue-400">{fmtVol(ml)}</span> : null}
        </td>
        <td className="py-1 px-1">
          {nutItems && nutItems.map((n, i) => (
            <span key={i} className="text-amber-400">{n.label}{i < nutItems.length - 1 ? ', ' : ''}</span>
          ))}
        </td>
        <td className="hidden sm:table-cell py-1 pl-1 pr-3 text-[var(--muted-foreground)]">
          {notes.join(', ')}
        </td>
      </tr>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{p.tableTitle}</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {p.sweatRate}: {fmtVol(hydration.sweatRateMlPerHour)}/h
            {nutrition.preRaceGel && (
              <> — {p.preRace}: {nutrition.preRaceGel.product.name} ({nutrition.preRaceGel.carbsGrams}g)</>
            )}
          </p>
        </div>
        <button onClick={handleExpandAll} className="text-xs text-[var(--primary)] hover:underline flex-shrink-0">
          {expandAll ? p.collapseAll : p.expandAll}
        </button>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <table className="w-full" style={{ fontSize: 'clamp(10px, 2.5vw, 14px)' }}>
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="text-left py-2 pl-3 pr-1">{p.colKm}</th>
              <th className="text-right py-2 px-1">{p.colPace}</th>
              <th className="text-right py-2 px-1">{p.colTime}</th>
              <th className="text-left py-2 px-1">{p.colHydration}</th>
              <th className="text-left py-2 px-1">{p.colNutrition}</th>
              {/* Notas ocultas en mobile — solo sm+ */}
              <th className="hidden sm:table-cell text-left py-2 pl-1 pr-3">{p.colNotes}</th>
            </tr>
          </thead>
          <tbody>
            {chunks.map((chunk) => {
              const open = expandAll || expandedChunks.has(chunk.index);
              const chunkMl = chunk.splits.reduce((sum, s) => sum + (hydrationByKm.get(s.km) ?? 0), 0);
              const chunkNutItems = chunk.splits.flatMap(s => nutritionByKm.get(s.km) ?? []);
              const gelCount  = chunkNutItems.filter(n => n.type === 'gel').length;
              const saltCount = chunkNutItems.filter(n => n.type === 'salt_pill').length;
              const nutSummary: string[] = [];
              if (gelCount  > 0) nutSummary.push(p.gel(gelCount));
              if (saltCount > 0) nutSummary.push(p.salt(saltCount));

              return [
                <tr
                  key={`chunk-${chunk.index}`}
                  className="border-b border-[var(--border)]/50 cursor-pointer hover:bg-[var(--accent)]/30 transition-colors"
                  onClick={() => toggleChunk(chunk.index)}
                >
                  <td className="py-2 pl-3 pr-1 font-medium">
                    <span className="inline-block w-3 text-[var(--muted-foreground)]">
                      {open ? '▾' : '▸'}
                    </span>
                    {chunk.label}
                  </td>
                  <td className={`py-2 px-1 text-right font-mono ${paceColor(chunk.avgPaceChunk, avgPace)}`}>
                    {fmtPaceShort(chunk.avgPaceChunk)}
                  </td>
                  <td className="py-2 px-1 text-right font-mono text-[var(--muted-foreground)]">
                    {formatTime(chunk.endTime)}
                  </td>
                  <td className="py-2 px-1">
                    {chunkMl > 0 && <span className="text-blue-400">{fmtVol(chunkMl)}</span>}
                  </td>
                  <td className="py-2 px-1">
                    {nutSummary.length > 0 && <span className="text-amber-400">{nutSummary.join(', ')}</span>}
                  </td>
                  <td className="hidden sm:table-cell" />
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
