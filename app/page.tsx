import Link from 'next/link';

// Datos hardcodeados para el mockup — Maratón de Buenos Aires 2026
const OBJECTIVES = [
  { label: 'A', name: 'Máximo',       time: '3:42:00', pace: '5:16 /km', pct: 78, color: '#f97316', border: 'rgba(249,115,22,0.5)', bg: 'rgba(249,115,22,0.08)' },
  { label: 'B', name: 'Realista',     time: '3:50:00', pace: '5:27 /km', pct: 86, color: '#60a5fa', border: 'rgba(96,165,250,0.5)',  bg: 'rgba(96,165,250,0.08)'  },
  { label: 'C', name: 'Conservador',  time: '4:00:00', pace: '5:41 /km', pct: 95, color: '#4ade80', border: 'rgba(74,222,128,0.5)',  bg: 'rgba(74,222,128,0.08)'  },
];

// Segmentos de ritmo — pct es relativo al más lento (100% = 5:41)
const PACE_SEGMENTS = [
  { tramo: '0 – 10 km',  pace: '5:30 /km', pct: 97, fc: '148', tag: 'Entrada en calor' },
  { tramo: '10 – 21 km', pace: '5:25 /km', pct: 95, fc: '158', tag: 'Ritmo crucero'    },
  { tramo: '21 – 35 km', pace: '5:20 /km', pct: 94, fc: '165', tag: 'Zona de esfuerzo' },
  { tramo: '35 – 42 km', pace: '5:15 /km', pct: 92, fc: '172', tag: 'Final progresivo'  },
];

