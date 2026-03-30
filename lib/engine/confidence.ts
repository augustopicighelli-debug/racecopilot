import type { ConfidenceInputs } from './types';

export function calculateConfidence(inputs: ConfidenceInputs): number {
  const racesScore = raceCountScore(inputs.referenceRaceCount);
  const recencyScore = recencyScoreCalc(inputs.mostRecentRaceMonthsAgo, inputs.allRacesWithin6Months);
  const daysScore = daysUntilRaceScore(inputs.daysUntilRace);
  const weatherScore = weatherAgreementScore(inputs.weatherSourceAgreement);
  const gpxScore = inputs.hasGpx ? 100 : 75;

  // Intervals provide a second independent prediction source → boosts prediction confidence
  const intervalScore = inputs.hasIntervals ? 100 : 50;

  const confidence =
    racesScore * 0.15 +
    recencyScore * 0.10 +
    intervalScore * 0.10 +
    daysScore * 0.25 +
    weatherScore * 0.25 +
    gpxScore * 0.15;

  return Math.round(Math.min(100, Math.max(0, confidence)));
}

function raceCountScore(count: number): number {
  if (count >= 10) return 95;
  if (count >= 5) return 85;
  if (count >= 3) return 70;
  return 40;
}

function recencyScoreCalc(mostRecentMonths: number, allWithin6: boolean): number {
  // Primary window: 3 months. Beyond that, confidence drops fast.
  if (mostRecentMonths <= 1) return 100;
  if (mostRecentMonths <= 3) return allWithin6 ? 90 : 80;
  if (mostRecentMonths <= 6) return 60;
  if (mostRecentMonths <= 12) return 35;
  return 15;
}

function daysUntilRaceScore(days: number): number {
  if (days <= 2) return 95;
  if (days <= 7) return 80;
  if (days <= 14) return 60;
  if (days <= 30) return 40;
  return 25;
}

function weatherAgreementScore(agreement: 'high' | 'medium' | 'low'): number {
  switch (agreement) {
    case 'high': return 100;
    case 'medium': return 85;
    case 'low': return 60;
  }
}
