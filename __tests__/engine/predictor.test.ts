import { describe, it, expect } from 'vitest';
import { predictTime, fitExponent } from '../../lib/engine/predictor';
import type { ReferenceRace } from '../../lib/engine/types';

describe('fitExponent', () => {
  it('returns ability-scaled default with only 1 reference race', () => {
    // 3000s / 10km = 300 s/km (5:00/km) → competitive → 1.10
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    ];
    expect(fitExponent(races)).toBeCloseTo(1.10, 2);

    // Fast runner: 2000s / 10km = 200 s/km (3:20/km) → elite → 1.06
    const fastRaces: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 2000, date: '2026-03-01', type: 'race' },
    ];
    expect(fitExponent(fastRaces)).toBeCloseTo(1.06, 2);
  });

  it('fits exponent from 2 races at different distances', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
      { distanceKm: 21.1, timeSeconds: 6720, date: '2026-02-15', type: 'race' },
    ];
    const exp = fitExponent(races);
    expect(exp).toBeGreaterThan(1.0);
    expect(exp).toBeLessThan(1.2);
  });

  it('weights recent races more heavily', () => {
    const racesRecentFast: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 2800, date: '2026-03-01', type: 'race' },
      { distanceKm: 10, timeSeconds: 3200, date: '2025-06-01', type: 'race' },
      { distanceKm: 21.1, timeSeconds: 6720, date: '2026-02-01', type: 'race' },
    ];
    const racesRecentSlow: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3200, date: '2026-03-01', type: 'race' },
      { distanceKm: 10, timeSeconds: 2800, date: '2025-06-01', type: 'race' },
      { distanceKm: 21.1, timeSeconds: 6720, date: '2026-02-01', type: 'race' },
    ];
    const expFast = fitExponent(racesRecentFast);
    const expSlow = fitExponent(racesRecentSlow);
    expect(expFast).not.toBeCloseTo(expSlow, 2);
  });
});

describe('predictTime', () => {
  it('predicts 21K from a 10K using ability-scaled exponent', () => {
    // 5:00/km runner → exponent 1.10 → prediction is higher than with 1.06
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    ];
    const prediction = predictTime(races, 21.1);
    expect(prediction).toBeGreaterThan(6500);
    expect(prediction).toBeLessThan(7200);
  });

  it('predicts 42K from multiple references', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
      { distanceKm: 21.1, timeSeconds: 6500, date: '2026-02-15', type: 'race' },
    ];
    const prediction = predictTime(races, 42.195);
    expect(prediction).toBeGreaterThan(12600);
    expect(prediction).toBeLessThan(13800);
  });

  it('handles custom distances like 25K', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    ];
    const prediction = predictTime(races, 25);
    expect(prediction).toBeGreaterThan(7500);
    expect(prediction).toBeLessThan(8500);
  });

  it('adjusts prediction upward with higher weekly km', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    ];
    const base = predictTime(races, 42.195);
    const withVolume = predictTime(races, 42.195, { weeklyKm: 100 });
    expect(withVolume).toBeLessThan(base);
  });
});
