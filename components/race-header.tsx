import { Badge } from '@/components/ui/badge';

interface RaceHeaderProps {
  name: string;
  date: string;
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  hasGpx: boolean;
  confidence: number;
}

export function RaceHeader({
  name,
  date,
  distanceKm,
  elevationGain,
  elevationLoss,
  hasGpx,
  confidence,
}: RaceHeaderProps) {
  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const confidenceVariant =
    confidence >= 70 ? 'success' : confidence >= 50 ? 'warning' : 'destructive';

  return (
    <header className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
      <p className="text-[var(--muted-foreground)] capitalize">{dateFormatted}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{distanceKm} km</Badge>
        <Badge variant="outline">D+ {Math.round(elevationGain)}m</Badge>
        <Badge variant="outline">D- {Math.round(elevationLoss)}m</Badge>
        {hasGpx && <Badge variant="success">GPX</Badge>}
        <Badge variant={confidenceVariant}>Confianza {confidence}%</Badge>
      </div>
    </header>
  );
}
