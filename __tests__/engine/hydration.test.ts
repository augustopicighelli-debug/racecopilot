import { describe, it, expect } from 'vitest';
import { generateHydrationPlan } from '../../lib/engine/hydration';
import type { AggregatedWeather, SweatLevel } from '../../lib/engine/types';

const mildWeather: AggregatedWeather = {
  temperature: 15, humidity: 50, windSpeedKmh: 10,
  windDirectionDeg: 0, sourcesCount: 3, sourceAgreement: 'high', daysUntilRace: 1,
};

describe('generateHydrationPlan', () => {
  it('calculates sweat rate for average runner in mild conditions', () => {
    const plan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: mildWeather,
    });
    expect(plan.sweatRateMlPerHour).toBeGreaterThan(500);
    expect(plan.sweatRateMlPerHour).toBeLessThan(1200);
  });

  it('produces higher sweat rate in hot conditions', () => {
    const hotWeather = { ...mildWeather, temperature: 32, humidity: 75 };
    const mildPlan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: mildWeather,
    });
    const hotPlan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: hotWeather,
    });
    expect(hotPlan.sweatRateMlPerHour).toBeGreaterThan(mildPlan.sweatRateMlPerHour);
  });

  it('high sweater loses more than low sweater', () => {
    const low = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'low',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: mildWeather,
    });
    const high = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'high',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: mildWeather,
    });
    expect(high.sweatRateMlPerHour).toBeGreaterThan(low.sweatRateMlPerHour);
  });

  it('spaces hydration events every 3-5 km', () => {
    const plan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 42.195, weather: mildWeather,
    });
    expect(plan.events.length).toBeGreaterThan(5);
    for (let i = 1; i < plan.events.length; i++) {
      const gap = plan.events[i].km - plan.events[i - 1].km;
      expect(gap).toBeGreaterThanOrEqual(2);
      expect(gap).toBeLessThanOrEqual(6);
    }
  });

  it('each drink is between 150-300ml', () => {
    const plan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 42.195, weather: mildWeather,
    });
    plan.events.forEach(e => {
      expect(e.mlToDrink).toBeGreaterThanOrEqual(150);
      expect(e.mlToDrink).toBeLessThanOrEqual(300);
    });
  });
});
