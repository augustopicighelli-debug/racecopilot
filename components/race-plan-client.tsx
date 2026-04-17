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

      {/* 1. Selector de objetivo — siempre primero */}
      <ObjectiveCards plan={plan} selected={selected} onSelect={setSelected} />

      {/* 2. Plan km a km — el contenido accionable más importante */}
      <RaceTable
        splits={activePlan.splits}
        avgPace={activePlan.prediction.paceSecondsPerKm}
        hydration={activePlan.hydration}
        nutrition={activePlan.nutrition}
      />

      {/* 3. Barra de exigencia + clima — contexto del objetivo */}
      <ConditionsBar plan={plan} selected={selected} />
      <WeatherCard weather={activePlan.weather} />

      {/* 4. Fuel — qué tomar y cuándo */}
      <FuelTimeline hydration={activePlan.hydration} nutrition={activePlan.nutrition} />

      {/* 5. Gráfico de ritmo */}
      <PaceChart
        splits={activePlan.splits}
        avgPace={activePlan.prediction.paceSecondsPerKm}
      />

      {/* 6. Perfil de elevación */}
      <ElevationChart course={activePlan.course} />

      {/* 7. Cómo se construye el pronóstico (más técnico, al final) */}
      {waterfall && (
        <WaterfallChart
          waterfall={waterfall}
          weather={plan.forecast.weather}
          course={plan.forecast.course}
        />
      )}

      {/* 8. Mapa del recorrido (bonus visual, solo si hay GPX) */}
      {mapPoints.length > 0 && (
        <CourseMap
          points={mapPoints}
          distanceKm={distanceKm}
          splits={activePlan.splits}
          avgPace={activePlan.prediction.paceSecondsPerKm}
        />
      )}

      {/* 9. Disclaimer médico */}
      <Disclaimer />

    </div>
  );
}
