# RaceCopilot Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure calculation engine that takes runner data, race conditions, and GPX profiles and outputs a complete race plan (prediction, splits, hydration, nutrition, confidence).

**Architecture:** Pure TypeScript library with zero dependencies on DB, HTTP, or frameworks. All functions are stateless: data in → plan out. Fully testeable with unit tests. Lives in `/lib/engine/` and `/lib/gpx/`, importable from any future frontend or API layer.

**Tech Stack:** TypeScript, Vitest (testing), @tmcw/togeojson + fast-xml-parser (GPX parsing — typed alternative to gpxparser)

**Known v1 limitations:**
- VAM and speed400m/1000m fields exist in types but are not consumed by the predictor yet (v2 — performance ceiling adjustment)
- Nutrition engine uses only the first gel and first salt pill product. Multi-product routing (e.g., caffeinated gel for second half) is v2.
- Hydration formula uses simplified Ereq/Emax approximations. Flag for calibration against real runner data.

**Spec:** `RaceCopilot-Design-Spec.md` (sections 6, 11.1-11.7)

---

## File Structure

```
/lib
  /engine
    types.ts              → All interfaces and types for the engine
    bsa.ts                → DuBois Body Surface Area calculation
    predictor.ts          → Riegel adjusted time prediction
    consensus.ts          → Triple objective logic (pronóstico/target/consenso)
    elevation.ts          → Elevation profile from GPX data + gradient per km
    wind.ts               → Wind impact by segment orientation
    pacing.ts             → Splits per km adjusted by elevation + climate + wind
    hydration.ts          → Sawka model for hydration plan
    nutrition.ts          → Gel/salt timing plan
    confidence.ts         → Confidence % calculation
    plan.ts               → Orchestrator: combines all modules into final race plan
  /gpx
    parser.ts             → GPX file parsing to structured data
  /__tests__
    /engine
      bsa.test.ts
      predictor.test.ts
      consensus.test.ts
      elevation.test.ts
      wind.test.ts
      pacing.test.ts
      hydration.test.ts
      nutrition.test.ts
      confidence.test.ts
      plan.test.ts
    /gpx
      parser.test.ts
    /fixtures
      sample-flat.gpx     → Flat course GPX for testing
      sample-hilly.gpx    → Hilly course GPX for testing
```

---

## Task 0: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Initialize project**

```bash
cd /c/Users/APICIGHELLI/Personal/RaceCopilot
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install typescript vitest @types/node --save-dev
npm install @tmcw/togeojson fast-xml-parser
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "sourceMap": true,
    "paths": {
      "@/engine/*": ["./lib/engine/*"],
      "@/gpx/*": ["./lib/gpx/*"]
    }
  },
  "include": ["lib/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@/engine': path.resolve(__dirname, './lib/engine'),
      '@/gpx': path.resolve(__dirname, './lib/gpx'),
    },
  },
});
```

- [ ] **Step 5: Add test script to package.json**

Add to scripts: `"test": "vitest run", "test:watch": "vitest"`

- [ ] **Step 6: Create directory structure**

```bash
mkdir -p lib/engine lib/gpx __tests__/engine __tests__/gpx __tests__/fixtures
```

- [ ] **Step 7: Commit**

```bash
git init
echo "node_modules/\ndist/\n.superpowers/" > .gitignore
git add .
git commit -m "chore: scaffold RaceCopilot engine project"
```

---

## Task 1: Types

**Files:**
- Create: `lib/engine/types.ts`

All shared interfaces for the engine. No logic, no tests needed — this is the contract.

- [ ] **Step 1: Write types**

```typescript
// --- Runner Profile ---

export type SweatLevel = 'low' | 'medium' | 'high';

export interface ReferenceRace {
  distanceKm: number;
  timeSeconds: number;
  date: string; // ISO date
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
  vam?: number; // m/h — TODO v2: use for performance ceiling adjustment
  speed400m?: number; // seconds — TODO v2: use for VO2max estimation
  speed1000m?: number; // seconds — TODO v2: use for lactate threshold estimation
  nutritionProducts: NutritionProduct[];
}

// --- Race / Course ---

export interface GpxPoint {
  lat: number;
  lon: number;
  elevation: number;
  distanceFromStart: number; // meters
}

export interface ElevationSegment {
  kmIndex: number; // 0-based km index
  startDistance: number;
  endDistance: number;
  elevationGain: number; // meters
  elevationLoss: number; // meters
  avgGradientPercent: number; // positive = uphill
  bearing: number; // degrees 0-360, for wind calc
}

export interface CourseProfile {
  distanceKm: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  segments: ElevationSegment[];
  hasGpx: boolean;
  manualElevationGain?: number; // fallback if no GPX
  warningMessage?: string; // e.g. "Sin perfil de elevación, splits estimados en terreno plano"
}

// --- Weather ---

export interface WeatherData {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirectionDeg: number; // 0=N, 90=E, 180=S, 270=W
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
  label?: string; // e.g. "Agresivo pero realista"
}

// --- Plans ---

export interface SplitKm {
  km: number; // 1-based
  paceSecondsPerKm: number;
  cumulativeTimeSeconds: number;
  elevationNote?: string; // e.g. "subida"
  windNote?: string; // e.g. "viento en contra"
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
  note?: string; // e.g. "Gel pre-carrera"
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
  isShortRace: boolean; // <75 min → educational message only
  shortRaceMessage?: string;
  preRaceGel?: NutritionEvent;
  disclaimer: string;
}

export interface RacePlan {
  prediction: Prediction;
  splits: SplitKm[];
  hydration: HydrationPlan;
  nutrition: NutritionPlan;
  confidence: number; // 0-100
  course: CourseProfile;
  weather: AggregatedWeather;
}

export interface TripleObjectivePlan {
  forecast: RacePlan;
  target?: RacePlan; // only if user set a target
  consensus?: RacePlan; // only if target exists
}

// --- Confidence Inputs ---

export interface ConfidenceInputs {
  referenceRaceCount: number;
  mostRecentRaceMonthsAgo: number;
  allRacesWithin6Months: boolean;
  weatherSourceAgreement: 'high' | 'medium' | 'low';
  daysUntilRace: number;
  hasGpx: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/engine/types.ts
git commit -m "feat: add engine type definitions"
```

---

## Task 2: BSA Calculator

**Files:**
- Create: `lib/engine/bsa.ts`
- Create: `__tests__/engine/bsa.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/bsa.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```typescript
/**
 * DuBois & DuBois Body Surface Area formula.
 * BSA (m²) = 0.007184 × weight(kg)^0.425 × height(cm)^0.725
 * Source: DuBois D, DuBois EF (1916)
 */
export function calculateBSA(weightKg: number, heightCm: number): number {
  return 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/engine/bsa.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/engine/bsa.ts __tests__/engine/bsa.test.ts
git commit -m "feat: add DuBois BSA calculator"
```

---

## Task 3: Predictor (Riegel Adjusted)

**Files:**
- Create: `lib/engine/predictor.ts`
- Create: `__tests__/engine/predictor.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { predictTime, fitExponent } from '../../lib/engine/predictor';
import type { ReferenceRace } from '../../lib/engine/types';

describe('fitExponent', () => {
  it('returns default 1.06 with only 1 reference race', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    ];
    expect(fitExponent(races)).toBeCloseTo(1.06, 2);
  });

  it('fits exponent from 2 races at different distances', () => {
    // Runner who did 10K in 50:00 and 21.1K in 1:52:00
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
      { distanceKm: 21.1, timeSeconds: 6720, date: '2026-02-15', type: 'race' },
    ];
    const exp = fitExponent(races);
    expect(exp).toBeGreaterThan(1.0);
    expect(exp).toBeLessThan(1.2);
  });

  it('weights recent races more heavily', () => {
    const racesRecentFast: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 2800, date: '2026-03-01', type: 'race' },
      { distanceKm: 10, timeSeconds: 3200, date: '2025-06-01', type: 'race' },
      { distanceKm: 21.1, timeSeconds: 6720, date: '2026-02-01', type: 'race' },
    ];
    const racesRecentSlow: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3200, date: '2026-03-01', type: 'race' },
      { distanceKm: 10, timeSeconds: 2800, date: '2025-06-01', type: 'race' },
      { distanceKm: 21.1, timeSeconds: 6720, date: '2026-02-01', type: 'race' },
    ];
    const expFast = fitExponent(racesRecentFast);
    const expSlow = fitExponent(racesRecentSlow);
    // Different exponents because recency weighting differs
    expect(expFast).not.toBeCloseTo(expSlow, 2);
  });
});

