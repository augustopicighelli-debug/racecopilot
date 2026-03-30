'use client';

import { useState } from 'react';
import { ObjectiveCards } from '@/components/objective-cards';
import { SplitsTable } from '@/components/splits-table';
import { HydrationTimeline } from '@/components/hydration-timeline';
import { NutritionTimeline } from '@/components/nutrition-timeline';
import type { TripleObjectivePlan } from '@/lib/engine/types';

type Objective = 'forecast' | 'target' | 'consensus';

interface RacePlanClientProps {
  plan: TripleObjectivePlan;
}

export function RacePlanClient({ plan }: RacePlanClientProps) {
  const [selected, setSelected] = useState<Objective>(plan.consensus ? 'consensus' : 'forecast');

  const activePlan =
    selected === 'consensus' ? plan.consensus ?? plan.forecast
    : selected === 'target' ? plan.target ?? plan.forecast
    : plan.forecast;

  return (
    <>
      <ObjectiveCards plan={plan} selected={selected} onSelect={setSelected} />
      <SplitsTable splits={activePlan.splits} avgPace={activePlan.prediction.paceSecondsPerKm} />
      <HydrationTimeline hydration={activePlan.hydration} />
      <NutritionTimeline nutrition={activePlan.nutrition} />
    </>
  );
}
