'use client';

/**
 * FuelTimeline — timeline unificado de hidratación + nutrición.
 * Muestra agua, geles y pastillas ordenados por km en un solo card.
 * Cuando un gel y agua coinciden en el mismo km, se agrupan en la misma fila.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUnits } from '@/lib/units';
import { useLang } from '@/lib/lang';
import type { HydrationPlan, NutritionPlan } from '@/lib/engine/types';

interface FuelTimelineProps {
  hydration: HydrationPlan;
  nutrition:  NutritionPlan;
}

/** Evento unificado para el timeline */
type FuelRow = {
  km: number | 'pre';
  water?:  { ml: number; cumulative: number };
  gels:    { name: string; carbs: number; sodium: number; caffeine: number }[];
  minutes?: number;  // minutos desde el inicio (para geles)
};

export function FuelTimeline({ hydration, nutrition }: FuelTimelineProps) {
  const { fmtVol } = useUnits();
  const { t } = useLang();
  const p = t.plan;

  // ── Construir mapa km → FuelRow ──────────────────────────────────────────
  const rowMap = new Map<number | 'pre', FuelRow>();

  const getRow = (km: number | 'pre'): FuelRow => {
    if (!rowMap.has(km)) rowMap.set(km, { km, gels: [] });
    return rowMap.get(km)!;
  };

  // Agua
  for (const e of hydration.events) {
    const row = getRow(e.km);
    row.water = { ml: e.mlToDrink, cumulative: e.cumulativeMl };
  }

  // Gel pre-carrera
  if (nutrition.preRaceGel) {
    const row = getRow('pre');
    row.gels.push({
      name:     nutrition.preRaceGel.product.name,
      carbs:    nutrition.preRaceGel.carbsGrams,
      sodium:   nutrition.preRaceGel.sodiumMg,
      caffeine: nutrition.preRaceGel.product.caffeineMg ?? 0,
    });
  }

  // Geles y pastillas durante la carrera
  for (const e of nutrition.events) {
    const row = getRow(e.km);
    row.gels.push({
      name:     e.product.name,
      carbs:    e.carbsGrams,
      sodium:   e.sodiumMg,
      caffeine: e.product.caffeineMg ?? 0,
    });
    if (!row.minutes) row.minutes = e.minutesSinceStart;
  }

  // Ordenar: PRE primero, luego por km ascendente
  const rows: FuelRow[] = [
    ...(rowMap.has('pre') ? [rowMap.get('pre')!] : []),
    ...Array.from(rowMap.entries())
      .filter(([k]) => k !== 'pre')
      .sort(([a], [b]) => (a as number) - (b as number))
      .map(([, v]) => v),
  ];

  const hasAnyNutrition = nutrition.events.length > 0 || !!nutrition.preRaceGel;

  return (
    <Card>
      <CardHeader>
        {/* Totales arriba: pérdida de fluidos + carbos si aplica */}
        <CardTitle>{p.fuelTitle ?? 'Hidratación & Combustible'}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          {p.sweatRateLabel}: {fmtVol(hydration.sweatRateMlPerHour)}/h
          {' · '}
          {p.totalLoss}: {fmtVol(hydration.totalFluidLosseMl)}
          {hasAnyNutrition && nutrition.totalCarbsNeeded > 0 && (
            <> {' · '}{Math.round(nutrition.totalCarbsNeeded)}g {p.carbs}</>
          )}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-1.5">
          {rows.map((row, i) => {
            const isPre = row.km === 'pre';
            const kmLabel = isPre ? 'PRE' : `Km ${row.km}`;

            return (
              <div
                key={i}
                className="flex items-start gap-3 py-1.5 border-b border-[var(--border)]/40 last:border-0"
              >
                {/* Etiqueta de km */}
                <div className="flex-shrink-0 w-12 text-right pt-0.5">
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: isPre ? '#f59e0b' : 'var(--muted-foreground)' }}
                  >
                    {kmLabel}
                  </span>
                </div>

                {/* Punto del timeline */}
                <div className="flex flex-col items-center pt-1.5 gap-1">
                  {/* Agua */}
                  {row.water && <div className="w-2 h-2 rounded-full bg-sky-400" />}
                  {/* Geles / pastillas */}
                  {row.gels.map((g, j) => (
                    <div
                      key={j}
                      className="w-2 h-2 rounded-full"
                      style={{ background: g.sodium > 0 && g.carbs === 0 ? '#f472b6' : '#f59e0b' }}
                    />
                  ))}
                </div>

                {/* Detalle */}
                <div className="flex-1 text-sm space-y-1">
                  {/* Línea de agua */}
                  {row.water && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sky-400 text-xs">💧</span>
                      <span className="font-medium">{fmtVol(row.water.ml)}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        ({p.cumul}: {fmtVol(row.water.cumulative)})
                      </span>
                    </div>
                  )}

                  {/* Línea de cada gel/pastilla */}
                  {row.gels.map((g, j) => {
                    const isSalt = g.sodium > 0 && g.carbs === 0;
                    return (
                      <div key={j} className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs">{isSalt ? '🧂' : '⚡'}</span>
                        <span className="font-medium">{g.name}</span>
                        {g.carbs > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                            {g.carbs}g {p.carbs}
                          </span>
                        )}
                        {g.sodium > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(244,114,182,0.12)', color: '#f472b6' }}>
                            {g.sodium}mg Na
                          </span>
                        )}
                        {g.caffeine > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
                            {g.caffeine}mg ☕
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tiempo desde inicio */}
                {row.minutes != null && (
                  <div className="text-xs text-[var(--muted-foreground)] pt-0.5 flex-shrink-0">
                    ~{row.minutes}min
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
