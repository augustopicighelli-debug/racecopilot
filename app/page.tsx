import Link from 'next/link';

// Datos de ejemplo para el mockup del plan
const EXAMPLE_OBJECTIVES = [
  { label: 'Objetivo A', sublabel: 'Máximo', time: '3:42:00', pace: '5:16 /km', color: '#f97316' },
  { label: 'Objetivo B', sublabel: 'Realista', time: '3:50:00', pace: '5:27 /km', color: '#60a5fa' },
  { label: 'Objetivo C', sublabel: 'Conservador', time: '4:00:00', pace: '5:41 /km', color: '#4ade80' },
];

const EXAMPLE_HYDRATION = [
  { km: 0,  label: 'Salida',  water: 0,   iso: 0,   note: 'Partís hidratado' },
  { km: 5,  label: 'km 5',   water: 150, iso: 100, note: '' },
  { km: 10, label: 'km 10',  water: 150, iso: 150, note: 'Primer gel' },
  { km: 15, label: 'km 15',  water: 200, iso: 100, note: '' },
  { km: 21, label: 'km 21',  water: 200, iso: 200, note: 'Media maratón — gel + sal' },
  { km: 30, label: 'km 30',  water: 250, iso: 150, note: 'Zona crítica' },
  { km: 42, label: 'Meta',   water: 0,   iso: 0,   note: 'Recuperación' },
];

const EXAMPLE_TABLE = [
  { tramo: '0–10 km',  ritmo: '5:30 /km', fc: '148 bpm', estado: 'Entrada en calor' },
  { tramo: '10–21 km', ritmo: '5:25 /km', fc: '158 bpm', estado: 'Ritmo crucero'    },
  { tramo: '21–35 km', ritmo: '5:20 /km', fc: '165 bpm', estado: 'Zona de esfuerzo' },
  { tramo: '35–42 km', ritmo: '5:15 /km', fc: '172 bpm', estado: 'Final progresivo'  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-lg font-bold">
          Race<span style={{ color: '#f97316' }}>Copilot</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Precios
          </Link>
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-lg font-semibold"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            Entrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-14 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 max-w-2xl">
          Tu plan de carrera{' '}
          <span style={{ color: '#f97316' }}>inteligente</span>
        </h1>
        <p className="text-lg mb-8 max-w-xl" style={{ color: 'var(--muted-foreground)' }}>
          Generá un plan personalizado de hidratación, nutrición y ritmo —
          calibrado con tus tiempos reales y el clima del día.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#f97316', color: '#fff' }}
          >
            Empezar gratis — 7 días sin cargo
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-xl text-sm font-semibold border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            Ver precios
          </Link>
        </div>
      </section>

      {/* ── EJEMPLO DEL PLAN ─────────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">

          {/* Etiqueta */}
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Ejemplo de plan generado
          </p>

          {/* Contenedor estilo "pantalla de app" */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>

            {/* Header de la carrera */}
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="font-bold text-lg">Maratón de Buenos Aires 2026</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                42.195 km · Buenos Aires · domingo 12 de abril de 2026
              </p>
            </div>

            <div className="px-6 py-6 space-y-8">

              {/* ── Clima ─────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Clima previsto
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { icon: '🌡', label: 'Temperatura', val: '17 °C' },
                    { icon: '💧', label: 'Humedad',      val: '62 %' },
                    { icon: '💨', label: 'Viento',       val: '12 km/h' },
                    { icon: '☁', label: 'Cielo',        val: 'Parcialmente nublado' },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm border"
                      style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                      <span>{icon}</span>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                        <p className="font-semibold">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Objetivos A / B / C ───────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Objetivos de carrera
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {EXAMPLE_OBJECTIVES.map(({ label, sublabel, time, pace, color }) => (
                    <div key={label} className="rounded-xl border p-4 text-center"
                      style={{ borderColor: color + '55', background: color + '11' }}>
                      <p className="text-xs font-bold mb-0.5" style={{ color }}>{label}</p>
                      <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{sublabel}</p>
                      <p className="text-xl font-bold">{time}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{pace}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Ritmo por tramos ─────────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Ritmo por tramos
                </p>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--background)' }}>
                        {['Tramo', 'Ritmo', 'FC est.', 'Estado'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {EXAMPLE_TABLE.map((row, i) => (
                        <tr key={row.tramo} className="border-t" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td className="px-4 py-3 font-medium">{row.tramo}</td>
                          <td className="px-4 py-3" style={{ color: '#f97316' }}>{row.ritmo}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>{row.fc}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{row.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Hidratación km a km ───────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Plan de hidratación
                </p>
                <div className="relative">
                  {/* Línea de tiempo */}
                  <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: 'var(--border)' }} />
                  <div className="space-y-3 pl-10">
                    {EXAMPLE_HYDRATION.map(({ km, label, water, iso, note }) => (
                      <div key={km} className="relative">
                        {/* Punto en la línea */}
                        <div className="absolute -left-7 top-1.5 w-2.5 h-2.5 rounded-full border-2"
                          style={{ background: 'var(--card)', borderColor: km === 0 || km === 42 ? '#f97316' : 'var(--border)' }} />
                        <div className="flex items-start justify-between rounded-xl border px-4 py-3"
                          style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                          <div>
                            <p className="text-sm font-semibold">{label}</p>
                            {note && <p className="text-xs mt-0.5" style={{ color: '#f97316' }}>{note}</p>}
                          </div>
                          {(water > 0 || iso > 0) && (
                            <div className="flex gap-3 text-xs text-right">
                              {water > 0 && (
                                <div>
                                  <p style={{ color: 'var(--muted-foreground)' }}>Agua</p>
                                  <p className="font-semibold">{water} ml</p>
                                </div>
                              )}
                              {iso > 0 && (
                                <div>
                                  <p style={{ color: 'var(--muted-foreground)' }}>Isotónico</p>
                                  <p className="font-semibold">{iso} ml</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* CTA dentro del mockup */}
            <div className="px-6 py-5 border-t text-center" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Generá tu plan personalizado en segundos
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#f97316', color: '#fff' }}
              >
                Empezar gratis — 7 días sin cargo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: '🏃', title: 'Predictor de ritmo', desc: 'Calibrado con tus tiempos reales usando el modelo de Riegel.' },
            { icon: '💧', title: 'Hidratación y nutrición', desc: 'Plan km a km basado en tu peso, nivel de sudoración y productos.' },
            { icon: '🌤', title: 'Clima del día', desc: 'Integra el pronóstico de Open-Meteo para ajustar el plan.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="text-2xl mb-3">{icon}</div>
              <p className="font-semibold mb-1">{title}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
        © {new Date().getFullYear()} RaceCopilot
      </footer>
    </div>
  );
}
