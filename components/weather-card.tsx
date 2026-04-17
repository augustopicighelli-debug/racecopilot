'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUnits } from '@/lib/units';
import { useLang } from '@/lib/lang';
import type { AggregatedWeather } from '@/lib/engine/types';

interface WeatherCardProps {
  weather: AggregatedWeather;
}

/**
 * Calcula un score de 0–100 de qué tan favorables son las condiciones.
 * 100 = perfectas, 0 = extremadamente difíciles.
 *
 * Factores:
 * - Temperatura: ideal 8-15°C. Penalidad progresiva por calor (>18) o frío (<5).
 * - Humedad:     ideal ≤60%. Penalidad por >75%.
 * - Viento:      ideal ≤15 km/h. Penalidad por >25 km/h.
 */
function conditionsScore(w: AggregatedWeather): number {
  const temp = w.temperature;

  // Temperatura: puntaje 0-40 (peso mayor porque es el factor más crítico)
  let tempScore: number;
  if (temp >= 8 && temp <= 15)       tempScore = 40;
  else if (temp > 15 && temp <= 20)  tempScore = 40 - (temp - 15) * 3;   // -3 por grado
  else if (temp > 20 && temp <= 28)  tempScore = 25 - (temp - 20) * 2.5; // -2.5 por grado
  else if (temp > 28)                tempScore = Math.max(0, 5 - (temp - 28) * 2);
  else if (temp >= 0 && temp < 8)    tempScore = 40 - (8 - temp) * 2.5;  // frío
  else                               tempScore = Math.max(0, 20 - Math.abs(temp) * 3);
  tempScore = Math.max(0, Math.min(40, tempScore));

  // Humedad: puntaje 0-30
  let humScore: number;
  const hum = w.humidity;
  if (hum <= 60)       humScore = 30;
  else if (hum <= 75)  humScore = 30 - (hum - 60) * 1.5;
  else if (hum <= 90)  humScore = 7.5 - (hum - 75) * 0.5;
  else                 humScore = 0;
  humScore = Math.max(0, Math.min(30, humScore));

  // Viento: puntaje 0-30
  let windScore: number;
  const wind = w.windSpeedKmh;
  if (wind <= 15)      windScore = 30;
  else if (wind <= 25) windScore = 30 - (wind - 15) * 2;
  else if (wind <= 40) windScore = 10 - (wind - 25) * 0.67;
  else                 windScore = 0;
  windScore = Math.max(0, Math.min(30, windScore));

  return Math.round(tempScore + humScore + windScore);
}

/** Etiqueta y color según el score */
function conditionsLabel(score: number, t: ReturnType<typeof useLang>['t']): {
  label: string;
  color: string;
  bgColor: string;
} {
  const p = t.plan;
  if (score >= 80) return { label: p.condIdeal   ?? 'Ideales',          color: '#4ade80', bgColor: 'rgba(74,222,128,0.15)' };
  if (score >= 60) return { label: p.condGood    ?? 'Buenas',           color: '#86efac', bgColor: 'rgba(134,239,172,0.12)' };
  if (score >= 40) return { label: p.condFair    ?? 'Aceptables',       color: '#fbbf24', bgColor: 'rgba(251,191,36,0.12)' };
  if (score >= 20) return { label: p.condHard    ?? 'Difíciles',        color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' };
  return              { label: p.condVeryHard ?? 'Muy difíciles',  color: '#f87171', bgColor: 'rgba(248,113,113,0.12)' };
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const { fmtTemp, fmtWind } = useUnits();
  const { t } = useLang();
  const p = t.plan;

  // sourcesCount === 0 significa que cayó al neutral — no hay datos reales
  const isNeutral = weather.sourcesCount === 0;

  const windDir = p.windDirs[Math.round(weather.windDirectionDeg / 45) % 8];

  const confidenceVariant =
    weather.sourceAgreement === 'high'   ? 'success' :
    weather.sourceAgreement === 'medium' ? 'warning' : 'destructive';

  const confidenceLabel =
    weather.sourceAgreement === 'high'   ? p.confHigh :
    weather.sourceAgreement === 'medium' ? p.confMedium : p.confLow;

  // Score de condiciones (solo cuando hay datos reales)
  const score = isNeutral ? null : conditionsScore(weather);
  const cond  = score !== null ? conditionsLabel(score, t) : null;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {isNeutral ? '🌡️' :
               weather.temperature <= 5  ? '🥶' :
               weather.temperature <= 14 ? '🌤️' :
               weather.temperature <= 22 ? '☀️' : '🔥'}
            </span>
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

        {/* Solo mostrar detalles si hay datos reales */}
        {!isNeutral && (
          <>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
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

            {/* ── Barra de condiciones ─────────────────────────────────────── */}
            {cond && score !== null && (
              <div className="mt-1 pt-3 border-t border-[var(--border)]/50">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    {p.conditionsLabel ?? 'Condiciones para el tiempo objetivo'}
                  </p>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: cond.bgColor, color: cond.color }}
                  >
                    {cond.label}
                  </span>
                </div>

                {/* Barra de gradiente: rojo → amarillo → verde */}
                <div className="relative h-2 rounded-full overflow-visible"
                  style={{ background: 'linear-gradient(to right, #f87171, #fbbf24, #4ade80)' }}
                >
                  {/* Indicador de posición */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-all"
                    style={{
                      left: `calc(${score}% - 7px)`,
                      background: cond.color,
                    }}
                  />
                </div>

                {/* Extremos de la escala */}
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs" style={{ color: '#f87171' }}>
                    {p.condVeryHard ?? 'Muy difíciles'}
                  </span>
                  <span className="text-xs" style={{ color: '#4ade80' }}>
                    {p.condIdeal ?? 'Ideales'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
