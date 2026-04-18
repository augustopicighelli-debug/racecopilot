'use client';

import { Thermometer, Snowflake, CloudSun, Sun, Flame, Wind, Droplets } from 'lucide-react';
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

  const isNeutral = weather.sourcesCount === 0;

  const windDir = p.windDirs[Math.round(weather.windDirectionDeg / 45) % 8];

  const confidenceVariant =
    weather.sourceAgreement === 'high'   ? 'success' :
    weather.sourceAgreement === 'medium' ? 'warning' : 'destructive';

  const confidenceLabel =
    weather.sourceAgreement === 'high'   ? p.confHigh :
    weather.sourceAgreement === 'medium' ? p.confMedium : p.confLow;

  // Icono de temperatura según condiciones
  const TempIcon =
    isNeutral                    ? Thermometer :
    weather.temperature <= 5     ? Snowflake   :
    weather.temperature <= 14    ? CloudSun    :
    weather.temperature <= 22    ? Sun         : Flame;

  const tempIconColor =
    isNeutral                    ? 'var(--muted-foreground)' :
    weather.temperature <= 5     ? '#60a5fa' :
    weather.temperature <= 14    ? '#93c5fd' :
    weather.temperature <= 22    ? '#fbbf24' : '#f97316';

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(249,115,22,0.08)' }}
            >
              <TempIcon size={22} style={{ color: tempIconColor }} />
            </div>
            <div>
              {isNeutral ? (
                <>
                  <p className="text-2xl font-bold" style={{ color: 'var(--muted-foreground)' }}>
                    {p.weatherNoData}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {p.weatherNoDataHint}
                  </p>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            {!isNeutral && (
              <Badge variant={confidenceVariant}>{p.confidence} {confidenceLabel}</Badge>
            )}
            {weather.daysUntilRace > 7 && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {p.daysLeft(weather.daysUntilRace)}
              </p>
            )}
          </div>
        </div>

        {!isNeutral && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold tabular-nums">{weather.humidity}%</p>
              <p className="text-xs flex items-center justify-center gap-1 text-[var(--muted-foreground)]">
                <Droplets size={11} /> {p.humidity}
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{fmtWind(weather.windSpeedKmh)}</p>
              <p className="text-xs flex items-center justify-center gap-1 text-[var(--muted-foreground)]">
                <Wind size={11} /> {p.wind}
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{windDir}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{p.direction}</p>
            </div>
          </div>
        )}
        {/* Atribución requerida por Visual Crossing plan free */}
        <p className="text-[10px] text-right mt-2" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
          Powered by{' '}
          <a href="https://www.visualcrossing.com" target="_blank" rel="noopener noreferrer" className="underline">
            Visual Crossing
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
