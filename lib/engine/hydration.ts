/**
 * Sawka Hydration Model
 *
 * Sweat rate (msw, g/m²/h) = 147 + 1.527 × Ereq - 0.87 × Emax
 *
 * Where:
 *   Ereq = required evaporative heat loss (W/m²) to maintain thermal equilibrium
 *   Emax = maximum evaporative capacity of the environment (W/m²)
 *
 * References:
 *   Sawka MN et al. (1996). Physiological factors affecting thermoregulation.
 *   Moran DS, Shapiro Y, Laor A, Lotan R, Epstein Y. (1999). Can gender differences
 *     during exercise-heat stress be assessed by the physiological strain index?
 *
 * Note on Emax scaling:
 *   In the original Sawka model, Emax represents the maximum skin surface evaporative
 *   capacity constrained by skin wettedness (w_req). Here we use:
 *     Emax = Emax_atm × (1 - w_min)
 *   where w_min = 0.06 (irreducible skin wettedness) and Emax_atm is the atmospheric
 *   evaporative potential, capped at a physiologically meaningful value.
 */

import { calculateBSA } from './bsa';
import type {
  AggregatedWeather,
  HydrationPlan,
  HydrationEvent,
  SweatLevel,
} from './types';

export interface HydrationInput {
  weightKg: number;
  heightCm: number;
  sweatLevel: SweatLevel;
  paceSecondsPerKm: number;
  distanceKm: number;
  weather: AggregatedWeather;
  aidStationKms?: number[];  // custom aid station positions (e.g. [5, 10, 15, 20, ...])
}

const SWEAT_LEVEL_MULTIPLIER: Record<SweatLevel, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.3,
};

/**
 * Saturation vapour pressure (kPa) using Antoine equation.
 */
function saturationPressureKpa(tempC: number): number {
  return 0.1333 * Math.pow(10, 8.10765 - 1750.286 / (235 + tempC));
}

/**
 * Estimate metabolic power (W/m²) from running pace and body weight.
 *
 * Metabolic rate (W) ≈ weight × speed(m/s) × energy cost of running (≈4.8 J/kg/m)
 * Then divide by BSA to get W/m².
 */
function estimateMetabolicRate(
  weightKg: number,
  paceSecondsPerKm: number,
  bsa: number,
): number {
  const speedMs = 1000 / paceSecondsPerKm; // m/s
  const energyCostJPerKgM = 4.8; // J/(kg·m) — standard running economy
  const metabolicWatts = weightKg * speedMs * energyCostJPerKgM;
  return metabolicWatts / bsa; // W/m²
}

/**
 * Calculate convective heat transfer coefficient (W/m²·°C).
 * Uses DuBois formula: hc = 8.3 × v^0.6 (v in m/s, minimum 0.5 m/s for natural convection).
 */
function convectiveCoefficient(windSpeedKmh: number): number {
  const windMs = windSpeedKmh / 3.6;
  return 8.3 * Math.pow(Math.max(windMs, 0.5), 0.6);
}

/**
 * Calculate required evaporative cooling (Ereq, W/m²).
 *
 * Heat balance: Ereq = M - C - R
 *   M = metabolic rate (W/m²)
 *   C = convective heat exchange = hc × (Tsk - Ta)
 *   R = radiative exchange — approximated as 0 for simplicity (outdoor, cloudy race)
 *
 * Skin temperature Tsk ≈ 35.5°C during sustained exercise.
 */
function calculateEreq(
  metabolicRateWm2: number,
  tempC: number,
  windSpeedKmh: number,
): number {
  const hc = convectiveCoefficient(windSpeedKmh);
  const tSkin = 35.5; // °C, mean skin temperature during exercise
  const convectiveHeatLoss = hc * (tSkin - tempC);
  return Math.max(metabolicRateWm2 - convectiveHeatLoss, 0);
}

/**
 * Calculate maximum evaporative capacity constrained by skin wettedness (Emax, W/m²).
 *
 * In the Sawka model Emax represents the evaporative capacity of the environment
 * *as experienced by the skin*, limited by partial skin wettedness:
 *
 *   Emax_atm = he × (Psk,s - Pa)
 *     he  = evaporative heat transfer coeff = 16.5 × hc  (Lewis relation)
 *     Psk,s = saturation pressure at skin (kPa)
 *     Pa  = ambient vapour pressure = RH × Ps(Ta)
 *
 * Physiological cap: during vigorous exercise skin wettedness rarely exceeds 0.8,
 * so effective Emax ≤ 0.8 × Emax_atm. Additionally, evaporation requires air
 * movement; minimum effective Emax corresponds to natural convection.
 *
 * To keep the Sawka formula coefficients in their validated range (Ereq 100–500,
 * Emax 50–400 W/m²), we scale Emax_atm by a physiological wettedness factor of 0.25.
 * This accounts for the fact that only a fraction of the skin surface is wet at any
 * given moment, which is the implicit assumption in the original regression.
 */
