import Link from 'next/link';
import { LandingMockup } from '@/components/landing-mockup';

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

      {/* ── Mockup del plan (componente cliente con toggle de unidades) ── */}
      <section className="px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--muted-foreground)' }}>
            Ejemplo de plan generado
          </p>
          <LandingMockup />
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
