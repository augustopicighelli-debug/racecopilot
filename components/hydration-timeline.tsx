'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUnits } from '@/lib/units';
import { useLang } from '@/lib/lang';
import type { HydrationPlan } from '@/lib/engine/types';

interface HydrationTimelineProps {
  hydration: HydrationPlan;
}

export function HydrationTimeline({ hydration }: HydrationTimelineProps) {
  const { fmtVol } = useUnits();
  const { t } = useLang();
  const p = t.plan;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{p.hydrationTitle}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          {p.sweatRateLabel}: {fmtVol(hydration.sweatRateMlPerHour)}/h
          {' — '}
          {p.totalLoss}: {fmtVol(hydration.totalFluidLosseMl)}
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
                <span className="font-medium">{fmtVol(e.mlToDrink)}</span>
                <span className="text-[var(--muted-foreground)] ml-2">
                  ({p.cumul}: {fmtVol(e.cumulativeMl)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