function calculateEmax(
  tempC: number,
  humidityPercent: number,
  windSpeedKmh: number,
): number {
  const hc = convectiveCoefficient(windSpeedKmh);
  const he = 16.5 * hc; // Lewis relation

  const pSkinSat = saturationPressureKpa(35.5); // kPa
  const pAmbient = (humidityPercent / 100) * saturationPressureKpa(tempC); // kPa

  const emaxAtm = he * (pSkinSat - pAmbient); // W/m²

  // Physiological wettedness scaling: partially-wet skin fraction ≈ 0.25 at rest/mild
  // This brings Emax into the validated range of the Sawka regression coefficients.
  const wettednessFactor = 0.25;
  return Math.max(emaxAtm * wettednessFactor, 10);
}

/**
 * Calculate sweat rate (ml/h) using Sawka model.
 */
function calculateSweatRateMlPerHour(
  weightKg: number,
  heightCm: number,
  sweatLevel: SweatLevel,
  paceSecondsPerKm: number,
  weather: AggregatedWeather,
): number {
  const bsa = calculateBSA(weightKg, heightCm);
  const M = estimateMetabolicRate(weightKg, paceSecondsPerKm, bsa);
  const ereq = calculateEreq(M, weather.temperature, weather.windSpeedKmh);
  const emax = calculateEmax(weather.temperature, weather.humidity, weather.windSpeedKmh);

  // Sawka formula: msw (g/m²/h) = 147 + 1.527 × Ereq - 0.87 × Emax
  const mswPerM2 = 147 + 1.527 * ereq - 0.87 * emax;

  // Floor to prevent unrealistically low values (minimum ~50 g/m²/h = ~90 ml/h for BSA ~1.85)
  const mswClamped = Math.max(mswPerM2, 50);

  // Total sweat rate in g/h; sweat density ≈ 1 g/ml so g/h ≈ ml/h
  const sweatRateGPerHour = mswClamped * bsa;

  // Apply individual sweat level multiplier
  const multiplier = SWEAT_LEVEL_MULTIPLIER[sweatLevel];
  return sweatRateGPerHour * multiplier;
}

/**
 * Compute sweat rate at a specific km based on interpolated temperature.
 * Temperature rises during the race → sweat rate increases.
 */
function sweatRateAtKm(
  km: number,
  distanceKm: number,
  paceSecondsPerKm: number,
  weightKg: number,
  heightCm: number,
  sweatLevel: SweatLevel,
  weather: AggregatedWeather,
): number {
  const totalTimeHours = (paceSecondsPerKm * distanceKm) / 3600;
  const tempEnd = weather.temperatureEnd ?? weather.temperature + 1.5 * totalTimeHours;
  const progress = km / distanceKm;
  const tempAtKm = weather.temperature + (tempEnd - weather.temperature) * progress;

  // Create a weather snapshot at this km's temperature
  const weatherAtKm: AggregatedWeather = { ...weather, temperature: tempAtKm };
  return calculateSweatRateMlPerHour(weightKg, heightCm, sweatLevel, paceSecondsPerKm, weatherAtKm);
}

/**
 * Generate a hydration plan with drink events spaced every ~4 km.
 * Sweat rate varies per-km based on temperature progression.
 * Each drink is clamped to 150–300 ml.
 */
export function generateHydrationPlan(input: HydrationInput): HydrationPlan {
  const { weightKg, heightCm, sweatLevel, paceSecondsPerKm, distanceKm, weather } = input;

  // Average sweat rate (for summary stats)
  const sweatRateStart = calculateSweatRateMlPerHour(
    weightKg, heightCm, sweatLevel, paceSecondsPerKm, weather,
  );
  const totalTimeHours = (paceSecondsPerKm * distanceKm) / 3600;
  const tempEnd = weather.temperatureEnd ?? weather.temperature + 1.5 * totalTimeHours;
  const weatherEnd: AggregatedWeather = { ...weather, temperature: tempEnd };
  const sweatRateEnd = calculateSweatRateMlPerHour(
    weightKg, heightCm, sweatLevel, paceSecondsPerKm, weatherEnd,
  );
  const avgSweatRate = (sweatRateStart + sweatRateEnd) / 2;

  // Total estimated fluid loss using average rate
  const totalFluidLosseMl = avgSweatRate * totalTimeHours;

  // Aid station positions: custom list or default every 5km starting at km 5
  const stationKms = (input.aidStationKms && input.aidStationKms.length > 0)
    ? input.aidStationKms.filter(k => k > 0 && k < distanceKm).sort((a, b) => a - b)
    : Array.from({ length: Math.floor(distanceKm / 5) }, (_, i) => (i + 1) * 5).filter(k => k < distanceKm);

  const events: HydrationEvent[] = [];
  let cumulativeMl = 0;

  for (const stationKm of stationKms) {
    const localSweatRate = sweatRateAtKm(
      stationKm, distanceKm, paceSecondsPerKm,
      weightKg, heightCm, sweatLevel, weather,
    );
    const mlPerKm = localSweatRate / (3600 / paceSecondsPerKm);

    const kmSinceLast = events.length === 0 ? stationKm : stationKm - events[events.length - 1].km;
    const rawMl = mlPerKm * kmSinceLast;

    // Clamp to 150–300 ml per drink
    const mlToDrink = Math.min(300, Math.max(150, Math.round(rawMl)));

    cumulativeMl += mlToDrink;
    events.push({ km: stationKm, mlToDrink, cumulativeMl });
  }

  return {
    totalFluidLosseMl: Math.round(totalFluidLosseMl),
    sweatRateMlPerHour: Math.round(avgSweatRate),
    events,
  };
}
