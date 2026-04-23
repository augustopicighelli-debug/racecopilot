'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPaceShort, formatTime } from '@/lib/format';
import type { SplitKm } from '@/lib/engine/types';

interface SplitsTableProps {
  splits: SplitKm[];
  avgPace: number;
}

function paceColor(pace: number, avgPace: number): string {
  const diff = pace - avgPace;
  if (diff < -3) return 'text-emerald-400';
  if (diff > 3) return 'text-red-400';
  return '';
}

export function SplitsTable({ splits, avgPace }: SplitsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Splits</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="text-left py-2 pr-2">Km</th>
              <th className="text-right py-2 px-2">Ritmo</th>
              <th className="text-right py-2 px-2">Acumulado</th>
              <th className="text-left py-2 pl-2">Notas</th>
            </tr>
          </thead>
          <tbody>
            {splits.map((s: SplitKm) => {
              const notes = [s.elevationNote, s.windNote].filter(Boolean).join(', ');
              // Separador cada 5km más fuerte que el de cada 1km
              const isMilestone = s.km % 5 === 0;
              return (
                <tr key={s.km} className={isMilestone ? 'border-b border-[var(--border)]' : 'border-b border-[var(--border)]/30'}>
                  <td className={`py-1.5 pr-2 font-mono ${isMilestone ? 'font-bold' : ''}`}>{s.km}</td>
                  <td className={`py-1.5 px-2 text-right font-mono ${paceColor(s.paceSecondsPerKm, avgPace)}`}>
                    {formatPaceShort(s.paceSecondsPerKm)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-[var(--muted-foreground)]">
                    {formatTime(s.cumulativeTimeSeconds)}
                  </td>
                  <td className="py-1.5 pl-2 text-xs text-[var(--muted-foreground)]">{notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
