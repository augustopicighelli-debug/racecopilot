'use client';

import { useUnits } from '@/lib/units';
import { UnitsToggle } from '@/components/units-toggle';

// Datos base en métrico — se convierten según el sistema elegido
const OBJECTIVES_RAW = [
  { label: 'A', name: 'Máximo',      time: '3:42:00', paceSecPerKm: 316, pct: 78, color: '#f97316', border: 'rgba(249,115,22,0.5)', bg: 'rgba(249,115,22,0.08)' },
  { label: 'B', name: 'Realista',    time: '3:50:00', paceSecPerKm: 327, pct: 86, color: '#60a5fa', border: 'rgba(96,165,250,0.5)',  bg: 'rgba(96,165,250,0.08)'  },
  { label: 'C', name: 'Conservador', time: '4:00:00', paceSecPerKm: 341, pct: 95, color: '#4ade80', border: 'rgba(74,222,128,0.5)',  bg: 'rgba(74,222,128,0.08)'  },
];

const PACE_SEGMENTS_RAW = [
  { tramoDist: [0, 10],  paceSecPerKm: 330, pct: 97, fc: '148', tag: 'Entrada en calor' },
  { tramoDist: [10, 21], paceSecPerKm: 325, pct: 95, fc: '158', tag: 'Ritmo crucero'     },
  { tramoDist: [21, 35], paceSecPerKm: 320, pct: 94, fc: '165', tag: 'Zona de esfuerzo'  },
  { tramoDist: [35, 42], paceSecPerKm: 315, pct: 92, fc: '172', tag: 'Final progresivo'  },
];

const HYDRATION_RAW = [
  { km: 0,  water: 0,   iso: 0,   note: 'Partís hidratado',         alert: false },
  { km: 5,  water: 150, iso: 100, note: '',                          alert: false },
  { km: 10, water: 150, iso: 150, note: 'Gel de carbohidratos',      alert: true  },
  { km: 15, water: 200, iso: 100, note: '',                          alert: false },
  { km: 21, water: 200, iso: 200, note: 'Gel + electrolitos',        alert: true  },
  { km: 30, water: 250, iso: 200, note: 'Zona crítica — no saltear', alert: true  },
  { km: 42, water: 0,   iso: 0,   note: 'Recuperación',              alert: false },
];

const maxFluidMl = 450; // para escalar barras de hidratación

