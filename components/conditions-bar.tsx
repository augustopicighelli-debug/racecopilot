'use client';

/**
 * ConditionsBar — barra de condiciones full-width que reacciona al objetivo seleccionado.
 *
 * Score 0–100 compuesto por:
 *   1. Condiciones climáticas base (temperatura, humedad, viento)
 *   2. Penalidad/bonificación según qué tan ambicioso es el tiempo seleccionado
 *      vs el pronóstico base del engine.
 *
 * Ejemplo: clima perfecto (85pts) + target 8% más rápido que forecast → ~65pts
 */

import { useLang } from '@/lib/lang';
import type { AggregatedWeather, TripleObjectivePlan } from '@/lib/engine/types';

type Objective = 'forecast' | 'target' | 'consensus';

interface ConditionsBarProps {
  plan:     TripleObjectivePlan;
  selected: Objective;
  weather:  AggregatedWeather;   // clima del plan activo
}

// ── Score climático base (idéntico al de WeatherCard) ──────────────────────
function weatherScore(w: AggregatedWeather): number {
  if (w.sourcesCount === 0) return 50; // neutral → punto medio

  const temp = w.temperature;
  let tScore: number;
  if (temp >= 8 && temp <= 15)       tScore = 40;
  else if (temp > 15 && temp <= 20)  tScore = 40 - (temp - 15) * 3;
  else if (temp > 20 && temp <= 28)  tScore = 25 - (temp - 20) * 2.5;
  else if (temp > 28)                tScore = Math.max(0, 5 - (temp - 28) * 2);
  else if (temp >= 0 && temp < 8)    tScore = 40 - (8 - temp) * 2.5;
  else                               tScore = Math.max(0, 20 - Math.abs(temp) * 3);
  tScore = Math.max(0, Math.min(40, tScore));

  const hum = w.humidity;
  let hScore = hum <= 60 ? 30 : hum <= 75 ? 30 - (hum - 60) * 1.5 : Math.max(0, 7.5 - (hum - 75) * 0.5);
  hScore = Math.max(0, Math.min(30, hScore));

  const wind = w.windSpeedKmh;
  let wScore = wind <= 15 ? 30 : wind <= 25 ? 30 - (wind - 15) * 2 : Math.max(0, 10 - (wind - 25) * 0.67);
  wScore = Math.max(0, Math.min(30, wScore));

  return Math.round(tScore + hScore + wScore);
}

/**
 * Score total para el objetivo seleccionado.
 *
 * Base: score climático (temperatura, humedad, viento) → 0–100.
 * Ajuste: diferencia absoluta en segundos entre el tiempo del objetivo y el forecast.
 *   - Forecast: sin ajuste (es el pronóstico realista del engine)
 *   - Target más rápido que forecast → condiciones necesitan ser mejores → baja el score
 *   - Target más lento → condiciones sobran → sube el score
 *   - Consenso: ajuste a mitad de camino entre forecast y target
 *
 * Escala: cada 60 segundos más ambicioso que el forecast ≈ -8 puntos.
 * Ejemplo: target 4 min más rápido que forecast → -32 pts.
 */
function computeScore(
  plan:     TripleObjectivePlan,
  selected: Objective,
  weather:  AggregatedWeather
): number {
  const base = weatherScore(weather);

  // Sin plan target/consensus → solo el score climático
  if (selected === 'forecast' || !plan.target) return base;

  const forecastTime = plan.forecast.prediction.timeSeconds;

  if (selected === 'target') {
    const targetTime = plan.target.prediction.timeSeconds;
    // deltaSeconds > 0 → target MÁS RÁPIDO (más exigente) → penalidad
    const deltaSeconds = forecastTime - targetTime;
    const adjustment   = -(deltaSeconds / 60) * 8; // 60s más rápido → -8 pts
    return Math.round(Math.max(5, Math.min(100, base + adjustment)));
  }

  if (selected === 'consensus' && plan.consensus) {
    const consensusTime = plan.consensus.prediction.timeSeconds;
    const deltaSeconds  = forecastTime - consensusTime;
    const adjustment    = -(deltaSeconds / 60) * 8;
    return Math.round(Math.max(5, Math.min(100, base + adjustment)));
  }

  return base;
}

/** Etiqueta y colores según el score */
function scoreStyle(score: number, t: ReturnType<typeof useLang>['t']) {
  const p = t.plan;
  if (score >= 80) return { label: p.condIdeal    ?? 'Ideales',        color: '#4ade80', track: 'rgba(74,222,128,0.2)' };
  if (score >= 60) return { label: p.condGood     ?? 'Buenas',         color: '#86efac', track: 'rgba(134,239,172,0.15)' };
  if (score >= 40) return { label: p.condFair     ?? 'Aceptables',     color: '#fbbf24', track: 'rgba(251,191,36,0.15)' };
  if (score >= 20) return { label: p.condHard     ?? 'Difíciles',      color: '#f97316', track: 'rgba(249,115,22,0.15)' };
  return              { label: p.condVeryHard  ?? 'Muy difíciles',  color: '#f87171', track: 'rgba(248,113,113,0.15)' };
}

export function ConditionsBar({ plan, selected, weather }: ConditionsBarProps) {
  const { t } = useLang();
  const p = t.plan;

  const score = computeScore(plan, selected, weather);
  const style = scoreStyle(score, t);

  const objectiveLabel =
    selected === 'forecast'  ? (p.labelForecast  ?? 'Pronóstico') :
    selected === 'target'    ? (p.labelTarget     ?? 'Target')     :
    (p.labelConsensus ?? 'Consenso');

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {p.conditionsLabel ?? 'Condiciones para el tiempo objetivo'}
          <span className="ml-1.5 opacity-70">· {objectiveLabel}</span>
        </p>
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full transition-all duration-500"
          style={{ background: style.track, color: style.color }}
        >
          {style.label}
        </span>
      </div>

      {/* Barra completa */}
      <div className="relative h-3 rounded-full overflow-visible"
        style={{ background: 'linear-gradient(to right, #f87171 0%, #fbbf24 45%, #86efac 75%, #4ade80 100%)' }}
      >
        {/* Needle — se mueve con CSS transition cuando cambia el score */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg"
          style={{
            left:       `calc(${score}% - 10px)`,
            background: style.color,
            transition: 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // spring suave
          }}
        />
      </div>

      {/* Etiquetas de extremos */}
      <div className="flex justify-between mt-2">
        <span className="text-xs" style={{ color: '#f87171' }}>
          {p.condVeryHard ?? 'Muy difíciles'}
        </span>
        <span className="text-xs" style={{ color: '#4ade80' }}>
          {p.condIdeal ?? 'Ideales'}
        </span>
      </div>
    </div>
  );
}
