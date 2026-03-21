import { describe, it, expect } from 'vitest';
import { generateRacePlan } from '../../lib/engine/plan';
import type { RunnerProfile, AggregatedWeather } from '../../lib/engine/types';
import { buildFlatProfile } from '../../lib/engine/elevation';

const runner: RunnerProfile = {
  weightKg: 70, heightCm: 175, sweatLevel: 'medium',
  referenceRaces: [
    { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    { distanceKm: 21.1, timeSeconds: 6500, date: '2026-02-15', type: 'race' },
  ],
  weeklyKm: 60,
  nutritionProducts: [
    { name: 'Gel', carbsGrams: 25, sodiumMg: 50, caffeineMg: 0, type: 'gel' },
    { name: 'Sal', carbsGrams: 0, sodiumMg: 250, caffeineMg: 0, type: 'salt_pill' },
  ],
};

const weather: AggregatedWeather = {
  temperature: 20, humidity: 60, windSpeedKmh: 10,
  windDirectionDeg: 180, sourcesCount: 3, sourceAgreement: 'high', daysUntilRace: 3,
};

describe('generateRacePlan', () => {
  it('generates complete plan without target (forecast only)', () => {
    const course = buildFlatProfile(21.1);
    const plan = generateRacePlan({ runner, course, weather, breakfastHoursAgo: 3 });
    expect(plan.forecast).toBeDefined();
    expect(plan.forecast.prediction.type).toBe('forecast');
    expect(plan.forecast.splits.length).toBeGreaterThan(0);
    expect(plan.forecast.hydration.events.length).toBeGreaterThan(0);
    expect(plan.forecast.nutrition.events.length).toBeGreaterThan(0);
    expect(plan.forecast.confidence).toBeGreaterThan(0);
    expect(plan.target).toBeUndefined();
    expect(plan.consensus).toBeUndefined();
  });

  it('generates triple objective when target is set', () => {
    const course = buildFlatProfile(21.1);
    const plan = generateRacePlan({ runner, course, weather, targetPacePerKm: 290, breakfastHoursAgo: 3 });
    expect(plan.forecast).toBeDefined();
    expect(plan.target).toBeDefined();
    expect(plan.consensus).toBeDefined();
    expect(plan.target!.prediction.type).toBe('target');
    expect(plan.consensus!.prediction.type).toBe('consensus');
  });

  it('10K short race has educational nutrition message', () => {
    const fastRunner: RunnerProfile = {
      ...runner,
      referenceRaces: [{ distanceKm: 10, timeSeconds: 2400, date: '2026-03-01', type: 'race' }],
    };
    const course = buildFlatProfile(10);
    const plan = generateRacePlan({ runner: fastRunner, course, weather, breakfastHoursAgo: 3 });
    expect(plan.forecast.nutrition.isShortRace).toBe(true);
  });

  it('all three plans have different paces', () => {
    const course = buildFlatProfile(42.195);
    const plan = generateRacePlan({ runner, course, weather, targetPacePerKm: 270, breakfastHoursAgo: 3 });
    const fPace = plan.forecast.prediction.paceSecondsPerKm;
    const tPace = plan.target!.prediction.paceSecondsPerKm;
    const cPace = plan.consensus!.prediction.paceSecondsPerKm;
    expect(fPace).not.toBe(tPace);
    expect(cPace).not.toBe(fPace);
  });
});
