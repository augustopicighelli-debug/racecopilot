'use client';
import { Badge } from '@/components/ui/badge';
import { useUnits } from '@/lib/units';

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
  const { fmtElev, fmtDist } = useUnits();
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
        <Badge variant="outline">{fmtDist(distanceKm)}</Badge>
        <Badge variant="outline">D+ {fmtElev(elevationGain)}</Badge>
        <Badge variant="outline">D- {fmtElev(elevationLoss)}</Badge>
        {hasGpx && <Badge variant="success">GPX</Badge>}
        <Badge variant={confidenceVariant}>Confianza {confidence}%</Badge>
      </div>
    </header>
  );
}
