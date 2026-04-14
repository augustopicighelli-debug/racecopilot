import Link from 'next/link';

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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 max-w-2xl">
          Tu plan de carrera{' '}
          <span style={{ color: '#f97316' }}>inteligente</span>
        </h1>
        <p className="text-lg mb-8 max-w-xl" style={{ color: 'var(--muted-foreground)' }}>
          Generá un plan personalizado de hidratación, nutrición y ritmo para tu próxima carrera —
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
      </main>

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
