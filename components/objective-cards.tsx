'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime, formatPace } from '@/lib/format';
import type { TripleObjectivePlan } from '@/lib/engine/types';

type Objective = 'forecast' | 'target' | 'consensus';

interface ObjectiveCardsProps {
  plan: TripleObjectivePlan;
  selected: Objective;
  onSelect: (obj: Objective) => void;
}

export function ObjectiveCards({ plan, selected, onSelect }: ObjectiveCardsProps) {
  const objectives: { key: Objective; label: string; sublabel?: string; data?: typeof plan.forecast }[] = [
    { key: 'forecast', label: 'Pronostico', data: plan.forecast },
    ...(plan.target ? [{ key: 'target' as const, label: 'Target', data: plan.target }] : []),
    ...(plan.consensus
      ? [{
          key: 'consensus' as const,
          label: 'Consenso',
          sublabel: plan.consensus.prediction.label,
          data: plan.consensus,
        }]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {objectives.map(obj => {
        if (!obj.data) return null;
        const isSelected = selected === obj.key;
        return (
          <button key={obj.key} onClick={() => onSelect(obj.key)} className="text-left">
            <Card
              className={
                isSelected
                  ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]'
                  : 'opacity-60 hover:opacity-80 transition-opacity'
              }
            >
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-[var(--muted-foreground)]">
                  {obj.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {formatTime(obj.data.prediction.timeSeconds)}
                </p>
                <p className="text-lg font-semibold text-[var(--primary)] tabular-nums">
                  {formatPace(obj.data.prediction.paceSecondsPerKm)}
                </p>
                {obj.sublabel && (
                  <Badge variant="warning" className="mt-2">{obj.sublabel}</Badge>
                )}
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
