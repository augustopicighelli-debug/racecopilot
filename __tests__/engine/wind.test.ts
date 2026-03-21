import { describe, it, expect } from 'vitest';
import { windImpactPerKm } from '../../lib/engine/wind';

describe('windImpactPerKm', () => {
  it('returns positive seconds (slower) for headwind', () => {
    const impact = windImpactPerKm(0, 20, 0);
    expect(impact).toBeGreaterThan(0);
  });

  it('returns negative seconds (faster) for tailwind', () => {
    const impact = windImpactPerKm(0, 20, 180);
    expect(impact).toBeLessThan(0);
  });

  it('returns ~0 for crosswind', () => {
    const impact = windImpactPerKm(0, 20, 90);
    expect(Math.abs(impact)).toBeLessThan(2);
  });

  it('scales with wind speed', () => {
    const light = windImpactPerKm(0, 10, 0);
    const strong = windImpactPerKm(0, 30, 0);
    expect(strong).toBeGreaterThan(light);
  });

  it('returns 0 for no wind', () => {
    const impact = windImpactPerKm(0, 0, 0);
    expect(impact).toBe(0);
  });

  it('tailwind benefit is less than headwind penalty (asymmetric)', () => {
    const headwind = windImpactPerKm(0, 20, 0);
    const tailwind = windImpactPerKm(0, 20, 180);
    expect(Math.abs(headwind)).toBeGreaterThan(Math.abs(tailwind));
  });
});
