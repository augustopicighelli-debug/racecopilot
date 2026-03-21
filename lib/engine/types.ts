// --- Runner Profile ---

export type SweatLevel = 'low' | 'medium' | 'high';

export interface ReferenceRace {
  distanceKm: number;
  timeSeconds: number;
  date: string;
  type: 'race' | 'training';
}

export interface NutritionProduct {
  name: string;
  carbsGrams: number;
  sodiumMg: number;
  caffeineMg: number;
  type: 'gel' | 'salt_pill';
}

export interface RunnerProfile {
  weightKg: number;
  heightCm: number;
  sweatLevel: SweatLevel;
  referenceRaces: ReferenceRace[];
  weeklyKm?: number;
  vam?: number; // TODO v2: use for performance ceiling adjustment
  speed400m?: number; // TODO v2: use for VO2max estimation
  speed1000m?: number; // TODO v2: use for lactate threshold estimation
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
  temperature: number;
  humidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  sourcesCount: number;
  sourceAgreement: 'high' | 'medium' | 'low';
  daysUntilRace: number;
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

export interface SplitKm {
  km: number;
  paceSecondsPerKm: number;
  cumulativeTimeSeconds: number;
  elevationNote?: string;
  windNote?: string;
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
}
