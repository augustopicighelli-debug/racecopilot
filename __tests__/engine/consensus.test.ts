import { describe, it, expect } from 'vitest';
import { calculateConsensus } from '../../lib/engine/consensus';

describe('calculateConsensus', () => {
  it('returns target when within 5s/km of forecast (aggressive but realistic)', () => {
    const result = calculateConsensus(300, 296, 21.1);
    expect(result.paceSecondsPerKm).toBe(296);
    expect(result.label).toContain('Agresivo pero realista');
  });

  it('returns target when exactly 5s/km faster', () => {
    const result = calculateConsensus(300, 295, 21.1);
    expect(result.paceSecondsPerKm).toBe(295);
    expect(result.label).toContain('Agresivo pero realista');
  });

  it('returns midpoint when 5-10s/km faster', () => {
    const result = calculateConsensus(300, 292, 21.1);
    expect(result.paceSecondsPerKm).toBe(296);
    expect(result.label).toContain('ambicioso');
  });

  it('returns forecast +5s/km when >10s/km faster', () => {
    const result = calculateConsensus(300, 285, 21.1);
    expect(result.paceSecondsPerKm).toBe(295);
    expect(result.label).toContain('lejos de tu forma actual');
  });

  it('converts pace-based consensus to total time correctly', () => {
    const result = calculateConsensus(300, 296, 10);
    expect(result.timeSeconds).toBe(2960);
  });

  it('handles target slower than forecast', () => {
    const result = calculateConsensus(300, 310, 21.1);
    expect(result.paceSecondsPerKm).toBe(310);
    expect(result.label).toContain('conservador');
  });
});
