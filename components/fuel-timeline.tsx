'use client';

/**
 * FuelTimeline — timeline compacto de hidratación + nutrición.
 * Diseño: una sola fila por km, todos los items en línea horizontal.
 * Agua + geles + pastillas agrupados por km, sin columna de dots.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUnits } from '@/lib/units';
import { useLang } from '@/lib/lang';
import type { HydrationPlan, NutritionPlan } from '@/lib/engine/types';

interface FuelTimelineProps {
  hydration: HydrationPlan;
  nutrition: NutritionPlan;
}

type FuelRow = {
  km:      number | 'pre';
  water?:  { ml: number };
  items:   { icon: string; name: string }[];
  minutes?: number;
};

/** Construye la lista de filas fusionando agua + nutrición por km */
function buildRows(hydration: HydrationPlan, nutrition: NutritionPlan): FuelRow[] {
  const map = new Map<number | 'pre', FuelRow>();

  const get = (km: number | 'pre'): FuelRow => {
    if (!map.has(km)) map.set(km, { km, items: [] });
    return map.get(km)!;
  };

  // Agua
  for (const e of hydration.events) {
    get(e.km).water = { ml: e.mlToDrink };
  }

  // Gel pre-carrera
  if (nutrition.preRaceGel) {
    const row = get('pre');
    const p   = nutrition.preRaceGel;
    row.items.push({ icon: '⚡', name: p.product.name });
  }

  // Nutrición durante la carrera
  for (const e of nutrition.events) {
    const row    = get(e.km);
    const isSalt = e.product.type === 'salt_pill';
    row.items.push({ icon: isSalt ? '🧂' : '⚡', name: e.product.name });
    if (row.minutes === undefined) row.minutes = e.minutesSinceStart;
  }

  // Ordenar: PRE primero, luego por km
  return [
    ...(map.has('pre') ? [map.get('pre')!] : []),
    ...Array.from(map.entries())
      .filter(([k]) => k !== 'pre')
      .sort(([a], [b]) => (a as number) - (b as number))
      .map(([, v]) => v),
  ];
}

export function FuelTimeline({ hydration, nutrition }: FuelTimelineProps) {
  const { fmtVol } = useUnits();
  const { t }      = useLang();
  const p          = t.plan;

  const rows = buildRows(hydration, nutrition);
  const hasNutrition = nutrition.events.length > 0 || !!nutrition.preRaceGel;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{p.fuelTitle ?? 'Hidratación & Combustible'}</CardTitle>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {p.sweatRateLabel}: {fmtVol(hydration.sweatRateMlPerHour)}/h
          {' · '}
          {p.totalLoss}: {fmtVol(hydration.totalFluidLosseMl)}
          {hasNutrition && nutrition.totalCarbsNeeded > 0 && (
            <> · {Math.round(nutrition.totalCarbsNeeded)}g {p.carbs}</>
          )}
        </p>
      </CardHeader>

      <CardContent className="p-0 pb-2">
        {rows.map((row, i) => {
          const isPre    = row.km === 'pre';
          const kmLabel  = isPre ? 'PRE' : `Km ${row.km}`;
          const isEmpty  = !row.water && row.items.length === 0;
          if (isEmpty) return null;

          return (
            <div
              key={i}
              className="flex items-center gap-3 px-6 py-2.5 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}
            >
              {/* Km label */}
              <span
                className="flex-shrink-0 w-14 text-right font-mono text-xs font-semibold"
                style={{ color: isPre ? '#f59e0b' : 'var(--muted-foreground)' }}
              >
                {kmLabel}
              </span>

              {/* Items en línea */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 flex-1 text-sm">

                {/* Agua */}
                {row.water && (
                  <span className="flex items-center gap-1">
                    <span className="text-sky-400 text-xs">💧</span>
                    <span className="font-medium text-sky-300">{fmtVol(row.water.ml)}</span>
                  </span>
                )}

                {/* Separador visual si hay agua Y nutrición */}
                {row.water && row.items.length > 0 && (
                  <span className="text-[var(--border)] select-none">·</span>
                )}

                {/* Geles / pastillas */}
                {row.items.map((item, j) => (
                  <span key={j} className="flex items-center gap-1.5">
                    <span className="text-xs">{item.icon}</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                      {item.name}
                    </span>
                    {j < row.items.length - 1 && (
                      <span className="text-[var(--border)] select-none">·</span>
                    )}
                  </span>
                ))}
              </div>

              {/* Tiempo desde el inicio, alineado a la derecha */}
              {row.minutes != null && (
                <span
                  className="flex-shrink-0 text-xs tabular-nums"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  ~{row.minutes}min
                </span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
