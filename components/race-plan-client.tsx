'use client';

import { useState } from 'react';
import { ObjectiveCards } from '@/components/objective-cards';
import { RaceTable } from '@/components/race-table';
import { PaceChart } from '@/components/pace-chart';
import { CourseMap } from '@/components/course-map';
import type { TripleObjectivePlan, GpxPoint } from '@/lib/engine/types';

type Objective = 'forecast' | 'target' | 'consensus';

interface RacePlanClientProps {
  plan: TripleObjectivePlan;
  mapPoints: GpxPoint[];
  distanceKm: number;
}

export function RacePlanClient({ plan, mapPoints, distanceKm }: RacePlanClientProps) {
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
      <CourseMap
        points={mapPoints}
        distanceKm={distanceKm}
        splits={activePlan.splits}
        avgPace={activePlan.prediction.paceSecondsPerKm}
      />
      <PaceChart
        splits={activePlan.splits}
        avgPace={activePlan.prediction.paceSecondsPerKm}
      />
    </>
  );
}
