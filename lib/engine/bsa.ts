/**
 * DuBois & DuBois Body Surface Area formula.
 * BSA (m²) = 0.007184 × weight(kg)^0.425 × height(cm)^0.725
 */
export function calculateBSA(weightKg: number, heightCm: number): number {
  return 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
}