describe('predictTime', () => {
  it('predicts 21K from a 10K using default exponent', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    ];
    const prediction = predictTime(races, 21.1);
    // Riegel: 3000 * (21.1/10)^1.06 ≈ 6500s ≈ 1:48:20
    expect(prediction).toBeGreaterThan(6300);
    expect(prediction).toBeLessThan(6700);
  });

  it('predicts 42K from multiple references', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
      { distanceKm: 21.1, timeSeconds: 6500, date: '2026-02-15', type: 'race' },
    ];
    const prediction = predictTime(races, 42.195);
    // Should be around 3:30-3:50 range
    expect(prediction).toBeGreaterThan(12600); // 3:30
    expect(prediction).toBeLessThan(13800); // 3:50
  });

  it('handles custom distances like 25K', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    ];
    const prediction = predictTime(races, 25);
    expect(prediction).toBeGreaterThan(7500);
    expect(prediction).toBeLessThan(8500);
  });

  it('adjusts prediction upward with higher weekly km', () => {
    const races: ReferenceRace[] = [
      { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    ];
    const base = predictTime(races, 42.195);
    const withVolume = predictTime(races, 42.195, { weeklyKm: 100 });
    // Higher volume = better aerobic capacity = faster prediction
    expect(withVolume).toBeLessThan(base);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/predictor.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import type { ReferenceRace } from './types';

const DEFAULT_EXPONENT = 1.06;

/**
 * Calculate temporal weight for a race: more recent = higher weight.
 * Uses exponential decay: weight = e^(-monthsAgo * 0.1)
 */
function recencyWeight(raceDate: string, referenceDate?: string): number {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const race = new Date(raceDate);
  const monthsAgo = (ref.getTime() - race.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return Math.exp(-monthsAgo * 0.1);
}

/**
 * Fit the Riegel exponent to the runner's actual race data.
 * With 1 race: returns default 1.06.
 * With 2+: finds best-fit exponent using weighted least squares.
 */
export function fitExponent(races: ReferenceRace[]): number {
  if (races.length < 2) return DEFAULT_EXPONENT;

  // Use pairs of races at different distances to estimate exponent
  // Riegel: T2 = T1 * (D2/D1)^exp → exp = ln(T2/T1) / ln(D2/D1)
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < races.length; i++) {
    for (let j = i + 1; j < races.length; j++) {
      const r1 = races[i];
      const r2 = races[j];
      if (Math.abs(r1.distanceKm - r2.distanceKm) < 0.5) continue; // skip same distance

      const exp = Math.log(r2.timeSeconds / r1.timeSeconds) / Math.log(r2.distanceKm / r1.distanceKm);

      // Sanity bounds: exponent should be between 1.0 and 1.2
      if (exp < 1.0 || exp > 1.2) continue;

      const weight = recencyWeight(r1.date) * recencyWeight(r2.date);
      weightedSum += exp * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return DEFAULT_EXPONENT;
  return weightedSum / totalWeight;
}

/**
 * Weekly km adjustment factor for aerobic capacity.
 * Higher volume runners have a better endurance base than their race times may show.
 * Returns a multiplier < 1.0 (faster) for high volume, 1.0 for no adjustment.
 */
function volumeAdjustment(weeklyKm?: number): number {
  if (!weeklyKm || weeklyKm < 30) return 1.0;
  // Logarithmic scaling: each doubling of volume from 30km gives ~2% improvement
  const factor = 1 - 0.02 * Math.log2(weeklyKm / 30);
  return Math.max(factor, 0.92); // cap at 8% improvement
}

/**
 * Predict race time using Riegel formula with fitted exponent.
 * T_predicted = T_ref * (D_target / D_ref) ^ exponent
 * Uses weighted average of predictions from all reference races.
 */
export function predictTime(
  races: ReferenceRace[],
  targetDistanceKm: number,
  options?: { weeklyKm?: number }
): number {
  const exponent = fitExponent(races);

  let weightedPrediction = 0;
  let totalWeight = 0;

  for (const race of races) {
    const predicted = race.timeSeconds * Math.pow(targetDistanceKm / race.distanceKm, exponent);
    const weight = recencyWeight(race.date);
    weightedPrediction += predicted * weight;
    totalWeight += weight;
  }

  const basePrediction = weightedPrediction / totalWeight;
  return basePrediction * volumeAdjustment(options?.weeklyKm);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/engine/predictor.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add lib/engine/predictor.ts __tests__/engine/predictor.test.ts
git commit -m "feat: add Riegel adjusted time predictor with recency weighting"
```

---

## Task 4: Consensus (Triple Objective)

**Files:**
- Create: `lib/engine/consensus.ts`
- Create: `__tests__/engine/consensus.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateConsensus } from '../../lib/engine/consensus';

describe('calculateConsensus', () => {
  // Forecast pace: 5:00/km (300s)

  it('returns target when within 5s/km of forecast (aggressive but realistic)', () => {
    const result = calculateConsensus(300, 296, 21.1); // target 4s faster
    expect(result.paceSecondsPerKm).toBe(296);
    expect(result.label).toContain('Agresivo pero realista');
  });

  it('returns target when exactly 5s/km faster', () => {
    const result = calculateConsensus(300, 295, 21.1);
    expect(result.paceSecondsPerKm).toBe(295);
    expect(result.label).toContain('Agresivo pero realista');
  });

  it('returns midpoint when 5-10s/km faster', () => {
    const result = calculateConsensus(300, 292, 21.1); // 8s faster
    expect(result.paceSecondsPerKm).toBe(296); // midpoint of 300 and 292
    expect(result.label).toContain('ambicioso');
  });

  it('returns forecast +5s/km when >10s/km faster', () => {
    const result = calculateConsensus(300, 285, 21.1); // 15s faster
    expect(result.paceSecondsPerKm).toBe(295); // forecast - 5
    expect(result.label).toContain('lejos de tu forma actual');
  });

  it('converts pace-based consensus to total time correctly', () => {
    const result = calculateConsensus(300, 296, 10); // 10K
    // 296 s/km * 10 km = 2960s
    expect(result.timeSeconds).toBe(2960);
  });

  it('handles target slower than forecast', () => {
    const result = calculateConsensus(300, 310, 21.1); // target slower
    expect(result.paceSecondsPerKm).toBe(310); // respect user's choice
    expect(result.label).toContain('conservador');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/consensus.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import type { Prediction } from './types';

interface ConsensusResult {
  paceSecondsPerKm: number;
  timeSeconds: number;
  label: string;
}

/**
 * Calculate consensus objective from forecast and target paces.
 * Rules (in seconds per km):
 *   ≤5s faster  → target (aggressive but realistic)
 *   5-10s faster → midpoint
 *   >10s faster  → forecast - 5s/km (won't follow the madness)
 *   slower       → respect user's conservative choice
 */
export function calculateConsensus(
  forecastPacePerKm: number,
  targetPacePerKm: number,
  distanceKm: number
): ConsensusResult {
  const diff = forecastPacePerKm - targetPacePerKm; // positive = target is faster

  let consensusPace: number;
  let label: string;

  if (diff <= 0) {
    // Target is slower or equal to forecast
    consensusPace = targetPacePerKm;
    label = 'Objetivo conservador — vas a ritmo cómodo';
  } else if (diff <= 5) {
    consensusPace = targetPacePerKm;
    label = 'Agresivo pero realista';
  } else if (diff <= 10) {
    consensusPace = Math.round(forecastPacePerKm - diff / 2);
    label = 'Tu target es ambicioso, te sugerimos este ritmo';
  } else {
    consensusPace = forecastPacePerKm - 5;
    label = 'Tu target está lejos de tu forma actual';
  }

  return {
    paceSecondsPerKm: consensusPace,
    timeSeconds: Math.round(consensusPace * distanceKm),
    label,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/engine/consensus.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/consensus.ts __tests__/engine/consensus.test.ts
git commit -m "feat: add consensus calculator with s/km rules"
```

---

## Task 5: GPX Parser + Elevation Profile

**Files:**
- Create: `lib/gpx/parser.ts`
- Create: `lib/engine/elevation.ts`
- Create: `__tests__/fixtures/sample-flat.gpx`
- Create: `__tests__/fixtures/sample-hilly.gpx`
- Create: `__tests__/gpx/parser.test.ts`
- Create: `__tests__/engine/elevation.test.ts`

- [ ] **Step 1: Create GPX test fixtures**

`sample-flat.gpx`: A simple 5km flat course (5 points, ~0 elevation change).

`sample-hilly.gpx`: A 5km course with hills (point every 500m, elevation varies from 100m to 250m and back).

Generate these as minimal valid GPX XML with `<trkpt>` elements containing `lat`, `lon`, `ele` attributes.

- [ ] **Step 2: Write parser test**

```typescript
import { describe, it, expect } from 'vitest';
import { parseGpx } from '../../lib/gpx/parser';
import { readFileSync } from 'fs';
import path from 'path';

describe('parseGpx', () => {
  it('parses flat course GPX into points', () => {
    const gpxContent = readFileSync(
      path.join(__dirname, '../fixtures/sample-flat.gpx'),
      'utf-8'
    );
    const points = parseGpx(gpxContent);
    expect(points.length).toBeGreaterThan(0);
    expect(points[0]).toHaveProperty('lat');
    expect(points[0]).toHaveProperty('lon');
    expect(points[0]).toHaveProperty('elevation');
    expect(points[0]).toHaveProperty('distanceFromStart');
    expect(points[0].distanceFromStart).toBe(0);
    expect(points[points.length - 1].distanceFromStart).toBeGreaterThan(4500);
  });

  it('parses hilly course with elevation data', () => {
    const gpxContent = readFileSync(
      path.join(__dirname, '../fixtures/sample-hilly.gpx'),
      'utf-8'
    );
    const points = parseGpx(gpxContent);
    const elevations = points.map(p => p.elevation);
    const maxEle = Math.max(...elevations);
    const minEle = Math.min(...elevations);
    expect(maxEle - minEle).toBeGreaterThan(50); // has real elevation change
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run __tests__/gpx/parser.test.ts`
Expected: FAIL

- [ ] **Step 4: Write GPX parser**

```typescript
import { gpx as parseGpxToGeoJson } from '@tmcw/togeojson';
import { XMLParser } from 'fast-xml-parser';
import type { GpxPoint } from '../engine/types';

/**
 * Parse GPX XML string into structured GpxPoint array.
 * Uses @tmcw/togeojson (typed) for XML→GeoJSON conversion,
 * then calculates cumulative distance from start using Haversine.
 */
export function parseGpx(gpxContent: string): GpxPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxContent, 'text/xml');
  const geoJson = parseGpxToGeoJson(doc);

  const feature = geoJson.features[0];
  if (!feature || feature.geometry.type !== 'LineString') {
    throw new Error('No track found in GPX file');
  }

  const coords = feature.geometry.coordinates; // [lon, lat, ele?][]
  let cumulativeDistance = 0;
  const points: GpxPoint[] = [];

  for (let i = 0; i < coords.length; i++) {
    const [lon, lat, ele] = coords[i];
    if (i > 0) {
      const [prevLon, prevLat] = coords[i - 1];
      cumulativeDistance += haversineDistance(prevLat, prevLon, lat, lon);
    }
    points.push({
      lat,
      lon,
      elevation: ele ?? 0,
      distanceFromStart: cumulativeDistance,
    });
  }

  return points;
}

function haversineDistance(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
```

- [ ] **Step 5: Run parser test**

Run: `npx vitest run __tests__/gpx/parser.test.ts`
Expected: PASS

- [ ] **Step 6: Write elevation profile test**

```typescript
import { describe, it, expect } from 'vitest';
import { buildElevationProfile, buildFlatProfile } from '../../lib/engine/elevation';
import { parseGpx } from '../../lib/gpx/parser';
import { readFileSync } from 'fs';
import path from 'path';

describe('buildElevationProfile', () => {
  it('produces segments per km from hilly GPX', () => {
    const gpx = readFileSync(
      path.join(__dirname, '../fixtures/sample-hilly.gpx'), 'utf-8'
    );
    const points = parseGpx(gpx);
    const profile = buildElevationProfile(points, 5);

    expect(profile.segments.length).toBe(5);
    expect(profile.hasGpx).toBe(true);
    expect(profile.totalElevationGain).toBeGreaterThan(0);
    // Each segment has gradient
    profile.segments.forEach(seg => {
      expect(seg).toHaveProperty('avgGradientPercent');
      expect(seg).toHaveProperty('bearing');
    });
  });

  it('flat course has near-zero gradients', () => {
    const gpx = readFileSync(
      path.join(__dirname, '../fixtures/sample-flat.gpx'), 'utf-8'
    );
    const points = parseGpx(gpx);
    const profile = buildElevationProfile(points, 5);

    profile.segments.forEach(seg => {
      expect(Math.abs(seg.avgGradientPercent)).toBeLessThan(1);
    });
  });
});

describe('buildFlatProfile', () => {
  it('creates uniform profile without GPX', () => {
    const profile = buildFlatProfile(21.1);
    expect(profile.segments.length).toBe(22); // ceil(21.1)
    expect(profile.hasGpx).toBe(false);
    expect(profile.totalElevationGain).toBe(0);
  });

  it('accepts manual elevation gain', () => {
    const profile = buildFlatProfile(21.1, 350);
    expect(profile.manualElevationGain).toBe(350);
    expect(profile.totalElevationGain).toBe(350);
    // Distributes evenly
    const avgGain = profile.segments.reduce((s, seg) => s + seg.elevationGain, 0);
    expect(avgGain).toBeCloseTo(350, 0);
  });
});
```

- [ ] **Step 7: Run elevation test to verify it fails**

Run: `npx vitest run __tests__/engine/elevation.test.ts`
Expected: FAIL

- [ ] **Step 8: Write elevation profile builder**

```typescript
import type { GpxPoint, ElevationSegment, CourseProfile } from './types';

/**
 * Calculate bearing between two GPS points (degrees, 0=N, 90=E).
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2))
    - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function toRad(deg: number): number { return (deg * Math.PI) / 180; }
function toDeg(rad: number): number { return (rad * 180) / Math.PI; }

/**
 * Build elevation profile from parsed GPX points.
 * Groups points into per-km segments with gradient and bearing.
 */
export function buildElevationProfile(points: GpxPoint[], distanceKm: number): CourseProfile {
  const totalKms = Math.ceil(distanceKm);
  const segments: ElevationSegment[] = [];
  let totalGain = 0;
  let totalLoss = 0;

  for (let km = 0; km < totalKms; km++) {
    const startDist = km * 1000;
    const endDist = Math.min((km + 1) * 1000, distanceKm * 1000);

    // Find points in this km range
    const segPoints = points.filter(
      p => p.distanceFromStart >= startDist && p.distanceFromStart <= endDist
    );

    if (segPoints.length < 2) {
      segments.push({
        kmIndex: km,
        startDistance: startDist,
        endDistance: endDist,
        elevationGain: 0,
        elevationLoss: 0,
        avgGradientPercent: 0,
        bearing: 0,
      });
      continue;
    }

    let gain = 0;
    let loss = 0;
    for (let i = 1; i < segPoints.length; i++) {
      const diff = segPoints[i].elevation - segPoints[i - 1].elevation;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }

    const first = segPoints[0];
    const last = segPoints[segPoints.length - 1];
    const horizontalDist = last.distanceFromStart - first.distanceFromStart;
    const elevChange = last.elevation - first.elevation;
    const gradient = horizontalDist > 0 ? (elevChange / horizontalDist) * 100 : 0;
    const bearing = calculateBearing(first.lat, first.lon, last.lat, last.lon);

    totalGain += gain;
    totalLoss += loss;

    segments.push({
      kmIndex: km,
      startDistance: startDist,
      endDistance: endDist,
      elevationGain: gain,
      elevationLoss: loss,
      avgGradientPercent: gradient,
      bearing,
    });
  }

  return {
    distanceKm,
    totalElevationGain: totalGain,
    totalElevationLoss: totalLoss,
    segments,
    hasGpx: true,
  };
}

/**
 * Build flat profile when no GPX is available.
 * Optionally distribute manual elevation gain evenly.
 */
export function buildFlatProfile(distanceKm: number, manualElevationGain?: number): CourseProfile {
  const totalKms = Math.ceil(distanceKm);
  const gainPerKm = manualElevationGain ? manualElevationGain / totalKms : 0;
  const gradientPercent = manualElevationGain
    ? (manualElevationGain / (distanceKm * 1000)) * 100
    : 0;

  const segments: ElevationSegment[] = Array.from({ length: totalKms }, (_, km) => ({
    kmIndex: km,
    startDistance: km * 1000,
    endDistance: Math.min((km + 1) * 1000, distanceKm * 1000),
    elevationGain: gainPerKm,
    elevationLoss: 0,
    avgGradientPercent: gradientPercent,
    bearing: 0,
  }));

  return {
    distanceKm,
    totalElevationGain: manualElevationGain ?? 0,
    totalElevationLoss: 0,
    segments,
    hasGpx: false,
    manualElevationGain,
    warningMessage: 'Sin perfil de elevación, los splits son estimados en terreno plano. Subí el GPX para mejor precisión.',
  };
}
```

- [ ] **Step 9: Run all elevation tests**

Run: `npx vitest run __tests__/engine/elevation.test.ts`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add lib/gpx/ lib/engine/elevation.ts __tests__/gpx/ __tests__/engine/elevation.test.ts __tests__/fixtures/
git commit -m "feat: add GPX parser and elevation profile builder"
```

---

## Task 6: Wind Impact

**Files:**
- Create: `lib/engine/wind.ts`
- Create: `__tests__/engine/wind.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { windImpactPerKm } from '../../lib/engine/wind';

describe('windImpactPerKm', () => {
  it('returns positive seconds (slower) for headwind', () => {
    // Running north (0°), wind from north (0°) = headwind
    const impact = windImpactPerKm(0, 20, 0);
    expect(impact).toBeGreaterThan(0);
  });

  it('returns negative seconds (faster) for tailwind', () => {
    // Running north (0°), wind from south (180°) = tailwind
    const impact = windImpactPerKm(0, 20, 180);
    expect(impact).toBeLessThan(0);
  });

  it('returns ~0 for crosswind', () => {
    // Running north (0°), wind from east (90°) = crosswind
    const impact = windImpactPerKm(0, 20, 90);
    expect(Math.abs(impact)).toBeLessThan(2); // minimal impact
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/wind.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
/**
 * Calculate wind impact on pace for a segment.
 *
 * @param segmentBearing - Direction the runner is heading (degrees, 0=N)
 * @param windSpeedKmh - Wind speed in km/h
 * @param windDirectionDeg - Direction wind comes FROM (meteorological convention, 0=N)
 * @returns Pace adjustment in seconds per km (positive = slower, negative = faster)
 *
 * Based on: headwind resistance is proportional to relative wind speed squared,
 * but tailwind benefit is about 50% of headwind penalty (asymmetric).
 * At 20km/h headwind, expect ~5-8 s/km penalty for a 5:00/km runner.
 */
export function windImpactPerKm(
  segmentBearing: number,
  windSpeedKmh: number,
  windDirectionDeg: number
): number {
  if (windSpeedKmh === 0) return 0;

  // Calculate the angle between wind direction and running direction
  // Wind "comes from" windDirectionDeg, so it "goes to" windDirectionDeg + 180
  const windGoingTo = (windDirectionDeg + 180) % 360;
  const angleDiff = toRad(windGoingTo - segmentBearing);

  // Component of wind along running direction
  // cos(0) = 1 (headwind), cos(180) = -1 (tailwind)
  const headwindComponent = -Math.cos(angleDiff) * windSpeedKmh;

  // Impact formula: ~0.4 seconds per km per km/h of headwind component
  // Asymmetric: tailwind gives only 50% benefit
  const factor = headwindComponent > 0 ? 0.4 : 0.2;

  return headwindComponent * factor;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/engine/wind.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/wind.ts __tests__/engine/wind.test.ts
git commit -m "feat: add wind impact calculator with asymmetric head/tailwind"
```

---

## Task 7: Pacing (Splits per km)

**Files:**
- Create: `lib/engine/pacing.ts`
- Create: `__tests__/engine/pacing.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { generateSplits } from '../../lib/engine/pacing';
import type { CourseProfile, AggregatedWeather } from '../../lib/engine/types';
import { buildFlatProfile } from '../../lib/engine/elevation';

const calmWeather: AggregatedWeather = {
  temperature: 15, humidity: 50, windSpeedKmh: 0,
  windDirectionDeg: 0, sourcesCount: 3, sourceAgreement: 'high', daysUntilRace: 1,
};

describe('generateSplits', () => {
  it('produces uniform splits on flat course with no wind', () => {
    const profile = buildFlatProfile(10);
    const splits = generateSplits(3000, profile, calmWeather); // 10K in 3000s = 5:00/km
    expect(splits.length).toBe(10);
    // All splits should be close to 300s
    splits.forEach(s => {
      expect(s.paceSecondsPerKm).toBeCloseTo(300, 0);
    });
  });

  it('cumulative time sums to total', () => {
    const profile = buildFlatProfile(10);
    const splits = generateSplits(3000, profile, calmWeather);
    const lastSplit = splits[splits.length - 1];
    expect(lastSplit.cumulativeTimeSeconds).toBeCloseTo(3000, 0);
  });

  it('cumulative time sums to total for fractional distance (21.1K)', () => {
    const profile = buildFlatProfile(21.1);
    const splits = generateSplits(6300, profile, calmWeather);
    const lastSplit = splits[splits.length - 1];
    expect(lastSplit.cumulativeTimeSeconds).toBeCloseTo(6300, 0);
  });

  it('slows down on uphills and speeds up on downhills', () => {
    // Simulate 5km: km1 flat, km2 uphill (5%), km3 flat, km4 downhill (-5%), km5 flat
    const profile: CourseProfile = {
      distanceKm: 5,
      totalElevationGain: 50,
      totalElevationLoss: 50,
      hasGpx: true,
      segments: [
        { kmIndex: 0, startDistance: 0, endDistance: 1000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 1, startDistance: 1000, endDistance: 2000, elevationGain: 50, elevationLoss: 0, avgGradientPercent: 5, bearing: 0 },
        { kmIndex: 2, startDistance: 2000, endDistance: 3000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 3, startDistance: 3000, endDistance: 4000, elevationGain: 0, elevationLoss: 50, avgGradientPercent: -5, bearing: 0 },
        { kmIndex: 4, startDistance: 4000, endDistance: 5000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
      ],
    };
    const splits = generateSplits(1500, profile, calmWeather); // 5K in 1500s = 5:00/km
    expect(splits[1].paceSecondsPerKm).toBeGreaterThan(splits[0].paceSecondsPerKm); // uphill slower
    expect(splits[3].paceSecondsPerKm).toBeLessThan(splits[0].paceSecondsPerKm); // downhill faster
  });

  it('adjusts for hot weather (slower pace)', () => {
    const profile = buildFlatProfile(10);
    const hotWeather: AggregatedWeather = {
      ...calmWeather, temperature: 30, humidity: 75,
    };
    const coolSplits = generateSplits(3000, profile, calmWeather);
    const hotSplits = generateSplits(3000, profile, hotWeather);
    // Hot pace should be each km a bit slower (time redistributed)
    expect(hotSplits[0].paceSecondsPerKm).toBeGreaterThanOrEqual(coolSplits[0].paceSecondsPerKm);
  });

  it('adjusts for headwind on segment', () => {
    const profile: CourseProfile = {
      distanceKm: 2, totalElevationGain: 0, totalElevationLoss: 0, hasGpx: true,
      segments: [
        { kmIndex: 0, startDistance: 0, endDistance: 1000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 0 },
        { kmIndex: 1, startDistance: 1000, endDistance: 2000, elevationGain: 0, elevationLoss: 0, avgGradientPercent: 0, bearing: 180 },
      ],
    };
    const windyWeather: AggregatedWeather = {
      ...calmWeather, windSpeedKmh: 25, windDirectionDeg: 0, // wind from north
    };
    const splits = generateSplits(600, profile, windyWeather);
    // km1 heading north, wind from north = headwind → slower
    // km2 heading south, wind from north = tailwind → faster
    expect(splits[0].paceSecondsPerKm).toBeGreaterThan(splits[1].paceSecondsPerKm);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/pacing.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import type { CourseProfile, AggregatedWeather, SplitKm } from './types';
import { windImpactPerKm } from './wind';

/**
 * Elevation adjustment: +6 s/km per 1% uphill, -3 s/km per 1% downhill.
 * Source: spec section 6, Capa 3.
 */
function elevationAdjustment(gradientPercent: number): number {
  if (gradientPercent > 0) return gradientPercent * 6;
  return gradientPercent * 3; // negative gradient * 3 → negative adjustment (faster)
}

/**
 * Climate adjustment factor on pace.
 * Source: Ely et al., 2007. ~0.3-0.5% per degree above 12°C.
 * factor_clima = 1 + ((temp - 12) × 0.004) + ((humidity - 50) × 0.001)
 */
function climateAdjustmentFactor(temperature: number, humidity: number): number {
  // Clamped to 0 for favorable conditions (below 12°C / sub-50% humidity).
  // Conservative choice: we don't predict faster times in cold — too many confounding
  // factors (wind chill, muscle stiffness). Spec formula allows negative but we choose not to.
  const tempEffect = Math.max(0, (temperature - 12) * 0.004);
  const humidityEffect = Math.max(0, (humidity - 50) * 0.001);
  return 1 + tempEffect + humidityEffect;
}

/**
 * Generate per-km splits adjusted for elevation, climate, and wind.
 * Total time is preserved: adjustments redistribute pace across segments
 * so the runner arrives at the target total time.
 */
export function generateSplits(
  totalTimeSeconds: number,
  course: CourseProfile,
  weather: AggregatedWeather
): SplitKm[] {
  const numKms = course.segments.length;
  const basePace = totalTimeSeconds / course.distanceKm;

  // Calculate raw adjustments per km
  const rawAdjustments = course.segments.map(seg => {
    const elev = elevationAdjustment(seg.avgGradientPercent);
    const wind = windImpactPerKm(seg.bearing, weather.windSpeedKmh, weather.windDirectionDeg);
    return elev + wind;
  });

  // Climate factor applies uniformly
  const climateFactor = climateAdjustmentFactor(weather.temperature, weather.humidity);

  // Adjust base pace by climate
  const climatePace = basePace * climateFactor;

  // Apply per-km adjustments, then normalize to preserve total time
  const rawPaces = rawAdjustments.map(adj => climatePace + adj);
  const rawTotal = rawPaces.reduce((sum, p, i) => {
    const kmLength = i < numKms - 1 ? 1 : course.distanceKm - Math.floor(course.distanceKm) || 1;
    return sum + p * kmLength;
  }, 0);

  // Scale factor to preserve total time
  const scale = totalTimeSeconds / rawTotal;

  let cumulative = 0;
  return course.segments.map((seg, i) => {
    const kmLength = i < numKms - 1 ? 1 : course.distanceKm - Math.floor(course.distanceKm) || 1;
    const pace = Math.round(rawPaces[i] * scale);
    cumulative += pace * kmLength;

    let elevationNote: string | undefined;
    if (seg.avgGradientPercent > 2) elevationNote = 'subida';
    else if (seg.avgGradientPercent < -2) elevationNote = 'bajada';

    let windNote: string | undefined;
    const windImpact = windImpactPerKm(seg.bearing, weather.windSpeedKmh, weather.windDirectionDeg);
    if (windImpact > 3) windNote = 'viento en contra';
    else if (windImpact < -2) windNote = 'viento a favor';

    return {
      km: i + 1,
      paceSecondsPerKm: pace,
      cumulativeTimeSeconds: Math.round(cumulative),
      elevationNote,
      windNote,
    };
  });
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/engine/pacing.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/pacing.ts __tests__/engine/pacing.test.ts
git commit -m "feat: add pacing engine with elevation, climate, and wind adjustments"
```

---

## Task 8: Hydration (Sawka Model)

**Files:**
- Create: `lib/engine/hydration.ts`
- Create: `__tests__/engine/hydration.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { generateHydrationPlan } from '../../lib/engine/hydration';
import type { AggregatedWeather, SweatLevel } from '../../lib/engine/types';

const mildWeather: AggregatedWeather = {
  temperature: 15, humidity: 50, windSpeedKmh: 10,
  windDirectionDeg: 0, sourcesCount: 3, sourceAgreement: 'high', daysUntilRace: 1,
};

describe('generateHydrationPlan', () => {
  it('calculates sweat rate for average runner in mild conditions', () => {
    const plan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: mildWeather,
    });
    // Expect 500-1200 ml/h for medium sweater at 5:00/km in mild weather
    expect(plan.sweatRateMlPerHour).toBeGreaterThan(500);
    expect(plan.sweatRateMlPerHour).toBeLessThan(1200);
  });

  it('produces higher sweat rate in hot conditions', () => {
    const hotWeather = { ...mildWeather, temperature: 32, humidity: 75 };
    const mildPlan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: mildWeather,
    });
    const hotPlan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: hotWeather,
    });
    expect(hotPlan.sweatRateMlPerHour).toBeGreaterThan(mildPlan.sweatRateMlPerHour);
  });

  it('high sweater loses more than low sweater', () => {
    const low = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'low',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: mildWeather,
    });
    const high = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'high',
      paceSecondsPerKm: 300, distanceKm: 21.1, weather: mildWeather,
    });
    expect(high.sweatRateMlPerHour).toBeGreaterThan(low.sweatRateMlPerHour);
  });

  it('spaces hydration events every 3-5 km', () => {
    const plan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 42.195, weather: mildWeather,
    });
    expect(plan.events.length).toBeGreaterThan(5);
    // Check spacing between events
    for (let i = 1; i < plan.events.length; i++) {
      const gap = plan.events[i].km - plan.events[i - 1].km;
      expect(gap).toBeGreaterThanOrEqual(2);
      expect(gap).toBeLessThanOrEqual(6);
    }
  });

  it('each drink is between 150-300ml', () => {
    const plan = generateHydrationPlan({
      weightKg: 70, heightCm: 175, sweatLevel: 'medium',
      paceSecondsPerKm: 300, distanceKm: 42.195, weather: mildWeather,
    });
    plan.events.forEach(e => {
      expect(e.mlToDrink).toBeGreaterThanOrEqual(150);
      expect(e.mlToDrink).toBeLessThanOrEqual(300);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/hydration.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import type { AggregatedWeather, SweatLevel, HydrationPlan, HydrationEvent } from './types';
import { calculateBSA } from './bsa';

/**
 * Estimate metabolic rate from running pace (W/m²).
 * Running metabolic rate ≈ 1 kcal/kg/km ≈ 4184 J/kg/km.
 * Convert to W/m² using BSA and pace.
 */
function estimateMetabolicRate(paceSecondsPerKm: number, weightKg: number, bsa: number): number {
  const speedMs = 1000 / paceSecondsPerKm; // m/s
  // Approximate: MR (W) ≈ weight * speed * 3.5 (from ACSM running equation simplified)
  const mrWatts = weightKg * speedMs * 3.5;
  return mrWatts / bsa; // W/m²
}

/**
 * Sawka model for required evaporative cooling (Ereq) and
 * maximum evaporative capacity (Emax).
 * Simplified from: Sawka et al. 2009
 */
function calculateEreq(metabolicRate: number): number {
  // Ereq ≈ metabolic rate * 0.8 (80% of heat must be dissipated by evaporation during running)
  return metabolicRate * 0.8;
}

function calculateEmax(temperature: number, humidity: number, windSpeedKmh: number): number {
  // Emax depends on vapor pressure gradient and air movement
  // Higher temp/humidity → lower Emax (harder to evaporate)
  // Higher wind → higher Emax (better evaporation)
  const vaporPressure = (humidity / 100) * 6.105 * Math.exp((17.27 * temperature) / (237.7 + temperature));
  const maxVapor = 6.105 * Math.exp((17.27 * temperature) / (237.7 + temperature));
  const windFactor = 1 + (windSpeedKmh / 3.6) * 0.1; // convert to m/s, scale
  return Math.max(50, (maxVapor - vaporPressure) * 25 * windFactor);
}

const SWEAT_LEVEL_MULTIPLIER: Record<SweatLevel, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.3,
};

interface HydrationInput {
  weightKg: number;
  heightCm: number;
  sweatLevel: SweatLevel;
  paceSecondsPerKm: number;
  distanceKm: number;
  weather: AggregatedWeather;
}

/**
 * Generate hydration plan using Sawka-based sweat rate model.
 * msw (g/m²/h) = 147 + 1.527 × Ereq - 0.87 × Emax
 * Adjusted by individual sweat level.
 */
export function generateHydrationPlan(input: HydrationInput): HydrationPlan {
  const bsa = calculateBSA(input.weightKg, input.heightCm);
  const metabolicRate = estimateMetabolicRate(input.paceSecondsPerKm, input.weightKg, bsa);
  const ereq = calculateEreq(metabolicRate);
  const emax = calculateEmax(input.weather.temperature, input.weather.humidity, input.weather.windSpeedKmh);

  // Sawka equation: g/m²/h
  const mswPerM2 = 147 + 1.527 * ereq - 0.87 * emax;
  const mswTotal = Math.max(200, mswPerM2) * bsa; // g/h = ml/h (density ≈ 1)
  const sweatRate = mswTotal * SWEAT_LEVEL_MULTIPLIER[input.sweatLevel];

  // Total race duration
  const totalTimeHours = (input.paceSecondsPerKm * input.distanceKm) / 3600;
  const totalFluidLoss = sweatRate * totalTimeHours;

  // Determine drink interval: target 150-300ml per drink
  // Higher sweat rate → more frequent drinks
  const mlPerKm = sweatRate / (3600 / input.paceSecondsPerKm);
  const targetMlPerDrink = 200; // aim for ~200ml
  const kmBetweenDrinks = Math.max(2, Math.min(5, Math.round(targetMlPerDrink / mlPerKm)));
  const mlPerDrink = Math.round(Math.min(300, Math.max(150, mlPerKm * kmBetweenDrinks)));

  // Generate events
  const events: HydrationEvent[] = [];
  let cumulative = 0;
  for (let km = kmBetweenDrinks; km <= input.distanceKm; km += kmBetweenDrinks) {
    cumulative += mlPerDrink;
    events.push({ km, mlToDrink: mlPerDrink, cumulativeMl: cumulative });
  }

  return {
    totalFluidLosseMl: Math.round(totalFluidLoss),
    sweatRateMlPerHour: Math.round(sweatRate),
    events,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/engine/hydration.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/hydration.ts __tests__/engine/hydration.test.ts
git commit -m "feat: add Sawka-based hydration plan generator"
```

---

## Task 9: Nutrition Plan

**Files:**
- Create: `lib/engine/nutrition.ts`
- Create: `__tests__/engine/nutrition.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { generateNutritionPlan } from '../../lib/engine/nutrition';
import type { NutritionProduct } from '../../lib/engine/types';

const gel: NutritionProduct = {
  name: 'Mi gel', carbsGrams: 25, sodiumMg: 50, caffeineMg: 0, type: 'gel',
};
const saltPill: NutritionProduct = {
  name: 'Sal', carbsGrams: 0, sodiumMg: 250, caffeineMg: 0, type: 'salt_pill',
};

describe('generateNutritionPlan', () => {
  it('returns short race message for <75 min effort', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 4200, // 70 min
      distanceKm: 10,
      paceSecondsPerKm: 420,
      products: [gel],
      sweatRateMlPerHour: 800,
      breakfastHoursAgo: 1,
    });
    expect(plan.isShortRace).toBe(true);
    expect(plan.shortRaceMessage).toBeDefined();
    expect(plan.events.length).toBe(0); // no in-race gels
  });

  it('suggests pre-race gel when breakfast >2h ago even for short race', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 4200,
      distanceKm: 10,
      paceSecondsPerKm: 420,
      products: [gel],
      sweatRateMlPerHour: 800,
      breakfastHoursAgo: 3,
    });
    expect(plan.preRaceGel).toBeDefined();
    expect(plan.preRaceGel!.note).toContain('pre-carrera');
  });

  it('no pre-race gel when breakfast was recent', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 4200,
      distanceKm: 10,
      paceSecondsPerKm: 420,
      products: [gel],
      sweatRateMlPerHour: 800,
      breakfastHoursAgo: 1,
    });
    expect(plan.preRaceGel).toBeUndefined();
  });

  it('generates gel events for marathon (>75 min)', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 14400, // 4 hours
      distanceKm: 42.195,
      paceSecondsPerKm: 341,
      products: [gel, saltPill],
      sweatRateMlPerHour: 1000,
      breakfastHoursAgo: 3,
    });
    expect(plan.isShortRace).toBe(false);
    expect(plan.events.length).toBeGreaterThan(5);
    expect(plan.totalCarbsNeeded).toBeGreaterThan(200); // 4h * 60g/h minimum
  });

  it('includes salt pills based on sweat rate', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 14400,
      distanceKm: 42.195,
      paceSecondsPerKm: 341,
      products: [gel, saltPill],
      sweatRateMlPerHour: 1500,
      breakfastHoursAgo: 3,
    });
    const saltEvents = plan.events.filter(e => e.product.type === 'salt_pill');
    expect(saltEvents.length).toBeGreaterThan(0);
  });

  it('always includes disclaimer', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 14400,
      distanceKm: 42.195,
      paceSecondsPerKm: 341,
      products: [gel],
      sweatRateMlPerHour: 800,
      breakfastHoursAgo: 3,
    });
    expect(plan.disclaimer).toContain('médico');
  });

  it('first gel around 45 minutes', () => {
    const plan = generateNutritionPlan({
      totalTimeSeconds: 14400,
      distanceKm: 42.195,
      paceSecondsPerKm: 341,
      products: [gel],
      sweatRateMlPerHour: 800,
      breakfastHoursAgo: 3,
    });
    const firstGel = plan.events[0];
    expect(firstGel.minutesSinceStart).toBeGreaterThanOrEqual(40);
    expect(firstGel.minutesSinceStart).toBeLessThanOrEqual(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/nutrition.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import type { NutritionProduct, NutritionPlan, NutritionEvent } from './types';

const SHORT_RACE_THRESHOLD_SECONDS = 75 * 60; // 75 minutes
const CARBS_PER_HOUR_MIN = 60; // grams
const CARBS_PER_HOUR_MAX = 90;
const FIRST_GEL_MINUTES = 45;
const GEL_INTERVAL_MINUTES = 30;
const SODIUM_MG_PER_LITER_SWEAT = 1000; // average sodium concentration in sweat
const DISCLAIMER = 'Este plan es orientativo. Consultá siempre a tu médico antes de seguir cualquier plan de nutrición deportiva.';

interface NutritionInput {
  totalTimeSeconds: number;
  distanceKm: number;
  paceSecondsPerKm: number;
  products: NutritionProduct[];
  sweatRateMlPerHour: number;
  breakfastHoursAgo: number;
}

export function generateNutritionPlan(input: NutritionInput): NutritionPlan {
  const isShortRace = input.totalTimeSeconds < SHORT_RACE_THRESHOLD_SECONDS;
  const gel = input.products.find(p => p.type === 'gel');
  const saltPill = input.products.find(p => p.type === 'salt_pill');

  // Pre-race gel logic
  let preRaceGel: NutritionEvent | undefined;
  if (gel && input.breakfastHoursAgo > 2) {
    preRaceGel = {
      km: 0,
      minutesSinceStart: -5,
      product: gel,
      carbsGrams: gel.carbsGrams,
      sodiumMg: gel.sodiumMg,
      note: 'Gel pre-carrera (5 min antes de largar)',
    };
  }

  if (isShortRace) {
    return {
      totalCarbsNeeded: 0,
      totalSodiumNeeded: 0,
      events: [],
      isShortRace: true,
      shortRaceMessage: 'Para esta distancia y ritmo no necesitás suplementar durante la carrera. Hidratación normal alcanza.',
      preRaceGel,
      disclaimer: DISCLAIMER,
    };
  }

  // Long race: calculate needs
  const totalTimeHours = input.totalTimeSeconds / 3600;
  const carbsPerHour = Math.min(CARBS_PER_HOUR_MAX, Math.max(CARBS_PER_HOUR_MIN, 60 + (totalTimeHours - 1.5) * 10));
  const totalCarbsNeeded = Math.round(carbsPerHour * totalTimeHours);
  const totalSodiumNeeded = Math.round((input.sweatRateMlPerHour / 1000) * SODIUM_MG_PER_LITER_SWEAT * totalTimeHours);

  const events: NutritionEvent[] = [];

  if (gel) {
    // Place gels starting at ~45 min, every ~30 min
    let minutesCursor = FIRST_GEL_MINUTES;
    let carbsDelivered = 0;

    while (minutesCursor < (input.totalTimeSeconds / 60) - 10) {
      const km = Math.round(minutesCursor / (input.paceSecondsPerKm / 60));
      events.push({
        km,
        minutesSinceStart: minutesCursor,
        product: gel,
        carbsGrams: gel.carbsGrams,
        sodiumMg: gel.sodiumMg,
      });
      carbsDelivered += gel.carbsGrams;
      minutesCursor += GEL_INTERVAL_MINUTES;
    }
  }

  // Salt pills: distribute based on sodium needs vs what gels provide
  if (saltPill) {
    const sodiumFromGels = events.reduce((sum, e) => sum + e.sodiumMg, 0);
    const sodiumDeficit = totalSodiumNeeded - sodiumFromGels;

    if (sodiumDeficit > 0) {
      const pillsNeeded = Math.ceil(sodiumDeficit / saltPill.sodiumMg);
      const intervalMinutes = (input.totalTimeSeconds / 60) / (pillsNeeded + 1);

      for (let i = 1; i <= pillsNeeded; i++) {
        const minutesMark = Math.round(intervalMinutes * i);
        const km = Math.round(minutesMark / (input.paceSecondsPerKm / 60));
        events.push({
          km,
          minutesSinceStart: minutesMark,
          product: saltPill,
          carbsGrams: 0,
          sodiumMg: saltPill.sodiumMg,
        });
      }
    }
  }

  // Sort by km
  events.sort((a, b) => a.km - b.km);

  return {
    totalCarbsNeeded,
    totalSodiumNeeded,
    events,
    isShortRace: false,
    preRaceGel,
    disclaimer: DISCLAIMER,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/engine/nutrition.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/nutrition.ts __tests__/engine/nutrition.test.ts
git commit -m "feat: add nutrition plan generator with 75min threshold and salt pills"
```

---

## Task 10: Confidence Calculator

**Files:**
- Create: `lib/engine/confidence.ts`
- Create: `__tests__/engine/confidence.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateConfidence } from '../../lib/engine/confidence';
import type { ConfidenceInputs } from '../../lib/engine/types';

describe('calculateConfidence', () => {
  it('returns high confidence with ideal inputs', () => {
    const result = calculateConfidence({
      referenceRaceCount: 10,
      mostRecentRaceMonthsAgo: 1,
      allRacesWithin6Months: true,
      weatherSourceAgreement: 'high',
      daysUntilRace: 1,
      hasGpx: true,
    });
    expect(result).toBeGreaterThan(90);
  });

  it('returns low confidence with minimal inputs and distant race', () => {
    const result = calculateConfidence({
      referenceRaceCount: 1,
      mostRecentRaceMonthsAgo: 10,
      allRacesWithin6Months: false,
      weatherSourceAgreement: 'low',
      daysUntilRace: 60,
      hasGpx: false,
    });
    expect(result).toBeLessThan(50);
  });

  it('more reference races increases confidence', () => {
    const base: ConfidenceInputs = {
      referenceRaceCount: 1, mostRecentRaceMonthsAgo: 1,
      allRacesWithin6Months: true, weatherSourceAgreement: 'high',
      daysUntilRace: 1, hasGpx: true,
    };
    const few = calculateConfidence(base);
    const many = calculateConfidence({ ...base, referenceRaceCount: 10 });
    expect(many).toBeGreaterThan(few);
  });

  it('closer race date increases confidence', () => {
    const base: ConfidenceInputs = {
      referenceRaceCount: 5, mostRecentRaceMonthsAgo: 1,
      allRacesWithin6Months: true, weatherSourceAgreement: 'high',
      daysUntilRace: 30, hasGpx: true,
    };
    const far = calculateConfidence(base);
    const close = calculateConfidence({ ...base, daysUntilRace: 2 });
    expect(close).toBeGreaterThan(far);
  });

  it('returns value between 0 and 100', () => {
    const result = calculateConfidence({
      referenceRaceCount: 5, mostRecentRaceMonthsAgo: 3,
      allRacesWithin6Months: true, weatherSourceAgreement: 'medium',
      daysUntilRace: 7, hasGpx: true,
    });
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('GPX presence improves confidence', () => {
    const base: ConfidenceInputs = {
      referenceRaceCount: 5, mostRecentRaceMonthsAgo: 1,
      allRacesWithin6Months: true, weatherSourceAgreement: 'high',
      daysUntilRace: 3, hasGpx: false,
    };
    const noGpx = calculateConfidence(base);
    const withGpx = calculateConfidence({ ...base, hasGpx: true });
    expect(withGpx).toBeGreaterThan(noGpx);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/confidence.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import type { ConfidenceInputs } from './types';

/**
 * Calculate confidence percentage (0-100) for a race prediction.
 *
 * Formula: weighted average of 5 factors.
 * Weights: races 0.20, recency 0.15, days 0.25, weather agreement 0.25, gpx 0.15
 *
 * Source: spec section 11.3
 */
export function calculateConfidence(inputs: ConfidenceInputs): number {
  const racesScore = raceCountScore(inputs.referenceRaceCount);
  const recencyScore = recencyScoreCalc(inputs.mostRecentRaceMonthsAgo, inputs.allRacesWithin6Months);
  const daysScore = daysUntilRaceScore(inputs.daysUntilRace);
  const weatherScore = weatherAgreementScore(inputs.weatherSourceAgreement);
  const gpxScore = inputs.hasGpx ? 100 : 75;

  const confidence =
    racesScore * 0.20 +
    recencyScore * 0.15 +
    daysScore * 0.25 +
    weatherScore * 0.25 +
    gpxScore * 0.15;

  return Math.round(Math.min(100, Math.max(0, confidence)));
}

function raceCountScore(count: number): number {
  if (count >= 10) return 95;
  if (count >= 5) return 85;
  if (count >= 3) return 70;
  return 50;
}

function recencyScoreCalc(mostRecentMonths: number, allWithin6: boolean): number {
  let score = allWithin6 ? 100 : 85;
  if (mostRecentMonths > 12) score -= 25;
  else if (mostRecentMonths > 6) score -= 15;
  return Math.max(0, score);
}

function daysUntilRaceScore(days: number): number {
  if (days <= 2) return 95;
  if (days <= 7) return 80;
  if (days <= 14) return 60;
  if (days <= 30) return 40;
  return 25;
}

function weatherAgreementScore(agreement: 'high' | 'medium' | 'low'): number {
  switch (agreement) {
    case 'high': return 100;
    case 'medium': return 85;
    case 'low': return 60;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/engine/confidence.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/confidence.ts __tests__/engine/confidence.test.ts
git commit -m "feat: add weighted confidence calculator"
```

---

## Task 11: Plan Orchestrator

**Files:**
- Create: `lib/engine/plan.ts`
- Create: `__tests__/engine/plan.test.ts`

This is the entry point that combines all modules into a complete `TripleObjectivePlan`.

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { generateRacePlan } from '../../lib/engine/plan';
import type { RunnerProfile, CourseProfile, AggregatedWeather } from '../../lib/engine/types';
import { buildFlatProfile } from '../../lib/engine/elevation';

const runner: RunnerProfile = {
  weightKg: 70,
  heightCm: 175,
  sweatLevel: 'medium',
  referenceRaces: [
    { distanceKm: 10, timeSeconds: 3000, date: '2026-03-01', type: 'race' },
    { distanceKm: 21.1, timeSeconds: 6500, date: '2026-02-15', type: 'race' },
  ],
  weeklyKm: 60,
  nutritionProducts: [
    { name: 'Gel', carbsGrams: 25, sodiumMg: 50, caffeineMg: 0, type: 'gel' },
    { name: 'Sal', carbsGrams: 0, sodiumMg: 250, caffeineMg: 0, type: 'salt_pill' },
  ],
};

const weather: AggregatedWeather = {
  temperature: 20, humidity: 60, windSpeedKmh: 10,
  windDirectionDeg: 180, sourcesCount: 3, sourceAgreement: 'high', daysUntilRace: 3,
};

describe('generateRacePlan', () => {
  it('generates complete plan without target (forecast only)', () => {
    const course = buildFlatProfile(21.1);
    const plan = generateRacePlan({ runner, course, weather, breakfastHoursAgo: 3 });

    expect(plan.forecast).toBeDefined();
    expect(plan.forecast.prediction.type).toBe('forecast');
    expect(plan.forecast.splits.length).toBe(22); // ceil(21.1)
    expect(plan.forecast.hydration.events.length).toBeGreaterThan(0);
    expect(plan.forecast.nutrition.events.length).toBeGreaterThan(0);
    expect(plan.forecast.confidence).toBeGreaterThan(0);
    expect(plan.target).toBeUndefined();
    expect(plan.consensus).toBeUndefined();
  });

  it('generates triple objective when target is set', () => {
    const course = buildFlatProfile(21.1);
    const targetPacePerKm = 290; // 4:50/km
    const plan = generateRacePlan({ runner, course, weather, targetPacePerKm, breakfastHoursAgo: 3 });

    expect(plan.forecast).toBeDefined();
    expect(plan.target).toBeDefined();
    expect(plan.consensus).toBeDefined();
    expect(plan.target!.prediction.type).toBe('target');
    expect(plan.consensus!.prediction.type).toBe('consensus');
  });

  it('10K short race has educational nutrition message', () => {
    const fastRunner: RunnerProfile = {
      ...runner,
      referenceRaces: [
        { distanceKm: 10, timeSeconds: 2400, date: '2026-03-01', type: 'race' },
      ],
    };
    const course = buildFlatProfile(10);
    const plan = generateRacePlan({ runner: fastRunner, course, weather, breakfastHoursAgo: 3 });
    expect(plan.forecast.nutrition.isShortRace).toBe(true);
  });

  it('all three plans have different paces', () => {
    const course = buildFlatProfile(42.195);
    const plan = generateRacePlan({
      runner, course, weather, targetPacePerKm: 270, breakfastHoursAgo: 3,
    });
    const fPace = plan.forecast.prediction.paceSecondsPerKm;
    const tPace = plan.target!.prediction.paceSecondsPerKm;
    const cPace = plan.consensus!.prediction.paceSecondsPerKm;
    expect(fPace).not.toBe(tPace);
    expect(cPace).not.toBe(fPace);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/engine/plan.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import type {
  RunnerProfile, CourseProfile, AggregatedWeather,
  RacePlan, TripleObjectivePlan, Prediction, ConfidenceInputs,
} from './types';
import { predictTime } from './predictor';
import { calculateConsensus } from './consensus';
import { generateSplits } from './pacing';
import { generateHydrationPlan } from './hydration';
import { generateNutritionPlan } from './nutrition';
import { calculateConfidence } from './confidence';

interface GenerateInput {
  runner: RunnerProfile;
  course: CourseProfile;
  weather: AggregatedWeather;
  targetPacePerKm?: number;
  breakfastHoursAgo: number;
}

function buildConfidenceInputs(runner: RunnerProfile, weather: AggregatedWeather, hasGpx: boolean): ConfidenceInputs {
  const now = new Date();
  const raceDates = runner.referenceRaces.map(r => new Date(r.date));
  const mostRecent = Math.min(...raceDates.map(d => (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const allWithin6 = raceDates.every(d => (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30) <= 6);

  return {
    referenceRaceCount: runner.referenceRaces.length,
    mostRecentRaceMonthsAgo: mostRecent,
    allRacesWithin6Months: allWithin6,
    weatherSourceAgreement: weather.sourceAgreement,
    daysUntilRace: weather.daysUntilRace,
    hasGpx,
  };
}

function buildSinglePlan(
  prediction: Prediction,
  runner: RunnerProfile,
  course: CourseProfile,
  weather: AggregatedWeather,
  confidence: number,
  breakfastHoursAgo: number
): RacePlan {
  const splits = generateSplits(prediction.timeSeconds, course, weather);

  const hydration = generateHydrationPlan({
    weightKg: runner.weightKg,
    heightCm: runner.heightCm,
    sweatLevel: runner.sweatLevel,
    paceSecondsPerKm: prediction.paceSecondsPerKm,
    distanceKm: course.distanceKm,
    weather,
  });

  const nutrition = generateNutritionPlan({
    totalTimeSeconds: prediction.timeSeconds,
    distanceKm: course.distanceKm,
    paceSecondsPerKm: prediction.paceSecondsPerKm,
    products: runner.nutritionProducts,
    sweatRateMlPerHour: hydration.sweatRateMlPerHour,
    breakfastHoursAgo,
  });

  return { prediction, splits, hydration, nutrition, confidence, course, weather };
}

/**
 * Generate a complete race plan with optional triple objective.
 * This is the main entry point for the engine.
 */
export function generateRacePlan(input: GenerateInput): TripleObjectivePlan {
  const { runner, course, weather, targetPacePerKm, breakfastHoursAgo } = input;

  // Predict time
  const forecastTime = predictTime(
    runner.referenceRaces,
    course.distanceKm,
    { weeklyKm: runner.weeklyKm }
  );
  const forecastPace = Math.round(forecastTime / course.distanceKm);

  const confidence = calculateConfidence(
    buildConfidenceInputs(runner, weather, course.hasGpx)
  );

  // Forecast plan
  const forecastPrediction: Prediction = {
    timeSeconds: Math.round(forecastTime),
    paceSecondsPerKm: forecastPace,
    type: 'forecast',
  };
  const forecastPlan = buildSinglePlan(
    forecastPrediction, runner, course, weather, confidence, breakfastHoursAgo
  );

  if (!targetPacePerKm) {
    return { forecast: forecastPlan };
  }

  // Target plan
  const targetTime = Math.round(targetPacePerKm * course.distanceKm);
  const targetPrediction: Prediction = {
    timeSeconds: targetTime,
    paceSecondsPerKm: targetPacePerKm,
    type: 'target',
  };
  const targetPlan = buildSinglePlan(
    targetPrediction, runner, course, weather, confidence, breakfastHoursAgo
  );

  // Consensus plan
  const consensusResult = calculateConsensus(forecastPace, targetPacePerKm, course.distanceKm);
  const consensusPrediction: Prediction = {
    timeSeconds: consensusResult.timeSeconds,
    paceSecondsPerKm: consensusResult.paceSecondsPerKm,
    type: 'consensus',
    label: consensusResult.label,
  };
  const consensusPlan = buildSinglePlan(
    consensusPrediction, runner, course, weather, confidence, breakfastHoursAgo
  );

  return {
    forecast: forecastPlan,
    target: targetPlan,
    consensus: consensusPlan,
  };
}
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/plan.ts __tests__/engine/plan.test.ts
git commit -m "feat: add plan orchestrator - complete engine core"
```

---

## Task 12: Final Integration Test & Cleanup

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL tests pass across all files

- [ ] **Step 2: Create engine barrel export**

Create `lib/engine/index.ts`:

```typescript
export { generateRacePlan } from './plan';
export { predictTime, fitExponent } from './predictor';
export { calculateConsensus } from './consensus';
export { generateSplits } from './pacing';
export { generateHydrationPlan } from './hydration';
export { generateNutritionPlan } from './nutrition';
export { calculateConfidence } from './confidence';
export { calculateBSA } from './bsa';
export { buildElevationProfile, buildFlatProfile } from './elevation';
export { windImpactPerKm } from './wind';
export { parseGpx } from '../gpx/parser';
export * from './types';
```

- [ ] **Step 3: Verify barrel export compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Final commit**

```bash
git add lib/engine/index.ts
git commit -m "feat: add barrel export - engine v1 complete"
```

---

## Summary

| Task | Module | What it does |
|------|--------|-------------|
| 0 | Setup | Project scaffolding, TS, Vitest |
| 1 | Types | All interfaces and contracts |
| 2 | BSA | DuBois body surface area |
| 3 | Predictor | Riegel adjusted with recency weighting |
| 4 | Consensus | Triple objective s/km rules |
| 5 | GPX + Elevation | Parser + per-km gradient + bearing |
| 6 | Wind | Asymmetric head/tailwind impact |
| 7 | Pacing | Splits adjusted by elevation + climate + wind |
| 8 | Hydration | Sawka model with BSA |
| 9 | Nutrition | Gel + salt timing with 75min threshold |
| 10 | Confidence | Weighted 5-factor percentage |
| 11 | Plan | Orchestrator combining all modules |
| 12 | Cleanup | Integration test + barrel export |
