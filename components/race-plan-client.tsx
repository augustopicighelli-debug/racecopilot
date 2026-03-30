'use client';

import { useState } from 'react';
import { ObjectiveCards } from '@/components/objective-cards';
import { RaceTable } from '@/components/race-table';
import { PaceChart } from '@/components/pace-chart';
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
      <RaceTable
        splits={activePlan.splits}
        avgPace={activePlan.prediction.paceSecondsPerKm}
        hydration={activePlan.hydration}
        nutrition={activePlan.nutrition}
      />
      <PaceChart
        splits={activePlan.splits}
        avgPace={activePlan.prediction.paceSecondsPerKm}
      />
    </>
  );
}
