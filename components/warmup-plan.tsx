'use client';
// Componente: Plan de calentamiento pre-carrera.
// Genera una línea de tiempo de preparación basada en distancia y clima.
// No necesita llamada a la API — usa los datos del plan ya cargado.
import type { AggregatedWeather } from '@/lib/engine/types';
import { useLang } from '@/lib/lang';

interface WarmupPlanProps {
  distanceKm: number;
  weather:    AggregatedWeather;
}

interface WarmupStep {
  minutesBefore: number;  // minutos antes de la largada
  icon:          string;
  action:        string;
  detail?:       string;
}

/**
 * Genera los pasos del calentamiento según distancia y clima.
 * - Distancia corta (< 10km): calentamiento agresivo con strides
 * - Media distancia (10-21km): moderado
 * - Maratón y ultra (> 21km): mínimo — la carrera en sí es el warmup
 * - Frío (< 10°C): pasos más largos, conservar calor hasta último momento
 * - Calor (> 22°C): pasos más cortos para no elevar temperatura corporal
 */
function buildWarmupSteps(distanceKm: number, weather: AggregatedWeather): WarmupStep[] {
  const isCold = weather.temperature < 10;
  const isHot  = weather.temperature > 22;

  // Clasificar la carrera por distancia
  const isShort  = distanceKm <= 10;
  const isMid    = distanceKm > 10 && distanceKm <= 21.5;
  const isLong   = distanceKm > 21.5;

  const steps: WarmupStep[] = [];

  // ── 90 minutos antes ─────────────────────────────────────────────────────
  steps.push({
    minutesBefore: 90,
    icon:  '🍌',
    action: 'Último snack ligero',
    detail: 'Banana o tostadas con mermelada. Nada pesado ni nuevo.',
  });

  // ── 60 minutos antes ─────────────────────────────────────────────────────
  steps.push({
    minutesBefore: 60,
    icon:  '📦',
    action: 'Llegada y entrega de bolso',
    detail: 'Dejá el bolso, confirmá el corral, orientate en el recorrido de salida.',
  });

  // ── 45 minutos antes ─────────────────────────────────────────────────────
  steps.push({
    minutesBefore: 45,
    icon:  '💧',
    action: isHot ? 'Hidratación extra (400ml)' : 'Hidratación (250ml)',
    detail: isHot
      ? 'Con calor perdés líquido solo esperando. Bebé antes de sudar.'
      : 'Agua o bebida isotónica. No más de 500ml para evitar molestias.',
  });

  // ── Trote de activación ───────────────────────────────────────────────────
  if (isShort) {
    const trotMin = isCold ? 15 : isHot ? 8 : 12;
    steps.push({
      minutesBefore: 35,
      icon:  '🏃',
      action: `Trote suave ${trotMin} min`,
      detail: 'Ritmo muy cómodo (~70-75% FC máx). Activar circulación sin gastar energía.',
    });
  } else if (isMid) {
    const trotMin = isCold ? 10 : isHot ? 5 : 8;
    steps.push({
      minutesBefore: 30,
      icon:  '🏃',
      action: `Trote suave ${trotMin} min`,
      detail: 'Ligero. Con frío, empezá más tarde del corral.',
    });
  } else {
    // Maratón/ultra: caminata o trote muy suave
    const trotMin = isCold ? 8 : 5;
    steps.push({
      minutesBefore: 20,
      icon:  '🚶',
      action: `Caminata rápida ${trotMin} min (maratón)`,
      detail: 'Para maratón el calentamiento es mínimo. Los primeros 5km de la carrera son el warmup.',
    });
  }

  // ── Ejercicios dinámicos ──────────────────────────────────────────────────
  steps.push({
    minutesBefore: isShort ? 22 : isMid ? 20 : 12,
    icon:  '🦵',
    action: 'Ejercicios dinámicos (5-7 min)',
    detail: 'Rodillas al pecho · Talones a glúteos · Leg swings · Círculos de cadera · Lateral shuffle',
  });

  // ── Strides (solo para cortas y medias) ───────────────────────────────────
  if (!isLong) {
    const strideCount = isShort ? (isHot ? 4 : 6) : 3;
    steps.push({
      minutesBefore: isShort ? 14 : 12,
      icon:  '⚡',
      action: `${strideCount} strides × 80m`,
      detail: 'Arrancá suave y llegá al 90% de tu ritmo máximo. Recuperación completa entre cada uno.',
    });
  }

  // ── 10 minutos antes ─────────────────────────────────────────────────────
  steps.push({
    minutesBefore: 10,
    icon:  '👟',
    action: 'Posición en el corral',
    detail: isCold
      ? 'Conservá el calor con ropa desechable. Sacátela en los últimos 2 min.'
      : isHot
      ? 'Buscá sombra en el corral. No te sobre-calientes antes de la largada.'
      : 'Entrá al corral y hacé pequeños movimientos para mantenerte activo.',
  });

  // ── 5 minutos antes ──────────────────────────────────────────────────────
  steps.push({
    minutesBefore: 5,
    icon:  '💧',
    action: 'Último sorbo (100-150ml)',
    detail: 'Solo si tenés sed. No fuerces líquido si no querés.',
  });

  return steps;
}

// Formatea "X min antes" → "−Xmin"
function fmtBefore(min: number): string {
  if (min >= 60) return `−${min / 60}h`;
  return `−${min}min`;
}

export function WarmupPlan({ distanceKm, weather }: WarmupPlanProps) {
  const steps = buildWarmupSteps(distanceKm, weather);
  const { t } = useLang();

  // Alerta de clima extremo
  const weatherAlert =
    weather.temperature > 27 ? '🔥 Mucho calor — calentamiento muy corto y buscá sombra.'
    : weather.temperature < 5 ? '🥶 Mucho frío — calentamiento más largo, no te desvistas hasta el último momento.'
    : null;

  return (
    <div
      className="rounded-xl border p-5 mt-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <p className="font-semibold text-sm mb-1">Plan de calentamiento</p>
      <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Basado en {distanceKm}km · {weather.temperature}°C
      </p>

      {/* Alerta de clima extremo */}
      {weatherAlert && (
        <div
          className="rounded-lg px-3 py-2 text-xs mb-4"
          style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', color: '#facc15' }}
        >
          {weatherAlert}
        </div>
      )}

      {/* Línea de tiempo */}
      <div className="relative">
        {/* Línea vertical conectora */}
        <div
          className="absolute left-[30px] top-3 bottom-3 w-px"
          style={{ background: 'var(--border)' }}
        />

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Tiempo antes + icono */}
              <div className="flex flex-col items-center shrink-0 w-[60px]">
                <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                  {fmtBefore(step.minutesBefore)}
                </span>
                <div
                  className="mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10"
                  style={{ background: 'var(--muted)', border: '2px solid var(--border)' }}
                >
                  {step.icon}
                </div>
              </div>

              {/* Contenido */}
              <div className="flex-1 pt-0.5 pb-2">
                <p className="text-sm font-semibold">{step.action}</p>
                {step.detail && (
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Largada */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center shrink-0 w-[60px]">
              <span className="text-xs font-mono font-bold" style={{ color: '#f97316' }}>0min</span>
              <div
                className="mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10"
                style={{ background: 'rgba(249,115,22,0.15)', border: '2px solid rgba(249,115,22,0.5)' }}
              >
                🏁
              </div>
            </div>
            <p className="text-sm font-bold" style={{ color: '#f97316' }}>Largada</p>
          </div>
        </div>
      </div>
    </div>
  );
}
