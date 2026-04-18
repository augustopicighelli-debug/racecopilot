'use client';
// Componente: Plan de calentamiento pre-carrera.
import { Banana, Backpack, Droplets, Footprints, PersonStanding, Dumbbell, Zap, Flag, Flame, Snowflake, Utensils, DoorOpen } from 'lucide-react';
import type { AggregatedWeather } from '@/lib/engine/types';
import { useLang } from '@/lib/lang';
import type { LucideProps } from 'lucide-react';
import type { FC } from 'react';

interface WarmupPlanProps {
  distanceKm: number;
  weather:    AggregatedWeather;
}

type IconName = 'banana' | 'backpack' | 'droplets' | 'footprints' | 'standing' | 'dumbbell' | 'zap' | 'flag' | 'utensils' | 'door';

interface WarmupStep {
  minutesBefore: number;
  iconName:      IconName;
  action:        string;
  detail?:       string;
}

// Mapa de nombre → componente Lucide
const ICONS: Record<IconName, FC<LucideProps>> = {
  banana:    Banana,
  backpack:  Backpack,
  droplets:  Droplets,
  footprints: Footprints,
  standing:  PersonStanding,
  dumbbell:  Dumbbell,
  zap:       Zap,
  flag:      Flag,
  utensils:  Utensils,
  door:      DoorOpen,
};

type WarmupT = {
  breakfastAction: string; breakfastDetail: string;
  snackAction: string; snackDetail: string;
  bagAction: string; bagDetail: string;
  hydrHotAction: string; hydrHotDetail: string;
  hydrAction: string; hydrDetail: string;
  bathroomAction: string; bathroomDetail: string;
  trotAction: (min: number) => string; trotDetail: string; trotMidDetail: string;
  walkAction: (min: number) => string; walkDetail: string;
  dynamicAction: string; dynamicDetail: string;
  stridesAction: (n: number) => string; stridesDetail: string;
  corralAction: string; corralCold: string; corralHot: string; corralNormal: string;
  lastDrinkAction: string; lastDrinkDetail: string;
};

function buildWarmupSteps(distanceKm: number, weather: AggregatedWeather, w: WarmupT): WarmupStep[] {
  const isCold = weather.temperature < 10;
  const isHot  = weather.temperature > 22;
  const isShort = distanceKm <= 10;
  const isMid   = distanceKm > 10 && distanceKm <= 21.5;
  const isLong  = distanceKm > 21.5;

  const steps: WarmupStep[] = [];

  // Desayuno habitual — 3 horas antes
  steps.push({ minutesBefore: 180, iconName: 'utensils', action: w.breakfastAction, detail: w.breakfastDetail });

  // Check-in y orientación — 1 hora antes
  steps.push({ minutesBefore: 60, iconName: 'backpack', action: w.bagAction, detail: w.bagDetail });

  // Hidratación — 45 min antes
  steps.push({ minutesBefore: 45, iconName: 'droplets', action: isHot ? w.hydrHotAction : w.hydrAction, detail: isHot ? w.hydrHotDetail : w.hydrDetail });

  // Baño — 30 min antes (para corta queda entre el trote y los dinámicos)
  steps.push({ minutesBefore: 30, iconName: 'door', action: w.bathroomAction, detail: w.bathroomDetail });

  // Calentamiento cardio según distancia
  if (isShort) {
    steps.push({ minutesBefore: 35, iconName: 'footprints', action: w.trotAction(isCold ? 15 : isHot ? 8 : 12), detail: w.trotDetail });
  } else if (isMid) {
    // MID: trote arranca en −28 (dejando −30 libre para el baño)
    steps.push({ minutesBefore: 28, iconName: 'footprints', action: w.trotAction(isCold ? 10 : isHot ? 5 : 8), detail: w.trotMidDetail });
  } else {
    // LONG: caminata en −20 (snack cae en −20 también, se resuelve por sort)
    steps.push({ minutesBefore: 20, iconName: 'standing', action: w.walkAction(isCold ? 8 : 5), detail: w.walkDetail });
  }

  // Ejercicios dinámicos
  // Short: −22, Mid: −21 (para no solapar con snack en −20), Long: −18 (antes de corral en −15)
  steps.push({ minutesBefore: isShort ? 22 : isMid ? 21 : 18, iconName: 'dumbbell', action: w.dynamicAction, detail: w.dynamicDetail });

  // Snack pre-carrera (banana / membrillo) — 20 min antes
  steps.push({ minutesBefore: 20, iconName: 'banana', action: w.snackAction, detail: w.snackDetail });

  // Strides (solo corta/media)
  if (!isLong) {
    const n = isShort ? (isHot ? 4 : 6) : 3;
    steps.push({ minutesBefore: isShort ? 14 : 12, iconName: 'zap', action: w.stridesAction(n), detail: w.stridesDetail });
  }

  // Corral — todos a −15min (el usuario quiere entrar al corral con margen)
  steps.push({ minutesBefore: 15, iconName: 'footprints', action: w.corralAction, detail: isCold ? w.corralCold : isHot ? w.corralHot : w.corralNormal });

  // Último sorbo
  steps.push({ minutesBefore: 5, iconName: 'droplets', action: w.lastDrinkAction, detail: w.lastDrinkDetail });

  // Ordenar cronológicamente (mayor minutesBefore = más temprano en el tiempo)
  return steps.sort((a, b) => b.minutesBefore - a.minutesBefore);
}

function fmtBefore(min: number): string {
  if (min >= 60) return `−${min / 60}h`;
  return `−${min}min`;
}

export function WarmupPlan({ distanceKm, weather }: WarmupPlanProps) {
  const { t } = useLang();
  const w = t.warmup;
  const steps = buildWarmupSteps(distanceKm, weather, w);

  const weatherAlert =
    weather.temperature > 27 ? { text: w.alertHot,  Icon: Flame,     color: '#f97316' }
    : weather.temperature < 5 ? { text: w.alertCold, Icon: Snowflake, color: '#60a5fa' }
    : null;

  return (
    <div className="rounded-xl border p-5 mt-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <p className="font-semibold text-sm mb-1">{w.title}</p>
      <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
        {w.subtitle(distanceKm, weather.temperature)}
      </p>

      {weatherAlert && (
        <div
          className="rounded-lg px-3 py-2 text-xs mb-4 flex items-center gap-2"
          style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', color: '#facc15' }}
        >
          <weatherAlert.Icon size={13} className="shrink-0" style={{ color: weatherAlert.color }} />
          {weatherAlert.text}
        </div>
      )}

      <div className="relative">
        <div className="absolute left-[30px] top-3 bottom-3 w-px" style={{ background: 'var(--border)' }} />
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = ICONS[step.iconName];
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0 w-[60px]">
                  <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                    {fmtBefore(step.minutesBefore)}
                  </span>
                  <div
                    className="mt-1 w-8 h-8 rounded-full flex items-center justify-center z-10"
                    style={{ background: 'var(--muted)', border: '2px solid var(--border)' }}
                  >
                    <Icon size={15} style={{ color: 'var(--foreground)' }} />
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
            );
          })}

          {/* Largada */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center shrink-0 w-[60px]">
              <span className="text-xs font-mono font-bold" style={{ color: '#f97316' }}>0min</span>
              <div
                className="mt-1 w-8 h-8 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(249,115,22,0.15)', border: '2px solid rgba(249,115,22,0.5)' }}
              >
                <Flag size={15} style={{ color: '#f97316' }} />
              </div>
            </div>
            <p className="text-sm font-bold" style={{ color: '#f97316' }}>{w.startLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
