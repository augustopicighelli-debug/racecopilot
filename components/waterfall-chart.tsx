'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatTime, formatDelta } from '@/lib/format';
import type { RaceWaterfall, AggregatedWeather, CourseProfile } from '@/lib/engine/types';

interface WaterfallChartProps {
  waterfall: RaceWaterfall;
  weather: AggregatedWeather;
  course: CourseProfile;
}

interface WaterfallStep {
  label: string;
  value: string;
  seconds: number;
  type: 'base' | 'adjustment' | 'total';
}

export function WaterfallChart({ waterfall, weather, course }: WaterfallChartProps) {
  const steps: WaterfallStep[] = [];

  if (waterfall.riegelTimeSeconds) {
    steps.push({
      label: 'Modelo (carreras)',
      value: formatTime(waterfall.riegelTimeSeconds),
      seconds: waterfall.riegelTimeSeconds,
      type: 'base',
    });
  }
  if (waterfall.intervalTimeSeconds) {
    steps.push({
      label: 'Intervalos (pasadas)',
      value: formatTime(waterfall.intervalTimeSeconds),
      seconds: waterfall.intervalTimeSeconds,
      type: 'base',
    });
  }
  steps.push({
    label: 'Blend base',
    value: formatTime(waterfall.baseTimeSeconds),
    seconds: waterfall.baseTimeSeconds,
    type: 'base',
  });
  steps.push({
    label: `Clima (${weather.temperature}°→${weather.temperatureEnd ?? '?'}°C)`,
    value: formatDelta(waterfall.climateAdjustment),
    seconds: waterfall.climateAdjustment,
    type: 'adjustment',
  });
  steps.push({
    label: `Elevacion (${Math.round(course.totalElevationGain)}↑ ${Math.round(course.totalElevationLoss)}↓)`,
    value: formatDelta(waterfall.elevationAdjustment),
    seconds: waterfall.elevationAdjustment,
    type: 'adjustment',
  });
  steps.push({
    label: `Viento (${weather.windSpeedKmh}km/h)`,
    value: formatDelta(waterfall.windAdjustment),
    seconds: waterfall.windAdjustment,
    type: 'adjustment',
  });
  steps.push({
    label: 'Pronostico final',
    value: formatTime(waterfall.finalTimeSeconds),
    seconds: waterfall.finalTimeSeconds,
    type: 'total',
  });

  // For adjustment bars, find max absolute adjustment for scaling
  const adjustments = steps.filter(s => s.type === 'adjustment');
  const maxAdj = Math.max(...adjustments.map(s => Math.abs(s.seconds)), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Como se construye tu pronostico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm ${step.type === 'total' ? 'font-bold text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                  {step.label}
                </span>
                <span className={`font-mono text-sm ${
                  step.type === 'total' ? 'text-[var(--primary)] font-bold' :
                  step.type === 'adjustment' && step.seconds > 0 ? 'text-red-400' :
                  step.type === 'adjustment' && step.seconds < 0 ? 'text-emerald-400' : ''
                }`}>
                  {step.value}
                </span>
              </div>
              {step.type === 'adjustment' && (
                <div className="flex items-center h-4">
                  <div className="flex-1 relative h-full flex items-center">
                    {/* Center line */}
                    <div className="absolute left-1/2 h-full w-px bg-[var(--border)]" />
                    {/* Bar */}
                    {step.seconds !== 0 && (
                      <div
                        className={`absolute h-3 rounded-sm ${
                          step.seconds > 0 ? 'bg-red-400/60' : 'bg-emerald-400/60'
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(step.seconds) / maxAdj * 45, 45)}%`,
                          ...(step.seconds > 0
                            ? { left: '50%' }
                            : { right: '50%' }),
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              {step.type === 'total' && (
                <div className="h-px bg-[var(--primary)]/30 mt-1" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
