import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatTime, formatDelta } from '@/lib/format';
import type { RaceWaterfall, AggregatedWeather, CourseProfile } from '@/lib/engine/types';

interface WaterfallChartProps {
  waterfall: RaceWaterfall;
  weather: AggregatedWeather;
  course: CourseProfile;
}

export function WaterfallChart({ waterfall, weather, course }: WaterfallChartProps) {
  const steps: { label: string; value: string; isTotal?: boolean }[] = [];

  if (waterfall.riegelTimeSeconds) {
    steps.push({ label: 'Riegel (carreras)', value: formatTime(waterfall.riegelTimeSeconds) });
  }
  if (waterfall.intervalTimeSeconds) {
    steps.push({ label: 'Intervalos (pasadas)', value: formatTime(waterfall.intervalTimeSeconds) });
  }
  steps.push({ label: 'Blend base', value: formatTime(waterfall.baseTimeSeconds) });
  steps.push({
    label: `Clima (${weather.temperature}\u00b0\u2192${weather.temperatureEnd ?? '?'}\u00b0C)`,
    value: formatDelta(waterfall.climateAdjustment),
  });
  steps.push({
    label: `Elevacion (${Math.round(course.totalElevationGain)}\u2191 ${Math.round(course.totalElevationLoss)}\u2193)`,
    value: formatDelta(waterfall.elevationAdjustment),
  });
  steps.push({
    label: `Viento (${weather.windSpeedKmh}km/h)`,
    value: formatDelta(waterfall.windAdjustment),
  });
  steps.push({
    label: 'Pronostico final',
    value: formatTime(waterfall.finalTimeSeconds),
    isTotal: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waterfall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex justify-between items-center py-1.5 px-2 rounded ${
                step.isTotal
                  ? 'bg-[var(--primary)]/10 font-bold border-t border-[var(--border)] mt-2 pt-3'
                  : ''
              }`}
            >
              <span className="text-sm text-[var(--muted-foreground)]">{step.label}</span>
              <span className={`font-mono text-sm ${step.isTotal ? 'text-[var(--primary)]' : ''}`}>
                {step.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
