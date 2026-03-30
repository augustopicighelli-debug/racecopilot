import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AggregatedWeather } from '@/lib/engine/types';

interface WeatherCardProps {
  weather: AggregatedWeather;
}

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(deg / 45) % 8;
  return dirs[index];
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const tempEnd = weather.temperatureEnd;
  const windDir = windDirectionLabel(weather.windDirectionDeg);

  const confidenceVariant =
    weather.sourceAgreement === 'high' ? 'success' :
    weather.sourceAgreement === 'medium' ? 'warning' : 'destructive';

  const confidenceLabel =
    weather.sourceAgreement === 'high' ? 'Alta' :
    weather.sourceAgreement === 'medium' ? 'Media' : 'Baja';

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {weather.temperature <= 5 ? '🥶' :
               weather.temperature <= 14 ? '🌤️' :
               weather.temperature <= 22 ? '☀️' : '🔥'}
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {weather.temperature}°C → {tempEnd ?? '?'}°C
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Largada → Meta
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={confidenceVariant}>
              Confianza {confidenceLabel}
            </Badge>
            {weather.daysUntilRace > 7 && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Faltan {weather.daysUntilRace} dias
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold tabular-nums">{weather.humidity}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">Humedad</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{weather.windSpeedKmh} km/h</p>
            <p className="text-xs text-[var(--muted-foreground)]">Viento</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{windDir}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Direccion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
