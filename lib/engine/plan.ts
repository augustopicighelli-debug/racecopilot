import { predictTime } from './predictor';
import { calculateConsensus } from './consensus';
import { generateSplits } from './pacing';
import { generateHydrationPlan } from './hydration';
import { generateNutritionPlan } from './nutrition';
import { calculateConfidence } from './confidence';
import type {
  RunnerProfile,
  CourseProfile,
  AggregatedWeather,
  Prediction,
  RacePlan,
  TripleObjectivePlan,
  ConfidenceInputs,
} from './types';

export interface GenerateRacePlanInput {
  runner: RunnerProfile;
  course: CourseProfile;
  weather: AggregatedWeather;
  targetPacePerKm?: number;
  breakfastHoursAgo: number;
}

function buildConfidenceInputs(
  runner: RunnerProfile,
  weather: AggregatedWeather,
  course: CourseProfile
): ConfidenceInputs {
  const now = new Date();
  const races = runner.referenceRaces;

  const referenceRaceCount = races.length;

  // Most recent race in months ago
  const mostRecentRaceMonthsAgo =
    races.length > 0
      ? Math.min(
          ...races.map(r => {
            const raceDate = new Date(r.date);
            return (now.getTime() - raceDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          })
        )
      : 999;

  // All races within 6 months
  const allRacesWithin6Months =
    races.length > 0 &&
    races.every(r => {
      const raceDate = new Date(r.date);
      const monthsAgo = (now.getTime() - raceDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 6;
    });

  return {
    referenceRaceCount,
    mostRecentRaceMonthsAgo,
    allRacesWithin6Months,
    weatherSourceAgreement: weather.sourceAgreement,
    daysUntilRace: weather.daysUntilRace,
    hasGpx: course.hasGpx,
  };
}

function buildSinglePlan(
  prediction: Prediction,
  runner: RunnerProfile,
  course: CourseProfile,
  weather: AggregatedWeather,
  breakfastHoursAgo: number,
  confidenceInputs: ConfidenceInputs
): RacePlan {
  const splits = generateSplits(prediction.timeSeconds, course, weather);

  const hydration = generateHydrationPlan({
    weightKg: runner.weightKg,
    heightCm: runner.heightCm,
    sweatLevel: runner.sweatLevel,
    paceSecondsPerKm: prediction.paceSecondsPerKm,
    distanceKm: course.distanceKm,
    weather,
  });

  const nutrition = generateNutritionPlan({
    totalTimeSeconds: prediction.timeSeconds,
    distanceKm: course.distanceKm,
    paceSecondsPerKm: prediction.paceSecondsPerKm,
    products: runner.nutritionProducts,
    sweatRateMlPerHour: hydration.sweatRateMlPerHour,
    breakfastHoursAgo,
  });

  const confidence = calculateConfidence(confidenceInputs);

  return {
    prediction,
    splits,
    hydration,
    nutrition,
    confidence,
    course,
    weather,
  };
}

export function generateRacePlan(input: GenerateRacePlanInput): TripleObjectivePlan {
  const { runner, course, weather, targetPacePerKm, breakfastHoursAgo } = input;

  // Step 1: Predict time using predictor
  const forecastTimeSeconds = predictTime(
    runner.referenceRaces,
    course.distanceKm,
    { weeklyKm: runner.weeklyKm }
  );
  const forecastPaceSecondsPerKm = forecastTimeSeconds / course.distanceKm;

  const forecastPrediction: Prediction = {
    timeSeconds: forecastTimeSeconds,
    paceSecondsPerKm: forecastPaceSecondsPerKm,
    type: 'forecast',
  };

  // Step 2: Build confidence inputs (shared across plans)
  const confidenceInputs = buildConfidenceInputs(runner, weather, course);

  // Step 3: Build forecast plan
  const forecast = buildSinglePlan(
    forecastPrediction,
    runner,
    course,
    weather,
    breakfastHoursAgo,
    confidenceInputs
  );

  // Step 4: If no target, return forecast only
  if (targetPacePerKm === undefined) {
    return { forecast };
  }

  // Step 5: Build target plan
  const targetTimeSeconds = targetPacePerKm * course.distanceKm;
  const targetPrediction: Prediction = {
    timeSeconds: targetTimeSeconds,
    paceSecondsPerKm: targetPacePerKm,
    type: 'target',
  };

  const target = buildSinglePlan(
    targetPrediction,
    runner,
    course,
    weather,
    breakfastHoursAgo,
    confidenceInputs
  );

  // Step 6: Build consensus plan
  const consensusResult = calculateConsensus(
    forecastPaceSecondsPerKm,
    targetPacePerKm,
    course.distanceKm
  );

  const consensusPrediction: Prediction = {
    timeSeconds: consensusResult.timeSeconds,
    paceSecondsPerKm: consensusResult.paceSecondsPerKm,
    type: 'consensus',
    label: consensusResult.label,
  };

  const consensus = buildSinglePlan(
    consensusPrediction,
    runner,
    course,
    weather,
    breakfastHoursAgo,
    confidenceInputs
  );

  return { forecast, target, consensus };
}
