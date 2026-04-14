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
  minutesBefore: number;
  icon:          string;
  action:        string;
  detail?:       string;
}

// Traducciones locales del warmup (las recibe como argumento para no usar hook en función pura)
type WarmupT = {
  snackAction: string; snackDetail: string;
  bagAction: string; bagDetail: string;
  hydrHotAction: string; hydrHotDetail: string;
  hydrAction: string; hydrDetail: string;
  trotAction: (min: number) => string; trotDetail: string; trotMidDetail: string;
  walkAction: (min: number) => string; walkDetail: string;
  dynamicAction: string; dynamicDetail: string;
  stridesAction: (n: number) => string; stridesDetail: string;
  corralAction: string; corralCold: string; corralHot: string; corralNormal: string;
  lastDrinkAction: string; lastDrinkDetail: string;
};

/**
 * Genera los pasos del calentamiento según distancia y clima.
 * - Distancia corta (< 10km): calentamiento agresivo con strides
 * - Media distancia (10-21km): moderado
 * - Maratón y ultra (> 21km): mínimo — la carrera en sí es el warmup
 * - Frío (< 10°C): pasos más largos, conservar calor hasta último momento
 * - Calor (> 22°C): pasos más cortos para no elevar temperatura corporal
 */
function buildWarmupSteps(
  distanceKm: number,
  weather: AggregatedWeather,
  w: WarmupT
): WarmupStep[] {
  const isCold = weather.temperature < 10;
  const isHot  = weather.temperature > 22;

  const isShort = distanceKm <= 10;
  const isMid   = distanceKm > 10 && distanceKm <= 21.5;
  const isLong  = distanceKm > 21.5;

  const steps: WarmupStep[] = [];

  steps.push({ minutesBefore: 90, icon: '🍌', action: w.snackAction, detail: w.snackDetail });
  steps.push({ minutesBefore: 60, icon: '📦', action: w.bagAction,   detail: w.bagDetail });
  steps.push({
    minutesBefore: 45,
    icon:   '💧',
    action: isHot ? w.hydrHotAction : w.hydrAction,
    detail: isHot ? w.hydrHotDetail : w.hydrDetail,
  });

  if (isShort) {
    const min = isCold ? 15 : isHot ? 8 : 12;
    steps.push({ minutesBefore: 35, icon: '🏃', action: w.trotAction(min), detail: w.trotDetail });
  } else if (isMid) {
    const min = isCold ? 10 : isHot ? 5 : 8;
    steps.push({ minutesBefore: 30, icon: '🏃', action: w.trotAction(min), detail: w.trotMidDetail });
  } else {
    const min = isCold ? 8 : 5;
    steps.push({ minutesBefore: 20, icon: '🚶', action: w.walkAction(min), detail: w.walkDetail });
  }

  steps.push({
    minutesBefore: isShort ? 22 : isMid ? 20 : 12,
    icon:   '🦵',
    action: w.dynamicAction,
    detail: w.dynamicDetail,
  });

  if (!isLong) {
    const n = isShort ? (isHot ? 4 : 6) : 3;
    steps.push({
      minutesBefore: isShort ? 14 : 12,
      icon:   '⚡',
      action: w.stridesAction(n),
      detail: w.stridesDetail,
    });
  }

  steps.push({
    minutesBefore: 10,
    icon:   '👟',
    action: w.corralAction,
    detail: isCold ? w.corralCold : isHot ? w.corralHot : w.corralNormal,
  });

  steps.push({ minutesBefore: 5, icon: '💧', action: w.lastDrinkAction, detail: w.lastDrinkDetail });

  return steps;
}

// Formatea minutos antes de la largada → "-Xmin" o "-Xh"
function fmtBefore(min: number): string {
  if (min >= 60) return `−${min / 60}h`;
  return `−${min}min`;
}

export function WarmupPlan({ distanceKm, weather }: WarmupPlanProps) {
  const { t } = useLang();
  const w = t.warmup;

  const steps = buildWarmupSteps(distanceKm, weather, w);

  const weatherAlert =
    weather.temperature > 27 ? w.alertHot
    : weather.temperature < 5 ? w.alertCold
    : null;

  return (
    <div
      className="rounded-xl border p-5 mt-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <p className="font-semibold text-sm mb-1">{w.title}</p>
      <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
        {w.subtitle(distanceKm, weather.temperature)}
      </p>

      {weatherAlert && (
        <div
          className="rounded-lg px-3 py-2 text-xs mb-4"
          style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', color: '#facc15' }}
        >
          {weatherAlert}
        </div>
      )}

      <div className="relative">
        {/* Línea vertical conectora */}
        <div
          className="absolute left-[30px] top-3 bottom-3 w-px"
          style={{ background: 'var(--border)' }}
        />

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
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

          {/* Largada / Start */}
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
            <p className="text-sm font-bold" style={{ color: '#f97316' }}>{w.startLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
