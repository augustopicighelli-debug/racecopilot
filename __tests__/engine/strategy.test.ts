import { describe, it, expect } from 'vitest';
import { computeStrategyDeltas, generateSplits } from '../../lib/engine/pacing';
import { buildFlatProfile } from '../../lib/engine/elevation';
import type { AggregatedWeather, CourseProfile, PacingStrategyConfig } from '../../lib/engine/types';

const calmWeather: AggregatedWeather = {
  temperature: 15, humidity: 50, windSpeedKmh: 0,
  windDirectionDeg: 0, sourcesCount: 3, sourceAgreement: 'high', daysUntilRace: 1,
};

describe('computeStrategyDeltas', () => {
  it('returns all zeros for even strategy', () => {
    const deltas = computeStrategyDeltas(10, { type: 'even', segments: 2, deltaSecondsPerKm: 5 });
    expect(deltas).toHaveLength(10);
    deltas.forEach(d => expect(d).toBe(0));
  });

  it('returns all zeros when no strategy provided', () => {
    const deltas = computeStrategyDeltas(10);
    expect(deltas).toHaveLength(10);
    deltas.forEach(d => expect(d).toBe(0));
  });

  it('negative split: first half slower, second half faster', () => {
    const deltas = computeStrategyDeltas(10, { type: 'negative', segments: 2, deltaSecondsPerKm: 5 });
    expect(deltas).toHaveLength(10);
    // First 5 km should be positive (slower), last 5 negative (faster)
    for (let i = 0; i < 5; i++) expect(deltas[i]).toBeGreaterThan(0);
    for (let i = 5; i < 10; i++) expect(deltas[i]).toBeLessThan(0);
  });

  it('positive split: first half faster, second half slower', () => {
    const deltas = computeStrategyDeltas(10, { type: 'positive', segments: 2, deltaSecondsPerKm: 5 });
    expect(deltas).toHaveLength(10);
    // First 5 km should be negative (faster), last 5 positive (slower)
    for (let i = 0; i < 5; i++) expect(deltas[i]).toBeLessThan(0);
    for (let i = 5; i < 10; i++) expect(deltas[i]).toBeGreaterThan(0);
  });

  it('negative split deltas are symmetric (zero-sum)', () => {
    const deltas = computeStrategyDeltas(10, { type: 'negative', segments: 2, deltaSecondsPerKm: 5 });
    const sum = deltas.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0, 5);
  });

  it('3 segments: negative split has slow-medium-fast progression', () => {
    const deltas = computeStrategyDeltas(9, { type: 'negative', segments: 3, deltaSecondsPerKm: 6 });
    // Seg 0 (km 0-2): +6, Seg 1 (km 3-5): 0, Seg 2 (km 6-8): -6
    expect(deltas[0]).toBeGreaterThan(0);  // first third: slower
    expect(deltas[4]).toBeCloseTo(0, 5);    // middle third: base pace
    expect(deltas[8]).toBeLessThan(0);     // last third: faster
  });

  it('clamps segments to at least 2', () => {
    const deltas = computeStrategyDeltas(10, { type: 'negative', segments: 1, deltaSecondsPerKm: 5 });
    // Should behave as 2 segments
    expect(deltas[0]).toBeGreaterThan(0);
    expect(deltas[9]).toBeLessThan(0);
  });

  it('clamps segments to at most totalKm', () => {
    const deltas = computeStrategyDeltas(4, { type: 'negative', segments: 10, deltaSecondsPerKm: 5 });
    expect(deltas).toHaveLength(4);
    // Should behave as 4 segments
    expect(deltas[0]).toBeGreaterThan(0);
    expect(deltas[3]).toBeLessThan(0);
  });
});

