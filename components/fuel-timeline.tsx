'use client';

/**
 * FuelTimeline — tabla de hidratación + nutrición con columnas alineadas.
 * Columnas: Km | Agua | Gel | Gel+cafeína | Sal | Tiempo
 */

import { Droplets, Zap, Coffee, Pill, Lightbulb } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUnits } from '@/lib/units';
import { useLang } from '@/lib/lang';
import type { HydrationPlan, NutritionPlan } from '@/lib/engine/types';

interface FuelTimelineProps {
  hydration: HydrationPlan;
  nutrition: NutritionPlan;
}

type FuelRow = {
  km:       number | 'pre';
  water?:   { ml: number };
  gel?:     string;
  cafGel?:  string;
  salt?:    string;
  minutes?: number;
};

function buildRows(hydration: HydrationPlan, nutrition: NutritionPlan): FuelRow[] {
  const map = new Map<number | 'pre', FuelRow>();
  const get = (km: number | 'pre'): FuelRow => {
    if (!map.has(km)) map.set(km, { km });
    return map.get(km)!;
  };

  for (const e of hydration.events) {
    get(e.km).water = { ml: e.mlToDrink };
  }
  if (nutrition.preRaceGel) {
    get('pre').gel = nutrition.preRaceGel.product.name;
  }
  for (const e of nutrition.events) {
    const row = get(e.km);
    if (row.minutes === undefined) row.minutes = e.minutesSinceStart;
    if (e.product.type === 'salt_pill') {
      row.salt = e.product.name;
    } else {
      const hasCaffeine = e.product.caffeineMg > 0;
      if (hasCaffeine) row.cafGel = e.product.name;
      else             row.gel    = e.product.name;
    }
  }

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
  const hasCafCol    = rows.some(r => r.cafGel);

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
        {/* Tip: si hay un solo producto de nutrición */}
        {nutrition.events.length > 0 && new Set(nutrition.events.map(e => e.product.name)).size <= 1 && (
          <div
            className="mx-4 mt-2 mb-1 px-3 py-2 rounded-lg text-xs flex items-start gap-2"
            style={{ background: 'rgba(249,115,22,0.08)', color: 'var(--muted-foreground)', border: '1px solid rgba(249,115,22,0.2)' }}
          >
            <Lightbulb size={13} className="shrink-0 mt-0.5" style={{ color: '#f97316' }} />
            <span>
              Tenés un solo producto de nutrición. Agregar una pastilla de sal y un gel sin cafeína puede mejorar la estrategia.{' '}
              <a href="/profile" className="underline" style={{ color: '#f97316' }}>Agregar productos →</a>
            </span>
          </div>
        )}

        <div className="w-full">
          {rows.map((row, i) => {
            const isPre   = row.km === 'pre';
            const kmLabel = isPre ? 'PRE' : `Km ${row.km}`;
            const isEmpty = !row.water && !row.gel && !row.cafGel && !row.salt;
            if (isEmpty) return null;

            return (
              <div
                key={i}
                className="grid items-center px-4 py-2.5 border-b last:border-0"
                style={{
                  gridTemplateColumns: hasCafCol
                    ? '3.5rem 1fr 1fr 1fr 1fr 3rem'
                    : '3.5rem 1fr 1fr 1fr 3rem',
                  borderColor: 'var(--border)',
                }}
              >
                {/* Km */}
                <span
                  className="font-mono text-xs font-semibold text-right pr-2"
                  style={{ color: isPre ? '#f59e0b' : 'var(--muted-foreground)' }}
                >
                  {kmLabel}
                </span>

                {/* Agua */}
                <span className="flex items-center gap-1 text-sm">
                  {row.water && (
                    <>
                      <Droplets size={13} className="text-sky-400 shrink-0" />
                      <span className="font-medium text-sky-300">{fmtVol(row.water.ml)}</span>
                    </>
                  )}
                </span>

                {/* Gel sin cafeína */}
                <span className="flex items-center gap-1 text-sm">
                  {row.gel && (
                    <>
                      <Zap size={13} className="shrink-0" style={{ color: '#a78bfa' }} />
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>{row.gel}</span>
                    </>
                  )}
                </span>

                {/* Gel con cafeína */}
                {hasCafCol && (
                  <span className="flex items-center gap-1 text-sm">
                    {row.cafGel && (
                      <>
                        <Coffee size={13} className="shrink-0" style={{ color: '#fbbf24' }} />
                        <span className="font-medium" style={{ color: '#fbbf24' }}>{row.cafGel}</span>
                      </>
                    )}
                  </span>
                )}

                {/* Sal */}
                <span className="flex items-center gap-1 text-sm">
                  {row.salt && (
                    <>
                      <Pill size={13} className="shrink-0" style={{ color: '#6ee7b7' }} />
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>{row.salt}</span>
                    </>
                  )}
                </span>

                {/* Tiempo */}
                <span className="text-xs tabular-nums text-right" style={{ color: 'var(--muted-foreground)' }}>
                  {row.minutes != null ? `~${row.minutes}min` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
