import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NutritionPlan } from '@/lib/engine/types';

interface NutritionTimelineProps {
  nutrition: NutritionPlan;
}

export function NutritionTimeline({ nutrition }: NutritionTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutricion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nutrition.preRaceGel && (
            <div className="flex items-center gap-3 pb-2 border-b border-[var(--border)]/50">
              <div className="flex-shrink-0 w-14 text-right">
                <span className="font-mono text-sm text-amber-400">PRE</span>
              </div>
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400" />
              <div className="flex-1 text-sm">
                <span className="font-medium">{nutrition.preRaceGel.product.name}</span>
                <span className="text-[var(--muted-foreground)] ml-2">
                  {nutrition.preRaceGel.carbsGrams}g carbos
                </span>
              </div>
            </div>
          )}
          {nutrition.events.map((e, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-14 text-right">
                <span className="font-mono text-sm">Km {e.km}</span>
              </div>
              <div
                className={`flex-shrink-0 w-2 h-2 rounded-full ${
                  e.product.type === 'gel' ? 'bg-amber-400' : 'bg-pink-400'
                }`}
              />
              <div className="flex-1 text-sm">
                <span className="font-medium">{e.product.name}</span>
                <div className="flex gap-2 mt-0.5">
                  {e.carbsGrams > 0 && (
                    <Badge variant="outline">{e.carbsGrams}g carbos</Badge>
                  )}
                  {e.sodiumMg > 0 && (
                    <Badge variant="outline">{e.sodiumMg}mg sodio</Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">~{e.minutesSinceStart}min</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
