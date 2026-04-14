'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatTime, formatDelta } from '@/lib/format';
import { useUnits } from '@/lib/units';
import { useLang } from '@/lib/lang';
import type { RaceWaterfall, AggregatedWeather, CourseProfile } from '@/lib/engine/types';

interface WaterfallChartProps {
  waterfall: RaceWaterfall;
  weather: AggregatedWeather;
  course: CourseProfile;
}

export function WaterfallChart({ waterfall, weather, course }: WaterfallChartProps) {
  const { fmtTemp, fmtWind, fmtElev } = useUnits();
  const { t } = useLang();
  const p = t.plan;

  const rows: { label: string; value: string; isDelta?: boolean; isTotal?: boolean }[] = [];

  if (waterfall.riegelTimeSeconds)   rows.push({ label: p.rowRiegel,    value: formatTime(waterfall.riegelTimeSeconds) });
  if (waterfall.intervalTimeSeconds) rows.push({ label: p.rowIntervals, value: formatTime(waterfall.intervalTimeSeconds) });
  rows.push({ label: p.rowBase, value: formatTime(waterfall.baseTimeSeconds) });
  rows.push({
    label: `${p.rowClimate} (${fmtTemp(weather.temperature)}→${weather.temperatureEnd != null ? fmtTemp(weather.temperatureEnd) : '?'})`,
    value: formatDelta(waterfall.climateAdjustment),
    isDelta: true,
  });
  rows.push({
    label: `${p.rowElevation} (${fmtElev(course.totalElevationGain)}↑ ${fmtElev(course.totalElevationLoss)}↓)`,
    value: formatDelta(waterfall.elevationAdjustment),
    isDelta: true,
  });
  rows.push({
    label: `${p.rowWind} (${fmtWind(weather.windSpeedKmh)})`,
    value: formatDelta(waterfall.windAdjustment),
    isDelta: true,
  });
  rows.push({ label: p.rowFinal, value: formatTime(waterfall.finalTimeSeconds), isTotal: true });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{p.waterfallTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {rows.map((row, i) => {
            const deltaColor = row.isDelta
              ? row.value.startsWith('+') ? 'text-red-400'
              : row.value.startsWith('-') ? 'text-emerald-400' : ''
              : '';
            return (
              <div
                key={i}
                className={`flex justify-between items-center py-1.5 ${row.isTotal ? 'border-t border-[var(--border)] mt-2 pt-3' : ''}`}
              >
                <span className={`text-sm ${row.isTotal ? 'font-bold' : 'text-[var(--muted-foreground)]'}`}>
                  {row.label}
                </span>
                <span className={`font-mono text-sm ${row.isTotal ? 'text-[var(--primary)] font-bold' : deltaColor}`}>
                  {row.value}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
