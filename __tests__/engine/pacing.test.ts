import { describe, it, expect } from 'vitest';
import { generateSplits } from '../../lib/engine/pacing';
import type { CourseProfile, AggregatedWeather } from '../../lib/engine/types';
import { buildFlatProfile } from '../../lib/engine/elevation';

const calmWeather: AggregatedWeather = {
  temperature: 15, humidity: 50, windSpeedKmh: 0,
  windDirectionDeg: 0, sourcesCount: 3, sourceAgreement: 'high', daysUntilRace: 1,
};

describe('generateSplits', () => {
  it('produces uniform splits on flat course with no wind', () => {
    const profile = buildFlatProfile(10);
    const splits = generateSplits(3000, profile, calmWeather);
    expect(splits.length).toBe(10);
    splits.forEach(s => {
      expect(s.paceSecondsPerKm).toBeCloseTo(300, 0);
    });
  });

  it('cumulative time sums to total for integer distance', () => {
    const profile = buildFlatProfile(10);
    const splits = generateSplits(3000, profile, calmWeather);
    const lastSplit = splits[splits.length - 1];
    expect(lastSplit.cumulativeTimeSeconds).toBeCloseTo(3000, 0);
  });

  it('cumulative time sums to total for fractional distance (21.1K)', () => {
    const profile = buildFlatProfile(21.1);
    const splits = generateSplits(6300, profile, calmWeather);
    const lastSplit = splits[splits.length - 1];
    expect(lastSplit.cumulativeTimeSeconds).toBeCloseTo(6300, 0);
  });

  it('slows down on uphills and speeds up on downhills', () => {
    const profile: CourseProfile = {
      distanceKm: 5, totalElevationGain: 50, totalElevationLoss: 50, hasGpx: true,
      segments: [
        { kmIndex: 0, startDistance: 0, endDistance: 1000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 1, startDistance: 1000, endDistance: 2000, elevationGain: 50, elevationLoss: 0, avgGradientPercent: 5, bearing: 0 },
        { kmIndex: 2, startDistance: 2000, endDistance: 3000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 3, startDistance: 3000, endDistance: 4000, elevationGain: 0, elevationLoss: 50, avgGradientPercent: -5, bearing: 0 },
        { kmIndex: 4, startDistance: 4000, endDistance: 5000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
      ],
    };
    const splits = generateSplits(1500, profile, calmWeather);
    expect(splits[1].paceSecondsPerKm).toBeGreaterThan(splits[0].paceSecondsPerKm);
    expect(splits[3].paceSecondsPerKm).toBeLessThan(splits[0].paceSecondsPerKm);
  });

  it('adjusts for hot weather', () => {
    const profile = buildFlatProfile(10);
    const hotWeather: AggregatedWeather = { ...calmWeather, temperature: 30, humidity: 75 };
    const coolSplits = generateSplits(3000, profile, calmWeather);
    const hotSplits = generateSplits(3000, profile, hotWeather);
    expect(hotSplits[0].paceSecondsPerKm).toBeGreaterThanOrEqual(coolSplits[0].paceSecondsPerKm);
  });

  it('adjusts for headwind on segment', () => {
    const profile: CourseProfile = {
      distanceKm: 2, totalElevationGain: 0, totalElevationLoss: 0, hasGpx: true,
      segments: [
        { kmIndex: 0, startDistance: 0, endDistance: 1000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 1, startDistance: 1000, endDistance: 2000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 180 },
      ],
    };
    const windyWeather: AggregatedWeather = { ...calmWeather, windSpeedKmh: 25, windDirectionDeg: 0 };
    const splits = generateSplits(600, profile, windyWeather);
    expect(splits[0].paceSecondsPerKm).toBeGreaterThan(splits[1].paceSecondsPerKm);
  });
});
