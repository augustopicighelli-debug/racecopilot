'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUnits } from '@/lib/units';
import { useLang } from '@/lib/lang';
import type { AggregatedWeather } from '@/lib/engine/types';

interface WeatherCardProps {
  weather: AggregatedWeather;
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const { fmtTemp, fmtWind } = useUnits();
  const { t } = useLang();
  const p = t.plan;

  const windDir = p.windDirs[Math.round(weather.windDirectionDeg / 45) % 8];

  const confidenceVariant =
    weather.sourceAgreement === 'high'   ? 'success' :
    weather.sourceAgreement === 'medium' ? 'warning' : 'destructive';

  const confidenceLabel =
    weather.sourceAgreement === 'high'   ? p.confHigh :
    weather.sourceAgreement === 'medium' ? p.confMedium : p.confLow;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {weather.temperature <= 5  ? '🥶' :
               weather.temperature <= 14 ? '🌤️' :
               weather.temperature <= 22 ? '☀️' : '🔥'}
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {weather.temperatureEnd != null
                  ? `${fmtTemp(weather.temperature)} → ${fmtTemp(weather.temperatureEnd)}`
                  : fmtTemp(weather.temperature)}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {weather.temperatureEnd != null
                  ? (weather.daysUntilRace > 16 ? p.historicalRange : p.startToFinish)
                  : p.atStart}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={confidenceVariant}>{p.confidence} {confidenceLabel}</Badge>
            {weather.daysUntilRace > 7 && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {p.daysLeft(weather.daysUntilRace)}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold tabular-nums">{weather.humidity}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">{p.humidity}</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{fmtWind(weather.windSpeedKmh)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{p.wind}</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{windDir}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{p.direction}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
