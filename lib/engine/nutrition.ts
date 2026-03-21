import type { NutritionEvent, NutritionPlan, NutritionProduct } from './types';

const SHORT_RACE_THRESHOLD = 75 * 60; // 75 minutes in seconds
const DISCLAIMER =
  'Este plan es orientativo. Consultá siempre a tu médico antes de seguir cualquier plan de nutrición deportiva.';

// Target carbs per hour for long efforts (g/h)
const CARBS_PER_HOUR_MIN = 60;
const CARBS_PER_HOUR_MAX = 90;
const CARBS_PER_HOUR_TARGET = (CARBS_PER_HOUR_MIN + CARBS_PER_HOUR_MAX) / 2; // 75 g/h

// Sodium lost per litre of sweat (mg)
const SODIUM_PER_LITRE_MG = 1000;

export interface GenerateNutritionPlanInput {
  totalTimeSeconds: number;
  distanceKm: number;
  paceSecondsPerKm: number;
  products: NutritionProduct[];
  sweatRateMlPerHour: number;
  breakfastHoursAgo: number;
}

export function generateNutritionPlan(input: GenerateNutritionPlanInput): NutritionPlan {
  const {
    totalTimeSeconds,
    distanceKm,
    paceSecondsPerKm,
    products,
    sweatRateMlPerHour,
    breakfastHoursAgo,
  } = input;

  const totalHours = totalTimeSeconds / 3600;
  const isShortRace = totalTimeSeconds < SHORT_RACE_THRESHOLD;

  // Pre-race gel: suggest when breakfast was more than 2 hours ago
  let preRaceGel: NutritionEvent | undefined;
  const gelProduct = products.find(p => p.type === 'gel');
  if (breakfastHoursAgo > 2 && gelProduct) {
    preRaceGel = {
      km: 0,
      minutesSinceStart: -15,
      product: gelProduct,
      carbsGrams: gelProduct.carbsGrams,
      sodiumMg: gelProduct.sodiumMg,
      note: 'Gel pre-carrera: tomarlo ~15 min antes de la largada',
    };
  }

  if (isShortRace) {
    return {
      totalCarbsNeeded: 0,
      totalSodiumNeeded: 0,
      events: [],
      isShortRace: true,
      shortRaceMessage:
        'Para esta distancia y ritmo no necesitás suplementar durante la carrera. Hidratate bien antes y después.',
      preRaceGel,
      disclaimer: DISCLAIMER,
    };
  }

  // --- Long race nutrition plan ---

  // Total carbs needed
  const totalCarbsNeeded = Math.round(CARBS_PER_HOUR_TARGET * totalHours);

  // Total sodium lost via sweat
  const totalFluidLiters = (sweatRateMlPerHour * totalHours) / 1000;
  const totalSodiumNeeded = Math.round(totalFluidLiters * SODIUM_PER_LITRE_MG);

  // Build gel events: first at 45 min, then every 30 min
  const gelEvents: NutritionEvent[] = [];
  const firstGelMinute = 45;
  const gelIntervalMinutes = 30;
  const totalMinutes = totalTimeSeconds / 60;

  let currentMinute = firstGelMinute;
  let cumulativeCarbs = 0;

  while (currentMinute <= totalMinutes - 5 && gelProduct) {
    const km = Math.min((currentMinute / totalMinutes) * distanceKm, distanceKm);
    gelEvents.push({
      km: Math.round(km * 10) / 10,
      minutesSinceStart: currentMinute,
      product: gelProduct,
      carbsGrams: gelProduct.carbsGrams,
      sodiumMg: gelProduct.sodiumMg,
      note: `Gel en km ${Math.round(km * 10) / 10}`,
    });
    cumulativeCarbs += gelProduct.carbsGrams;
    currentMinute += gelIntervalMinutes;
  }

  // Calculate sodium already provided by gels
  const sodiumFromGels = gelEvents.reduce((sum, e) => sum + e.sodiumMg, 0);
  const sodiumDeficit = Math.max(0, totalSodiumNeeded - sodiumFromGels);

  // Build salt pill events if there's a salt pill product and a sodium deficit
  const saltPillEvents: NutritionEvent[] = [];
  const saltPillProduct = products.find(p => p.type === 'salt_pill');

  if (saltPillProduct && saltPillProduct.sodiumMg > 0 && sodiumDeficit > 0) {
    const pillsNeeded = Math.ceil(sodiumDeficit / saltPillProduct.sodiumMg);

    // Distribute salt pills evenly across the race (starting at ~1h mark)
    const saltStartMinute = 60;
    const saltInterval =
      pillsNeeded > 1
        ? Math.floor((totalMinutes - saltStartMinute) / (pillsNeeded - 1))
        : totalMinutes;

    for (let i = 0; i < pillsNeeded; i++) {
      const minute = Math.min(saltStartMinute + i * saltInterval, totalMinutes - 5);
      const km = Math.min((minute / totalMinutes) * distanceKm, distanceKm);
      saltPillEvents.push({
        km: Math.round(km * 10) / 10,
        minutesSinceStart: minute,
        product: saltPillProduct,
        carbsGrams: 0,
        sodiumMg: saltPillProduct.sodiumMg,
        note: `Sal en km ${Math.round(km * 10) / 10}`,
      });
    }
  }

  // Merge and sort all events by km
  const events: NutritionEvent[] = [...gelEvents, ...saltPillEvents].sort(
    (a, b) => a.km - b.km
  );

  return {
    totalCarbsNeeded,
    totalSodiumNeeded,
    events,
    isShortRace: false,
    preRaceGel,
    disclaimer: DISCLAIMER,
  };
}
