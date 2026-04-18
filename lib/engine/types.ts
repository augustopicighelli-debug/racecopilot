// --- Runner Profile ---

export type SweatLevel = 'low' | 'medium' | 'high';

export interface ReferenceRace {
  distanceKm: number;
  timeSeconds: number;
  date: string;
  type: 'race' | 'training';
  avgHeartRate?: number;       // average HR during the race
  temperatureC?: number;       // ambient temperature during the race
  humidityPercent?: number;    // ambient humidity during the race
}

export interface NutritionProduct {
  name: string;
  carbsGrams: number;
  sodiumMg: number;
  caffeineMg: number;
  type: 'gel' | 'salt_pill';
}

export interface IntervalSession {
  distanceM: number;         // interval distance in meters (400, 1000, 2000)
  reps: number;              // number of reps
  paceSecondsPerKm: number;  // average pace per km
  date: string;              // ISO date
  avgHeartRate?: number;     // average HR during intervals
  temperatureC?: number;     // ambient temperature during session
  humidityPercent?: number;  // ambient humidity during session
}

export interface RunnerProfile {
  weightKg: number;
  heightCm: number;
  sweatLevel: SweatLevel;
  maxHeartRate?: number;       // max HR (from test or 220-age). Needed to interpret race/interval HR.
  restingHeartRate?: number;   // resting HR for Karvonen formula (improves effort normalization)
  referenceRaces: ReferenceRace[];
  weeklyKm?: number;
  vam?: number;
  intervals?: IntervalSession[];
  nutritionProducts: NutritionProduct[];
}

// --- Race / Course ---

export interface GpxPoint {
  lat: number;
  lon: number;
  elevation: number;
  distanceFromStart: number;
}

export interface ElevationSegment {
  kmIndex: number;
  startDistance: number;
  endDistance: number;
  elevationGain: number;
  elevationLoss: number;
  avgGradientPercent: number;
  bearing: number;
}

export interface CourseProfile {
  distanceKm: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  segments: ElevationSegment[];
  hasGpx: boolean;
  manualElevationGain?: number;
  warningMessage?: string;
}

// --- Weather ---

export interface WeatherData {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  source: string;
}

export interface AggregatedWeather {
  temperature: number;       // expected temperature at race start (°C)
  temperatureEnd?: number;   // expected temperature at race end (°C) — if omitted, modeled as +1.5°C/hour
  humidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  sourcesCount: number;
  sourceAgreement: 'high' | 'medium' | 'low';
  daysUntilRace: number;
  // Temps horarios del día de carrera (hora 0-23 → °C). Permite calcular
  // temperatureEnd exacto para cada plan según su duración real.
  hourlyTemps?: { hour: number; tempC: number }[];
}

// --- Pacing Strategy ---

export type PacingStrategyType = 'even' | 'negative' | 'positive';

export interface PacingStrategyConfig {
  type: PacingStrategyType;
  segments: number;         // how many segments to split the race into (2, 3, 4...)
  deltaSecondsPerKm: number; // pace difference between consecutive segments
}

// --- Prediction ---

export type ObjectiveType = 'forecast' | 'target' | 'consensus';

export interface Prediction {
  timeSeconds: number;
  paceSecondsPerKm: number;
  type: ObjectiveType;
  label?: string;
}

// --- Plans ---

export interface SplitBreakdown {
  basePace: number;          // pace before any adjustments
  strategyDelta: number;     // +/- from pacing strategy
  elevationDelta: number;    // +/- from gradient
  windDelta: number;         // +/- from wind
  climateFactor: number;     // multiplier from temperature at this km
  fatigueFactor: number;     // multiplier from glycogen depletion (>1.0 after ~km 30)
  finalPace: number;         // after all adjustments + normalization
}

export interface SplitKm {
  km: number;
  paceSecondsPerKm: number;
  cumulativeTimeSeconds: number;
  elevationNote?: string;
  windNote?: string;
  breakdown: SplitBreakdown;
}

export interface RaceWaterfall {
  baseTimeSeconds: number;           // blended prediction (Riegel + intervals) in neutral conditions
  riegelTimeSeconds?: number;        // pure Riegel prediction
  intervalTimeSeconds?: number;      // pure interval-based prediction
  climateAdjustment: number;         // +/- seconds from climate
  elevationAdjustment: number;       // +/- seconds from elevation
  windAdjustment: number;            // +/- seconds from wind
  finalTimeSeconds: number;          // after all adjustments
}

export interface HydrationEvent {
  km: number;
  mlToDrink: number;
  cumulativeMl: number;
}

export interface NutritionEvent {
  km: number;
  minutesSinceStart: number;
  product: NutritionProduct;
  carbsGrams: number;
  sodiumMg: number;
  note?: string;
}

export interface HydrationPlan {
  totalFluidLosseMl: number;
  sweatRateMlPerHour: number;
  events: HydrationEvent[];
}

export interface NutritionPlan {
  totalCarbsNeeded: number;
  totalSodiumNeeded: number;
  events: NutritionEvent[];
  isShortRace: boolean;
  shortRaceMessage?: string;
  preRaceGel?: NutritionEvent;
  disclaimer: string;
}

export interface RacePlan {
  prediction: Prediction;
  splits: SplitKm[];
  hydration: HydrationPlan;
  nutrition: NutritionPlan;
  confidence: number;
  course: CourseProfile;
  weather: AggregatedWeather;
  waterfall?: RaceWaterfall;
}

export interface TripleObjectivePlan {
  forecast: RacePlan;
  target?: RacePlan;
  consensus?: RacePlan;
}

export interface ConfidenceInputs {
  referenceRaceCount: number;
  mostRecentRaceMonthsAgo: number;
  allRacesWithin6Months: boolean;
  weatherSourceAgreement: 'high' | 'medium' | 'low';
  daysUntilRace: number;
  hasGpx: boolean;
  hasIntervals: boolean;
}
