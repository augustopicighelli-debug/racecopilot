import type { NutritionEvent, NutritionPlan, NutritionProduct, SweatLevel } from './types';

const SHORT_RACE_THRESHOLD = 75 * 60; // 75 minutes in seconds
const DISCLAIMER =
  'Este plan es orientativo. Consultá siempre a tu médico antes de seguir cualquier plan de nutrición deportiva.';

// Target carbs per hour for long efforts (g/h)
const CARBS_PER_HOUR_MIN = 60;
const CARBS_PER_HOUR_MAX = 90;
const CARBS_PER_HOUR_TARGET = (CARBS_PER_HOUR_MIN + CARBS_PER_HOUR_MAX) / 2; // 75 g/h

// Sodium target per hour by sweat level (mg/h) — based on ACSM guidelines
// Adjusted upward per Baker et al. 2016 and Del Coso et al. 2016
// Low: 300-400, Medium: 500-600, High: 700-900
const SODIUM_TARGET_PER_HOUR: Record<SweatLevel, number> = {
  low: 350,
  medium: 550,
  high: 800,
};

// Minimum interval between salt pills = time to run 5km at race pace

export interface GenerateNutritionPlanInput {
  totalTimeSeconds: number;
  distanceKm: number;
  paceSecondsPerKm: number;
  products: NutritionProduct[];
  sweatRateMlPerHour: number;
  sweatLevel: SweatLevel;
  breakfastHoursAgo: number;
  hydrationKms?: number[];  // km points where hydration events occur, for alignment
}

/** Round to nearest 0.5 km (e.g. 12.1 → 12, 12.3 → 12.5, 17.9 → 18) */
function roundToHalf(km: number): number {
  return Math.round(km * 2) / 2;
}

/**
 * Snap a km value to the nearest hydration point if within maxDriftKm.
 * This lets the runner take gel + water at the same aid station.
 * Falls back to rounding to nearest 0.5 km.
 */
function snapToHydration(km: number, hydrationKms: number[], maxDriftKm: number): number {
  if (hydrationKms.length === 0) return roundToHalf(km);
  let best = km;
  let bestDist = Infinity;
  for (const hKm of hydrationKms) {
    const dist = Math.abs(hKm - km);
    if (dist < bestDist) {
      bestDist = dist;
      best = hKm;
    }
  }
  return bestDist <= maxDriftKm ? best : roundToHalf(km);
}

export function generateNutritionPlan(input: GenerateNutritionPlanInput): NutritionPlan {
  const {
    totalTimeSeconds,
    distanceKm,
    paceSecondsPerKm,
    products,
    sweatRateMlPerHour,
    sweatLevel,
    breakfastHoursAgo,
    hydrationKms = [],
  } = input;

  const totalHours = totalTimeSeconds / 3600;
  const isShortRace = totalTimeSeconds < SHORT_RACE_THRESHOLD;

  // Pre-race: recommend real food (banana or membrillo) ~15 min before start
  // Only when breakfast was >2h ago — otherwise glycogen stores are sufficient
  let preRaceGel: NutritionEvent | undefined;
  const gelProduct = products.find(p => p.type === 'gel');
  if (breakfastHoursAgo > 2) {
    const preRaceProduct: NutritionProduct = {
      name: 'Banana o membrillo',
      carbsGrams: 25,
      sodiumMg: 0,
      caffeineMg: 0,
      type: 'gel', // reuse type for compatibility
    };
    preRaceGel = {
      km: 0,
      minutesSinceStart: -15,
      product: preRaceProduct,
      carbsGrams: preRaceProduct.carbsGrams,
      sodiumMg: 0,
      note: 'Snack pre-carrera: banana o bocado de membrillo ~15 min antes de la largada',
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

  // Total sodium target based on ACSM guidelines per sweat level (mg/h × hours)
  const totalSodiumNeeded = Math.round(SODIUM_TARGET_PER_HOUR[sweatLevel] * totalHours);

  // Build gel events: first at 25 min (~km 5), then every 25 min
  // Jeukendrup 2014: start fueling within first 30min, peak exogenous oxidation at ~75-90min
  const gelEvents: NutritionEvent[] = [];
  const firstGelMinute = 25;
  const gelIntervalMinutes = 25;
  const totalMinutes = totalTimeSeconds / 60;

  let currentMinute = firstGelMinute;
  let cumulativeCarbs = 0;

  while (currentMinute <= totalMinutes - 5 && gelProduct) {
    const rawKm = Math.min((currentMinute / totalMinutes) * distanceKm, distanceKm);
    const km = snapToHydration(Math.round(rawKm * 10) / 10, hydrationKms, 2);
    // Recalculate minute from snapped km
    const snappedMinute = (km / distanceKm) * totalMinutes;
    gelEvents.push({
      km,
      minutesSinceStart: Math.round(snappedMinute),
      product: gelProduct,
      carbsGrams: gelProduct.carbsGrams,
      sodiumMg: gelProduct.sodiumMg,
      note: `Gel en km ${km}`,
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
    // Minimum interval = time to run 5km at race pace
    const minSaltIntervalMinutes = (paceSecondsPerKm * 5) / 60;
    const saltStartMinute = 60;
    const availableMinutes = totalMinutes - saltStartMinute - 5;
    const maxPillsByInterval = Math.max(1, Math.floor(availableMinutes / minSaltIntervalMinutes) + 1);
    const actualPills = Math.min(pillsNeeded, maxPillsByInterval);

    const saltInterval =
      actualPills > 1
        ? Math.max(minSaltIntervalMinutes, Math.floor(availableMinutes / (actualPills - 1)))
        : availableMinutes;

    for (let i = 0; i < actualPills; i++) {
      const minute = Math.min(saltStartMinute + i * saltInterval, totalMinutes - 5);
      const rawKm = Math.min((minute / totalMinutes) * distanceKm, distanceKm);
      const km = snapToHydration(Math.round(rawKm * 10) / 10, hydrationKms, 2);
      const snappedMinute = (km / distanceKm) * totalMinutes;
      saltPillEvents.push({
        km,
        minutesSinceStart: Math.round(snappedMinute),
        product: saltPillProduct,
        carbsGrams: 0,
        sodiumMg: saltPillProduct.sodiumMg,
        note: `Sal en km ${km}`,
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
