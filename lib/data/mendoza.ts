import type { RunnerProfile, AggregatedWeather, PacingStrategyConfig } from '@/lib/engine/types';

export const runner: RunnerProfile = {
  weightKg: 84,
  heightCm: 183,
  sweatLevel: 'high',
  maxHeartRate: 187,
  referenceRaces: [
    {
      distanceKm: 10.04,
      timeSeconds: 45 * 60 + 20,
      date: '2026-03-01',
      type: 'race',
      avgHeartRate: 170,
      temperatureC: 22,
      humidityPercent: 70,
    },
  ],
  weeklyKm: 50.13,
  vam: 247,
  intervals: [
    {
      distanceM: 2000,
      reps: 2,
      paceSecondsPerKm: 4 * 60 + 27,
      date: '2026-03-17',
      avgHeartRate: 175,
      temperatureC: 21,
      humidityPercent: 74,
    },
    {
      distanceM: 1000,
      reps: 6,
      paceSecondsPerKm: 4 * 60 + 24,
      date: '2026-02-20',
      avgHeartRate: 176,
      temperatureC: 24,
      humidityPercent: 80,
    },
  ],
  nutritionProducts: [
    { name: 'Energy Race Maervyck', carbsGrams: 27, sodiumMg: 111, caffeineMg: 0, type: 'gel' },
    { name: 'Nutremax Pro Salts', carbsGrams: 0, sodiumMg: 215, caffeineMg: 0, type: 'salt_pill' },
  ],
};

export const weather: AggregatedWeather = {
  temperature: 8,
  temperatureEnd: 18,
  humidity: 45,
  windSpeedKmh: 10,
  windDirectionDeg: 180,
  sourcesCount: 1,
  sourceAgreement: 'low',
  daysUntilRace: 34,
};

export const strategy: PacingStrategyConfig = {
  type: 'negative',
  segments: 3,
  deltaSecondsPerKm: 5,
};

export const raceConfig = {
  name: 'Maratón de Mendoza',
  date: '2026-05-03',
  distanceKm: 42.195,
  gpxPath: './data/mendoza-maraton.gpx',
  targetTime: 3 * 3600 + 30 * 60,
  breakfastHoursAgo: 3,
};