// Puntos del timeline de hidratación
const HYDRATION = [
  { km: 0,  water: 0,   iso: 0,   note: 'Partís hidratado',      alert: false },
  { km: 5,  water: 150, iso: 100, note: '',                       alert: false },
  { km: 10, water: 150, iso: 150, note: 'Gel de carbohidratos',   alert: true  },
  { km: 15, water: 200, iso: 100, note: '',                       alert: false },
  { km: 21, water: 200, iso: 200, note: 'Gel + electrolitos',     alert: true  },
  { km: 30, water: 250, iso: 200, note: 'Zona crítica — no saltear', alert: true },
  { km: 42, water: 0,   iso: 0,   note: 'Recuperación',           alert: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-lg font-bold tracking-tight">
          Race<span style={{ color: '#f97316' }}>Copilot</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Precios</Link>
          <Link href="/login" className="text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
            Entrar
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(249,115,22,0.18) 0%, transparent 65%)' }}
      >
        <div
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 border"
          style={{ borderColor: 'rgba(249,115,22,0.4)', color: '#f97316', background: 'rgba(249,115,22,0.08)' }}
        >
          7 días gratis · sin tarjeta requerida
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-5 max-w-2xl tracking-tight">
          Tu plan de carrera{' '}
          <span style={{ color: '#f97316' }}>personalizado</span>
        </h1>
        <p className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Hidratación, nutrición y ritmo km a km —
          calibrado con tus tiempos reales y el clima del día.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-xl text-sm font-bold"
            style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 30px rgba(249,115,22,0.35)' }}
          >
            Empezar gratis — 7 días sin cargo
          </Link>
          <Link
            href="/pricing"
            className="px-7 py-3.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            Ver precios →
          </Link>
        </div>
      </section>

      {/* ── Mockup del plan ─────────────────────────────── */}
      <section className="px-4 pb-24">
        <div className="max-w-3xl mx-auto">

          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--muted-foreground)' }}>
            Ejemplo de plan generado
          </p>

          {/* Marco estilo navegador */}
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
            </div>

            {/* Contenido del plan */}
            <div style={{ background: 'var(--background)' }}>

              {/* Header de la carrera con gradiente */}
              <div
                className="px-6 py-5"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.05) 100%)', borderBottom: '1px solid rgba(249,115,22,0.2)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-xl">Maratón de Buenos Aires 2026</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      42.195 km · Buenos Aires · 12 de abril de 2026
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>
                    Faltan 0d
                  </span>
                </div>
                {/* Stats rápidos */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {[
                    { label: '🌡 Temperatura', val: '17 °C' },
                    { label: '💧 Humedad',      val: '62 %'  },
                    { label: '💨 Viento',       val: '12 km/h' },
                    { label: '⛰ Desnivel',     val: '120 m+' },
                  ].map(({ label, val }) => (
                    <div key={label} className="text-xs">
                      <span style={{ color: 'var(--muted-foreground)' }}>{label} </span>
                      <span className="font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-6 space-y-8">

                {/* ── Objetivos A / B / C ──────────────── */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                    Objetivos de carrera
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {OBJECTIVES.map(({ label, name, time, pace, color, border, bg }) => (
                      <div key={label} className="rounded-xl border p-4" style={{ borderColor: border, background: bg }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: color, color: '#fff' }}
                          >
                            {label}
                          </span>
                          <span className="text-xs font-medium" style={{ color }}>{name}</span>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight">{time}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{pace}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Ritmo por tramos — barras visuales ── */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                    Ritmo por tramos
                  </p>
                  <div className="space-y-2.5">
                    {PACE_SEGMENTS.map(({ tramo, pace, pct, fc, tag }) => (
                      <div key={tramo} className="flex items-center gap-3">
                        {/* Nombre del tramo */}
                        <span className="text-xs w-24 shrink-0" style={{ color: 'var(--muted-foreground)' }}>{tramo}</span>
                        {/* Barra */}
                        <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-md flex items-center px-2"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(249,115,22,0.7), rgba(249,115,22,0.4))', transition: 'width 0.5s' }}
                          >
                            <span className="text-xs font-bold text-white/90">{pace}</span>
                          </div>
                        </div>
                        {/* FC */}
                        <span className="text-xs w-16 text-right shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                          ♥ {fc} bpm
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {PACE_SEGMENTS.map(({ tramo, tag }) => (
                      <span key={tramo} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <span className="opacity-50">•</span> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── Hidratación — timeline visual ──────── */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted-foreground)' }}>
                    Plan de hidratación
                  </p>
                  <div className="relative pl-8">
                    {/* Línea vertical */}
                    <div className="absolute left-3 top-2 bottom-2 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

                    <div className="space-y-3">
                      {HYDRATION.map(({ km, water, iso, note, alert }) => {
                        const maxTotal = 450; // máximo ml para escalar barras
                        const waterPct = (water / maxTotal) * 100;
                        const isoPct   = (iso   / maxTotal) * 100;
                        const hasFluid = water > 0 || iso > 0;

                        return (
                          <div key={km} className="relative flex items-start gap-4">
                            {/* Punto en la línea */}
                            <div
                              className="absolute -left-5 mt-1.5 w-2.5 h-2.5 rounded-full border-2 shrink-0"
                              style={{
                                background: 'var(--background)',
                                borderColor: km === 0 || km === 42 ? '#f97316' : alert ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                              }}
                            />
                            {/* Contenido */}
                            <div className="flex-1 flex items-center justify-between rounded-xl px-4 py-3 min-h-[52px]"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold w-14 shrink-0" style={{ color: km === 42 ? '#f97316' : 'var(--foreground)' }}>
                                  km {km}
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
                                  {/* Barras de agua e isotónico */}
                                  <div className="flex flex-col gap-1 w-24">
                                    {water > 0 && (
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 rounded-full" style={{ width: `${waterPct}%`, background: '#60a5fa', minWidth: 4 }} />
                                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{water}ml</span>
                                      </div>
                                    )}
                                    {iso > 0 && (
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 rounded-full" style={{ width: `${isoPct}%`, background: '#f97316', minWidth: 4 }} />
                                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{iso}ml</span>
                                      </div>
                                    )}
                                  </div>
                                  {/* Total */}
                                  <span className="text-sm font-bold shrink-0" style={{ color: 'var(--foreground)' }}>
                                    {water + iso} ml
                                  </span>
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

                    {/* Leyenda */}
                    <div className="flex gap-4 mt-3 ml-0">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <div className="w-3 h-1.5 rounded-full" style={{ background: '#60a5fa' }} />
                        Agua
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <div className="w-3 h-1.5 rounded-full" style={{ background: '#f97316' }} />
                        Isotónico
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* CTA dentro del mockup */}
              <div className="px-6 py-5 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Este es un ejemplo. Tu plan se genera con tus tiempos reales y el clima del día de la carrera.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#f97316', color: '#fff' }}
                >
                  Crear mi plan gratis →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-2xl font-bold mb-10">Todo lo que necesitás para tu carrera</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🏃', title: 'Predictor de ritmo',      desc: 'Modelo de Riegel calibrado con tus tiempos reales. No usa promedios genéricos.' },
              { icon: '💧', title: 'Hidratación y nutrición', desc: 'Plan km a km según tu peso, sudoración y productos que ya usás.' },
              { icon: '🌤', title: 'Clima del día',            desc: 'Pronóstico de Open-Meteo para la ciudad y la fecha exacta de tu carrera.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="text-3xl mb-4">{icon}</div>
                <p className="font-semibold mb-2">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────── */}
      <section
        className="mx-4 mb-20 rounded-3xl px-8 py-16 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.05))', border: '1px solid rgba(249,115,22,0.25)' }}
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">¿Listo para tu próxima carrera?</h2>
        <p className="mb-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          7 días gratis, sin tarjeta requerida. Cancelá cuando quieras.
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-4 rounded-2xl text-sm font-bold"
          style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 40px rgba(249,115,22,0.4)' }}
        >
          Empezar gratis — 7 días sin cargo
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t px-6 py-5 flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
        <span>Race<span style={{ color: '#f97316' }}>Copilot</span> © {new Date().getFullYear()}</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:opacity-80">Precios</Link>
          <Link href="/terms"   className="hover:opacity-80">Términos</Link>
          <Link href="/privacy" className="hover:opacity-80">Privacidad</Link>
          <Link href="/login"   className="hover:opacity-80">Entrar</Link>
        </div>
      </footer>
    </div>
  );
}
