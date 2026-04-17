'use client';

import { useState } from 'react';
import { ObjectiveCards } from '@/components/objective-cards';
import { ConditionsBar } from '@/components/conditions-bar';
import { RaceTable } from '@/components/race-table';
import { PaceChart } from '@/components/pace-chart';
import { CourseMap } from '@/components/course-map';
import { WeatherCard } from '@/components/weather-card';
import { WaterfallChart } from '@/components/waterfall-chart';
import { ElevationChart } from '@/components/elevation-chart';
import { FuelTimeline } from '@/components/fuel-timeline';
import { Disclaimer } from '@/components/disclaimer';
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
    : selected === 'target'  ? plan.target   ?? plan.forecast
    : plan.forecast;

  // El waterfall solo existe en el plan forecast
  const waterfall = plan.forecast.waterfall;

  return (
    <div className="space-y-4">

      {/* 1. Selector de objetivo (Pronóstico / Target / Consenso) */}
      <ObjectiveCards plan={plan} selected={selected} onSelect={setSelected} />

      {/* 2. Barra de condiciones — full-width, se mueve con el selector */}
      <ConditionsBar plan={plan} selected={selected} weather={activePlan.weather} />

      {/* 3. Clima detallado */}
      <WeatherCard weather={activePlan.weather} />

      {/* 4. Cómo se construye el pronóstico (solo para forecast) */}
      {waterfall && (
        <WaterfallChart
          waterfall={waterfall}
          weather={plan.forecast.weather}
          course={plan.forecast.course}
        />
      )}

      {/* 5. Perfil de elevación del recorrido */}
      <ElevationChart course={activePlan.course} />

      {/* 6. Plan km a km con hidratación y nutrición integradas */}
      <RaceTable
        splits={activePlan.splits}
        avgPace={activePlan.prediction.paceSecondsPerKm}
        hydration={activePlan.hydration}
        nutrition={activePlan.nutrition}
      />

      {/* 7. Gráfico de ritmo por km */}
      <PaceChart
        splits={activePlan.splits}
        avgPace={activePlan.prediction.paceSecondsPerKm}
      />

      {/* 8. Timeline unificado: agua + geles + pastillas */}
      <FuelTimeline hydration={activePlan.hydration} nutrition={activePlan.nutrition} />

      {/* 9. Mapa del recorrido (solo si hay GPX) */}
      {mapPoints.length > 0 && (
        <CourseMap
          points={mapPoints}
          distanceKm={distanceKm}
          splits={activePlan.splits}
          avgPace={activePlan.prediction.paceSecondsPerKm}
        />
      )}

      {/* 10. Disclaimer médico */}
      <Disclaimer />

    </div>
  );
}
