import { readFileSync } from 'fs';
import { generateRacePlan, buildElevationProfile, parseGpx } from '@/lib/engine';
import { runner, weather, strategy, raceConfig } from '@/lib/data/mendoza';
import { RaceHeader } from '@/components/race-header';
import { WaterfallChart } from '@/components/waterfall-chart';
import { ElevationChart } from '@/components/elevation-chart';
import { Disclaimer } from '@/components/disclaimer';
import { RacePlanClient } from '@/components/race-plan-client';

export default function Home() {
  const gpxContent = readFileSync(raceConfig.gpxPath, 'utf-8');
  const gpxPoints = parseGpx(gpxContent);
  const course = buildElevationProfile(gpxPoints, raceConfig.distanceKm);

  const targetPace = raceConfig.targetTime / raceConfig.distanceKm;

  const plan = generateRacePlan({
    runner,
    course,
    weather,
    targetPacePerKm: targetPace,
    breakfastHoursAgo: raceConfig.breakfastHoursAgo,
    pacingStrategy: strategy,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <RaceHeader
        name={raceConfig.name}
        date={raceConfig.date}
        distanceKm={course.distanceKm}
        elevationGain={course.totalElevationGain}
        elevationLoss={course.totalElevationLoss}
        hasGpx={course.hasGpx}
        confidence={plan.forecast.confidence}
      />
      {plan.forecast.waterfall && (
        <WaterfallChart waterfall={plan.forecast.waterfall} weather={weather} course={course} />
      )}
      <RacePlanClient plan={plan} />
      <ElevationChart course={course} />
      <Disclaimer />
    </main>
  );
}
