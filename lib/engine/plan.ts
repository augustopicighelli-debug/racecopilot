import { predictTime } from './predictor';
import { estimateMarathonPaceFromIntervals } from './intervals';
import { calculateConsensus } from './consensus';
import { generateSplits } from './pacing';
import { generateHydrationPlan } from './hydration';
import { generateNutritionPlan } from './nutrition';
import { calculateConfidence } from './confidence';
import { windImpactPerKm } from './wind';
import type {
  RunnerProfile,
  CourseProfile,
  AggregatedWeather,
  Prediction,
  RacePlan,
  RaceWaterfall,
  TripleObjectivePlan,
  ConfidenceInputs,
  PacingStrategyConfig,
} from './types';

/**
 * Climate adjustment factor based on Ely et al. 2007.
 * Uses average temperature across the race (start to end).
 * Humidity impact is multiplicative with temperature — humidity matters
 * more when it's hot (Ely et al. used WBGT, not independent components).
 */
export function computeClimateFactor(weather: AggregatedWeather, raceTimeHours: number): number {
  const tempEnd = weather.temperatureEnd ?? weather.temperature + 1.5 * raceTimeHours;
  const avgTemp = (weather.temperature + tempEnd) / 2;
  const tempPenalty = Math.max(0, (avgTemp - 12) * 0.004);
  // Humidity scales with how far above optimal temp we are (multiplicative interaction)
  const tempExcess = Math.max(0, avgTemp - 12);
  const humidityPenalty = Math.max(0, (weather.humidity - 50) * 0.001) * (tempExcess / 10);
  return 1 + tempPenalty + humidityPenalty;
}

export interface GenerateRacePlanInput {
  runner: RunnerProfile;
  course: CourseProfile;
  weather: AggregatedWeather;
  targetPacePerKm?: number;
  breakfastHoursAgo: number;
  pacingStrategy?: PacingStrategyConfig;
  aidStationKms?: number[];  // custom aid station positions (e.g. [5, 10, 15, 20, ...])
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
    hasIntervals: (runner.intervals ?? []).length > 0,
  };
}

function buildSinglePlan(
  prediction: Prediction,
  runner: RunnerProfile,
  course: CourseProfile,
  weather: AggregatedWeather,
  breakfastHoursAgo: number,
  confidenceInputs: ConfidenceInputs,
  pacingStrategy?: PacingStrategyConfig,
  aidStationKms?: number[]
): RacePlan {
  // Recalcular temperatureEnd con la duración real de ESTE plan.
  // Largada fija a las 8h; llegada = 8h + duración del plan.
  const START_HOUR = 8;
  const durationHours = prediction.timeSeconds / 3600;
  const endHour = Math.min(Math.round(START_HOUR + durationHours), 22);
  const endEntry = weather.hourlyTemps?.find(e => e.hour === endHour);
  const weatherForPlan: AggregatedWeather = endEntry
    ? { ...weather, temperatureEnd: endEntry.tempC }
    : weather;

  const splits = generateSplits(prediction.timeSeconds, course, weatherForPlan, pacingStrategy);

  const hydration = generateHydrationPlan({
    weightKg: runner.weightKg,
    heightCm: runner.heightCm,
    sweatLevel: runner.sweatLevel,
    paceSecondsPerKm: prediction.paceSecondsPerKm,
    distanceKm: course.distanceKm,
    weather: weatherForPlan,
    aidStationKms,
  });

  const hydrationKms = hydration.events.map(e => e.km);

  const nutrition = generateNutritionPlan({
    totalTimeSeconds: prediction.timeSeconds,
    distanceKm: course.distanceKm,
    paceSecondsPerKm: prediction.paceSecondsPerKm,
    products: runner.nutritionProducts,
    sweatRateMlPerHour: hydration.sweatRateMlPerHour,
    sweatLevel: runner.sweatLevel,
    breakfastHoursAgo,
    hydrationKms,
  });

  const confidence = calculateConfidence(confidenceInputs);

  return {
    prediction,
    splits,
    hydration,
    nutrition,
    confidence,
    course,
    weather: weatherForPlan,  // incluye temperatureEnd ajustado a la duración de este plan
  };
}

