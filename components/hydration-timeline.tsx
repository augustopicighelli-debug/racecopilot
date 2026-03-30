import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { HydrationPlan } from '@/lib/engine/types';

interface HydrationTimelineProps {
  hydration: HydrationPlan;
}

export function HydrationTimeline({ hydration }: HydrationTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hidratacion</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Tasa sudoracion: {hydration.sweatRateMlPerHour} ml/h — Perdida total: {hydration.totalFluidLosseMl} ml
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hydration.events.map((e, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-14 text-right">
                <span className="font-mono text-sm">Km {e.km}</span>
              </div>
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400" />
              <div className="flex-1 text-sm">
                <span className="font-medium">{e.mlToDrink} ml</span>
                <span className="text-[var(--muted-foreground)] ml-2">
                  (acum: {e.cumulativeMl} ml)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
