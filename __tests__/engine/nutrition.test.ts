import { describe, it, expect } from 'vitest';
import { generateNutritionPlan } from '../../lib/engine/nutrition';
import type { NutritionProduct } from '../../lib/engine/types';

const gel: NutritionProduct = {
  name: 'Mi gel', carbsGrams: 25, sodiumMg: 50, caffeineMg: 0, type: 'gel',
};
const saltPill: NutritionProduct = {
  name: 'Sal', carbsGrams: 0, sodiumMg: 250, caffeineMg: 0, type: 'salt_pill',
};

describe('generateNutritionPlan', () => {
  it('returns short race message for <75 min effort', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 4200, distanceKm: 10, paceSecondsPerKm: 420,
      products: [gel], sweatRateMlPerHour: 800, breakfastHoursAgo: 1,
    });
    expect(plan.isShortRace).toBe(true);
    expect(plan.shortRaceMessage).toBeDefined();
    expect(plan.events.length).toBe(0);
  });

  it('suggests pre-race gel when breakfast >2h ago even for short race', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 4200, distanceKm: 10, paceSecondsPerKm: 420,
      products: [gel], sweatRateMlPerHour: 800, breakfastHoursAgo: 3,
    });
    expect(plan.preRaceGel).toBeDefined();
    expect(plan.preRaceGel!.note).toContain('pre-carrera');
  });

  it('no pre-race gel when breakfast was recent', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 4200, distanceKm: 10, paceSecondsPerKm: 420,
      products: [gel], sweatRateMlPerHour: 800, breakfastHoursAgo: 1,
    });
    expect(plan.preRaceGel).toBeUndefined();
  });

  it('generates gel events for marathon (>75 min)', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 14400, distanceKm: 42.195, paceSecondsPerKm: 341,
      products: [gel, saltPill], sweatRateMlPerHour: 1000, breakfastHoursAgo: 3,
    });
    expect(plan.isShortRace).toBe(false);
    expect(plan.events.length).toBeGreaterThan(5);
    expect(plan.totalCarbsNeeded).toBeGreaterThan(200);
  });

  it('includes salt pills based on sweat rate', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 14400, distanceKm: 42.195, paceSecondsPerKm: 341,
      products: [gel, saltPill], sweatRateMlPerHour: 1500, breakfastHoursAgo: 3,
    });
    const saltEvents = plan.events.filter(e => e.product.type === 'salt_pill');
    expect(saltEvents.length).toBeGreaterThan(0);
  });

  it('always includes disclaimer', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 14400, distanceKm: 42.195, paceSecondsPerKm: 341,
      products: [gel], sweatRateMlPerHour: 800, breakfastHoursAgo: 3,
    });
    expect(plan.disclaimer).toContain('médico');
  });

  it('first gel around 45 minutes', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 14400, distanceKm: 42.195, paceSecondsPerKm: 341,
      products: [gel], sweatRateMlPerHour: 800, breakfastHoursAgo: 3,
    });
    const firstGel = plan.events[0];
    expect(firstGel.minutesSinceStart).toBeGreaterThanOrEqual(40);
    expect(firstGel.minutesSinceStart).toBeLessThanOrEqual(50);
  });
});