export function generateRacePlan(input: GenerateRacePlanInput): TripleObjectivePlan {
  const { runner, course, weather, targetPacePerKm, breakfastHoursAgo, pacingStrategy, aidStationKms } = input;

  // Step 1: Predict base time using Riegel (assumes neutral conditions)
  // Race times are normalized to 12°C/50%hum and max effort before extrapolating
  const riegelTimeSeconds = predictTime(
    runner.referenceRaces,
    course.distanceKm,
    { weeklyKm: runner.weeklyKm, maxHeartRate: runner.maxHeartRate, restingHeartRate: runner.restingHeartRate }
  );

  // Step 1b: Predict from intervals (VDOT-based, independent estimate)
  // Interval paces normalized to neutral conditions and max effort
  const intervalPace = estimateMarathonPaceFromIntervals(runner.intervals, runner.maxHeartRate, runner.restingHeartRate);
  const intervalTimeSeconds = intervalPace ? intervalPace * course.distanceKm : undefined;

  // Step 1c: Blend Riegel + intervals
  // With 1 race: Riegel is weak, lean more on intervals (60/40)
  // With 2+ races: Riegel is stronger, lean more on Riegel (70/30)
  let baseTimeSeconds: number;
  if (intervalTimeSeconds) {
    const riegelWeight = runner.referenceRaces.length >= 2 ? 0.7 : 0.4;
    baseTimeSeconds = riegelTimeSeconds * riegelWeight + intervalTimeSeconds * (1 - riegelWeight);
  } else {
    baseTimeSeconds = riegelTimeSeconds;
  }

  // Step 1d: Apply climate adjustment (Ely et al. 2007) using avg temp across race
  const baseHours = baseTimeSeconds / 3600;
  const climateFactor = computeClimateFactor(weather, baseHours);
  const climateAdjustment = baseTimeSeconds * climateFactor - baseTimeSeconds;

  // Step 1e: Pre-compute elevation adjustment from course segments.
  // Uses same formula as pacing.ts: +6 s/km per 1% uphill, -3 s/km per 1% downhill.
  // This gives a global time correction (not just pace redistribution), so the
  // waterfall components add up correctly: base + climate + elevation + wind = final.
  let elevationAdjustment = 0;
  for (const seg of course.segments) {
    const segLengthM  = seg.endDistance - seg.startDistance;
    const segLengthKm = segLengthM / 1000;
    if (segLengthM <= 0) continue;
    const uphillGrad   = (seg.elevationGain / segLengthM) * 100;
    const downhillGrad = (seg.elevationLoss / segLengthM) * 100;
    elevationAdjustment += (uphillGrad * 6 + downhillGrad * -3) * segLengthKm;
  }

  // Step 1f: Pre-compute wind adjustment (only for GPX routes with reliable forecast ≤3 days)
  let windAdjustment = 0;
  if (course.hasGpx && weather.daysUntilRace <= 3 && weather.windSpeedKmh > 0) {
    for (const seg of course.segments) {
      const segLengthKm = (seg.endDistance - seg.startDistance) / 1000;
      windAdjustment += windImpactPerKm(seg.bearing, weather.windSpeedKmh, weather.windDirectionDeg) * segLengthKm;
    }
  }

  // Final forecast = base + all adjustments. Splits are normalized to this total.
  let forecastTimeSeconds = baseTimeSeconds + climateAdjustment + elevationAdjustment + windAdjustment;

  const forecastPaceSecondsPerKm = forecastTimeSeconds / course.distanceKm;

  const forecastPrediction: Prediction = {
    timeSeconds: forecastTimeSeconds,
    paceSecondsPerKm: forecastPaceSecondsPerKm,
    type: 'forecast',
  };

  // Step 2: Build confidence inputs (shared across plans)
  const confidenceInputs = buildConfidenceInputs(runner, weather, course);

  // Step 3: Build forecast plan (splits are generated from corrected total time)
  const forecast = buildSinglePlan(
    forecastPrediction,
    runner,
    course,
    weather,
    breakfastHoursAgo,
    confidenceInputs,
    pacingStrategy,
    aidStationKms
  );

  // Step 3b: Waterfall — components now add up correctly
  forecast.waterfall = {
    baseTimeSeconds,
    riegelTimeSeconds,
    intervalTimeSeconds,
    climateAdjustment,
    elevationAdjustment,
    windAdjustment,
    finalTimeSeconds: forecastTimeSeconds,
  };

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
    confidenceInputs,
    pacingStrategy,
    aidStationKms
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
    confidenceInputs,
    pacingStrategy,
    aidStationKms
  );

  return { forecast, target, consensus };
}
