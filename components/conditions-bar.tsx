'use client';

/**
 * ConditionsBar — barra de nivel de exigencia del objetivo seleccionado.
 *
 * Lógica de posicionamiento RELATIVA entre los planes disponibles:
 *   - El plan más conservador (tiempo más largo = más fácil) → siempre en el extremo derecho
 *   - El plan más ambicioso (tiempo más corto = más difícil) → siempre en el extremo izquierdo
 *   - Los intermedios se interpolan en ese rango
 *
 * Esto garantiza que el needle siempre se mueva al cambiar el selector,
 * aunque las diferencias de tiempo sean pequeñas (ej: 3min en un maratón de 3h30).
 *
 * Cuando solo hay un plan (sin target ni consensus): posición fija en 75.
 */

import { useLang } from '@/lib/lang';
import type { TripleObjectivePlan } from '@/lib/engine/types';

type Objective = 'forecast' | 'target' | 'consensus';

interface ConditionsBarProps {
  plan:     TripleObjectivePlan;
  selected: Objective;
}

/**
 * Calcula la posición 0–100 del objetivo seleccionado en escala relativa.
 * 100 = más conservador (más a la derecha), 0 = más ambicioso (más a la izquierda).
 * Los extremos se mapean a [15, 90] para que nunca toque los bordes.
 */
function computePosition(plan: TripleObjectivePlan, selected: Objective): number {
  const times: Record<string, number> = {
    forecast: plan.forecast.prediction.timeSeconds,
  };
  if (plan.target)    times.target    = plan.target.prediction.timeSeconds;
  if (plan.consensus) times.consensus = plan.consensus.prediction.timeSeconds;

  const allTimes = Object.values(times);

  // Solo un plan disponible: posición fija
  if (allTimes.length === 1) return 75;

  const maxTime = Math.max(...allTimes); // más conservador → derecha
  const minTime = Math.min(...allTimes); // más ambicioso  → izquierda
  const spread  = maxTime - minTime;

  // Si los tiempos son idénticos (spread = 0), posición media
  if (spread === 0) return 55;

  const selectedTime = times[selected] ?? times.forecast;

  // Mapear [minTime, maxTime] → [15, 90]
  const raw = (selectedTime - minTime) / spread; // 0 (ambicioso) → 1 (conservador)
  return Math.round(15 + raw * 75);
}

/** Etiqueta según la posición relativa */
function positionLabel(pos: number, t: ReturnType<typeof useLang>['t']): {
  label: string; color: string; bgColor: string;
} {
  const p = t.plan;
  if (pos >= 75) return { label: p.condConservative ?? 'Conservador',   color: '#4ade80', bgColor: 'rgba(74,222,128,0.15)' };
  if (pos >= 52) return { label: p.condBalanced    ?? 'Equilibrado',    color: '#86efac', bgColor: 'rgba(134,239,172,0.12)' };
  if (pos >= 35) return { label: p.condAmbitious   ?? 'Ambicioso',      color: '#fbbf24', bgColor: 'rgba(251,191,36,0.12)' };
  return              { label: p.condVeryAmbitious ?? 'Muy ambicioso',  color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' };
}

/** Etiqueta y colores según el score */
export function ConditionsBar({ plan, selected }: ConditionsBarProps) {
  const { t } = useLang();
  const p = t.plan;

  const pos   = computePosition(plan, selected);
  const style = positionLabel(pos, t);

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
          {p.conditionsLabel ?? 'Nivel de exigencia'}
          <span className="ml-1.5 opacity-70">· {objectiveLabel}</span>
        </p>
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full transition-all duration-500"
          style={{ background: style.bgColor, color: style.color }}
        >
          {style.label}
        </span>
      </div>

      {/* Barra completa */}
      <div
        className="relative h-3 rounded-full overflow-visible"
        style={{ background: 'linear-gradient(to right, #f97316 0%, #fbbf24 40%, #86efac 75%, #4ade80 100%)' }}
      >
        {/* Needle animada con spring */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg"
          style={{
            left:       `calc(${pos}% - 10px)`,
            background: style.color,
            transition: 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>

      {/* Extremos de la escala */}
      <div className="flex justify-between mt-2">
        <span className="text-xs" style={{ color: '#f97316' }}>
          {p.condVeryAmbitious ?? 'Muy ambicioso'}
        </span>
        <span className="text-xs" style={{ color: '#4ade80' }}>
          {p.condConservative ?? 'Conservador'}
        </span>
      </div>
    </div>
  );
}
