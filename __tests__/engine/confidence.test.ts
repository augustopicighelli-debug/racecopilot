import { describe, it, expect } from 'vitest';
import { calculateConfidence } from '../../lib/engine/confidence';
import type { ConfidenceInputs } from '../../lib/engine/types';

describe('calculateConfidence', () => {
  it('returns high confidence with ideal inputs', () => {
    const result = calculateConfidence({
      referenceRaceCount: 10, mostRecentRaceMonthsAgo: 1,
      allRacesWithin6Months: true, weatherSourceAgreement: 'high',
      daysUntilRace: 1, hasGpx: true, hasIntervals: true,
    });
    expect(result).toBeGreaterThan(90);
  });

  it('returns low confidence with minimal inputs and distant race', () => {
    const result = calculateConfidence({
      referenceRaceCount: 1, mostRecentRaceMonthsAgo: 10,
      allRacesWithin6Months: false, weatherSourceAgreement: 'low',
      daysUntilRace: 60, hasGpx: false, hasIntervals: false,
    });
    expect(result).toBeLessThan(50);
  });

  it('more reference races increases confidence', () => {
    const base: ConfidenceInputs = {
      referenceRaceCount: 1, mostRecentRaceMonthsAgo: 1,
      allRacesWithin6Months: true, weatherSourceAgreement: 'high',
      daysUntilRace: 1, hasGpx: true, hasIntervals: false,
    };
    const few = calculateConfidence(base);
    const many = calculateConfidence({ ...base, referenceRaceCount: 10 });
    expect(many).toBeGreaterThan(few);
  });

  it('closer race date increases confidence', () => {
    const base: ConfidenceInputs = {
      referenceRaceCount: 5, mostRecentRaceMonthsAgo: 1,
      allRacesWithin6Months: true, weatherSourceAgreement: 'high',
      daysUntilRace: 30, hasGpx: true, hasIntervals: false,
    };
    const far = calculateConfidence(base);
    const close = calculateConfidence({ ...base, daysUntilRace: 2 });
    expect(close).toBeGreaterThan(far);
  });

  it('returns value between 0 and 100', () => {
    const result = calculateConfidence({
      referenceRaceCount: 5, mostRecentRaceMonthsAgo: 3,
      allRacesWithin6Months: true, weatherSourceAgreement: 'medium',
      daysUntilRace: 7, hasGpx: true, hasIntervals: false,
    });
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('GPX presence improves confidence', () => {
    const base: ConfidenceInputs = {
      referenceRaceCount: 5, mostRecentRaceMonthsAgo: 1,
      allRacesWithin6Months: true, weatherSourceAgreement: 'high',
      daysUntilRace: 3, hasGpx: false, hasIntervals: false,
    };
    const noGpx = calculateConfidence(base);
    const withGpx = calculateConfidence({ ...base, hasGpx: true });
    expect(withGpx).toBeGreaterThan(noGpx);
  });
});
