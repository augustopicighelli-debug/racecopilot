import { describe, it, expect } from 'vitest';
import { calculateBSA } from '../../lib/engine/bsa';

describe('calculateBSA', () => {
  it('calculates BSA for average male runner (70kg, 175cm)', () => {
    const bsa = calculateBSA(70, 175);
    expect(bsa).toBeCloseTo(1.85, 1);
  });

  it('calculates BSA for small female runner (52kg, 160cm)', () => {
    const bsa = calculateBSA(52, 160);
    expect(bsa).toBeCloseTo(1.53, 1);
  });

  it('calculates BSA for large male runner (90kg, 188cm)', () => {
    const bsa = calculateBSA(90, 188);
    expect(bsa).toBeCloseTo(2.16, 1);
  });
});