export function LandingMockup() {
  const { fmtDist, fmtPace, fmtVol, fmtTemp, fmtWind, units } = useUnits();

  // Distancia de la carrera en la unidad elegida
  const raceDist = fmtDist(42.195);

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
    >
      {/* Barra del navegador */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
        </div>
        <div className="flex-1 rounded-md px-3 py-1.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted-foreground)' }}>
          racecopilot.app/races/maratonba2026
        </div>
        {/* Toggle de unidades dentro del browser frame */}
        <UnitsToggle />
      </div>

      {/* Contenido del plan */}
      <div style={{ background: 'var(--background)' }}>

        {/* Header de la carrera */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.05) 100%)', borderBottom: '1px solid rgba(249,115,22,0.2)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-xl">Maratón de Buenos Aires 2026</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {raceDist} · Buenos Aires · 12 de abril de 2026
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>
              Faltan 0d
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { label: '🌡 Temperatura', val: `${fmtTemp(17)} → ${fmtTemp(21)}` },
              { label: '💧 Humedad',      val: '62 %'                    },
              { label: '💨 Viento',       val: fmtWind(12)               },
              { label: '⛰ Desnivel',     val: units === 'imperial' ? '394 ft+' : '120 m+' },
            ].map(({ label, val }) => (
              <div key={label} className="text-xs">
                <span style={{ color: 'var(--muted-foreground)' }}>{label} </span>
                <span className="font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-6 space-y-8">

          {/* Objetivos A / B / C */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
              Objetivos de carrera
            </p>
            <div className="grid grid-cols-3 gap-3">
              {OBJECTIVES_RAW.map(({ label, name, time, paceSecPerKm, color, border, bg }) => (
                <div key={label} className="rounded-xl border p-4" style={{ borderColor: border, background: bg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: color, color: '#fff' }}>
                      {label}
                    </span>
                    <span className="text-xs font-medium" style={{ color }}>{name}</span>
                  </div>
                  <p className="text-2xl font-extrabold tracking-tight">{time}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{fmtPace(paceSecPerKm)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ritmo por tramos — barras visuales */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
              Ritmo por tramos
            </p>
            <div className="space-y-2.5">
              {PACE_SEGMENTS_RAW.map(({ tramoDist, paceSecPerKm, pct, fc, tag }) => {
                const [from, to] = tramoDist;
                const tramo = units === 'imperial'
                  ? `${(from * 0.621).toFixed(0)} – ${(to * 0.621).toFixed(0)} mi`
                  : `${from} – ${to} km`;
                return (
                  <div key={tramo} className="flex items-center gap-3">
                    <span className="text-xs w-24 shrink-0" style={{ color: 'var(--muted-foreground)' }}>{tramo}</span>
                    <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-md flex items-center px-2" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(249,115,22,0.7), rgba(249,115,22,0.4))' }}>
                        <span className="text-xs font-bold text-white/90">{fmtPace(paceSecPerKm)}</span>
                      </div>
                    </div>
                    <span className="text-xs w-16 text-right shrink-0" style={{ color: 'var(--muted-foreground)' }}>♥ {fc} bpm</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidratación — timeline visual */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Plan de hidratación
            </p>
            <div className="relative pl-8">
              <div className="absolute left-3 top-2 bottom-2 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="space-y-3">
                {HYDRATION_RAW.map(({ km, water, iso, note, alert }) => {
                  const hasFluid = water > 0 || iso > 0;
                  const waterPct = (water / maxFluidMl) * 100;
                  const isoPct   = (iso   / maxFluidMl) * 100;
                  const kmLabel  = units === 'imperial'
                    ? `mi ${(km * 0.621).toFixed(0)}`
                    : `km ${km}`;

                  return (
                    <div key={km} className="relative flex items-start gap-4">
                      <div className="absolute -left-5 mt-1.5 w-2.5 h-2.5 rounded-full border-2 shrink-0"
                        style={{ background: 'var(--background)', borderColor: km === 0 || km === 42 ? '#f97316' : alert ? '#f59e0b' : 'rgba(255,255,255,0.2)' }} />
                      <div className="flex-1 flex items-center justify-between rounded-xl px-4 py-3 min-h-[52px]"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold w-14 shrink-0" style={{ color: km === 42 ? '#f97316' : 'var(--foreground)' }}>
                            {kmLabel}
                          </span>
                          {note && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              background: alert ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                              color: alert ? '#f59e0b' : 'var(--muted-foreground)',
                            }}>
                              {note}
                            </span>
                          )}
                        </div>
                        {hasFluid ? (
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1 w-24">
                              {water > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 rounded-full" style={{ width: `${waterPct}%`, background: '#60a5fa', minWidth: 4 }} />
                                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{fmtVol(water)}</span>
                                </div>
                              )}
                              {iso > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 rounded-full" style={{ width: `${isoPct}%`, background: '#f97316', minWidth: 4 }} />
                                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{fmtVol(iso)}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-bold shrink-0">{fmtVol(water + iso)}</span>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {km === 42 ? '🏅 Meta' : '—'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <div className="w-3 h-1.5 rounded-full" style={{ background: '#60a5fa' }} /> Agua
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <div className="w-3 h-1.5 rounded-full" style={{ background: '#f97316' }} /> Isotónico
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CTA dentro del mockup */}
        <div className="px-6 py-5 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Generá tu plan con tus tiempos reales y el clima del día.
          </p>
          <a href="/login" className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#f97316', color: '#fff' }}>
            Crear mi plan gratis →
          </a>
        </div>
      </div>
    </div>
  );
}