describe('generateSplits with strategy', () => {
  it('no strategy produces near-uniform splits on flat course (slight climate drift)', () => {
    const profile = buildFlatProfile(10);
    const splits = generateSplits(3000, profile, calmWeather);
    const paces = splits.map(s => s.paceSecondsPerKm);
    // Per-km climate causes slight drift, but all within ~5s of base
    paces.forEach(p => expect(p).toBeCloseTo(300, -1));
  });

  it('negative split: last km faster than first km on flat course', () => {
    const profile = buildFlatProfile(10);
    const strategy: PacingStrategyConfig = { type: 'negative', segments: 2, deltaSecondsPerKm: 10 };
    const splits = generateSplits(3000, profile, calmWeather, strategy);

    expect(splits[0].paceSecondsPerKm).toBeGreaterThan(splits[9].paceSecondsPerKm);
  });

  it('positive split: first km faster than last km on flat course', () => {
    const profile = buildFlatProfile(10);
    const strategy: PacingStrategyConfig = { type: 'positive', segments: 2, deltaSecondsPerKm: 10 };
    const splits = generateSplits(3000, profile, calmWeather, strategy);

    expect(splits[0].paceSecondsPerKm).toBeLessThan(splits[9].paceSecondsPerKm);
  });

  it('total time is preserved with strategy', () => {
    const profile = buildFlatProfile(10);
    const strategy: PacingStrategyConfig = { type: 'negative', segments: 3, deltaSecondsPerKm: 8 };
    const splits = generateSplits(3000, profile, calmWeather, strategy);

    const lastSplit = splits[splits.length - 1];
    expect(lastSplit.cumulativeTimeSeconds).toBeCloseTo(3000, 0);
  });

  it('terrain wins: uphill segment is still slow even with negative split asking to speed up', () => {
    // 6km course: first 3km flat, last 3km steep uphill (5%)
    const profile: CourseProfile = {
      distanceKm: 6, totalElevationGain: 150, totalElevationLoss: 0, hasGpx: true,
      segments: [
        { kmIndex: 0, startDistance: 0, endDistance: 1000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 1, startDistance: 1000, endDistance: 2000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 2, startDistance: 2000, endDistance: 3000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 3, startDistance: 3000, endDistance: 4000, elevationGain: 50, elevationLoss: 0, avgGradientPercent: 5, bearing: 0 },
        { kmIndex: 4, startDistance: 4000, endDistance: 5000, elevationGain: 50, elevationLoss: 0, avgGradientPercent: 5, bearing: 0 },
        { kmIndex: 5, startDistance: 5000, endDistance: 6000, elevationGain: 50, elevationLoss: 0, avgGradientPercent: 5, bearing: 0 },
      ],
    };

    // Negative split says "go faster in the second half"
    // But the second half is all uphill — terrain should dominate
    const strategy: PacingStrategyConfig = { type: 'negative', segments: 2, deltaSecondsPerKm: 5 };
    const splits = generateSplits(2400, profile, calmWeather, strategy);

    // Despite negative split, the uphill km should still be slower than flat km
    // km 4,5,6 (uphill 5%) vs km 1,2,3 (flat)
    const avgFlat = (splits[0].paceSecondsPerKm + splits[1].paceSecondsPerKm + splits[2].paceSecondsPerKm) / 3;
    const avgUphill = (splits[3].paceSecondsPerKm + splits[4].paceSecondsPerKm + splits[5].paceSecondsPerKm) / 3;

    // Terrain wins: uphill is still slower despite negative split wanting to speed up
    expect(avgUphill).toBeGreaterThan(avgFlat);
  });

  it('even strategy behaves same as no strategy on flat course', () => {
    const profile = buildFlatProfile(10);
    const evenStrategy: PacingStrategyConfig = { type: 'even', segments: 2, deltaSecondsPerKm: 10 };
    const noStrategySplits = generateSplits(3000, profile, calmWeather);
    const evenSplits = generateSplits(3000, profile, calmWeather, evenStrategy);

    for (let i = 0; i < 10; i++) {
      expect(evenSplits[i].paceSecondsPerKm).toBeCloseTo(noStrategySplits[i].paceSecondsPerKm, 5);
    }
  });
});
