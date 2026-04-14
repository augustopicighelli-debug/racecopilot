'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type UnitSystem = 'metric' | 'imperial';

interface UnitsCtx {
  units:     UnitSystem;
  toggle:    () => void;
  fmtDist:   (km: number, decimals?: number) => string;  // "42.2 km"   | "26.2 mi"
  fmtPace:   (secPerKm: number) => string;               // "5:00 /km"  | "8:03 /mi"
  fmtWeight: (kg: number) => string;                     // "70 kg"     | "154 lb"
  fmtTemp:   (celsius: number) => string;                // "17 °C"     | "63 °F"
  fmtVol:    (ml: number) => string;                     // "200 ml"    | "6.8 fl oz"
  fmtElev:   (meters: number) => string;                 // "250 m"     | "820 ft"
  fmtWind:   (kmh: number) => string;                    // "12 km/h"   | "7 mph"
  distUnit:  string;  // "km" | "mi"  — para labels
  paceUnit:  string;  // "/km" | "/mi"
}

// ─── Contexto ────────────────────────────────────────────────────────────────

const UnitsContext = createContext<UnitsCtx | null>(null);

// ─── Conversiones ────────────────────────────────────────────────────────────

function toMiles(km: number)     { return km * 0.621371; }
function toFahrenheit(c: number) { return c * 9 / 5 + 32; }
function toFlOz(ml: number)      { return ml * 0.033814; }

function formatPace(secPerKm: number, imperial: boolean): string {
  // Ritmo por milla = secPerKm × 1.60934
  const sec = imperial ? secPerKm * 1.60934 : secPerKm;
  const m   = Math.floor(sec / 60);
  const s   = Math.round(sec % 60);
  const unit = imperial ? '/mi' : '/km';
  return `${m}:${String(s).padStart(2, '0')} ${unit}`;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function UnitsProvider({ children }: { children: ReactNode }) {
  // Inicializar desde localStorage si existe
  const [units, setUnits] = useState<UnitSystem>('metric');

  useEffect(() => {
    const saved = localStorage.getItem('racecopilot_units') as UnitSystem | null;
    if (saved === 'metric' || saved === 'imperial') setUnits(saved);
  }, []);

  const toggle = () => {
    setUnits(prev => {
      const next = prev === 'metric' ? 'imperial' : 'metric';
      localStorage.setItem('racecopilot_units', next);
      return next;
    });
  };

  const imp = units === 'imperial';

  const ctx: UnitsCtx = {
    units,
    toggle,
    distUnit:  imp ? 'mi'    : 'km',
    paceUnit:  imp ? '/mi'   : '/km',

    fmtDist: (km, dec = 1) =>
      imp
        ? `${toMiles(km).toFixed(dec)} mi`
        : `${km % 1 === 0 ? km : km.toFixed(dec)} km`,

    fmtPace: (secPerKm) => formatPace(secPerKm, imp),

    fmtWeight: (kg) =>
      imp
        ? `${(kg * 2.20462).toFixed(1)} lb`
        : `${kg} kg`,

    fmtTemp: (c) =>
      imp
        ? `${Math.round(toFahrenheit(c))} °F`
        : `${c} °C`,

    fmtVol: (ml) =>
      imp
        ? `${toFlOz(ml).toFixed(1)} fl oz`
        : `${ml} ml`,

    fmtElev: (m) =>
      imp
        ? `${Math.round(m * 3.28084)} ft`
        : `${Math.round(m)} m`,

    fmtWind: (kmh) =>
      imp
        ? `${(kmh * 0.621371).toFixed(0)} mph`
        : `${kmh} km/h`,
  };

  return <UnitsContext.Provider value={ctx}>{children}</UnitsContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUnits(): UnitsCtx {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used inside UnitsProvider');
  return ctx;
}
