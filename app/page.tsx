'use client';
import Link from 'next/link';
import Image from 'next/image';
import { LandingMockup } from '@/components/landing-mockup';
import { useLang } from '@/lib/lang';

export default function LandingPage() {
  const { t } = useLang();
  const l = t.landing;
  const n = t.nav;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-lg font-bold tracking-tight">
          Race<span style={{ color: '#f97316' }}>Copilot</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{n.pricing}</Link>
          <Link href="/login" className="text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
            {n.enter}
          </Link>
        </div>
      </nav>

      {/* ── Hero con imagen de fondo ─────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center overflow-hidden" style={{ minHeight: '85vh' }}>
        {/* Imagen de fondo */}
        <Image
          src="/hero-runner.jpg"
          alt="Runner at race"
          fill
          priority
          className="object-cover object-center"
          style={{ zIndex: 0 }}
        />
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.85) 100%)', zIndex: 1 }} />

        {/* Contenido encima del overlay */}
        <div className="relative" style={{ zIndex: 2 }}>
          <div
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 border"
            style={{ borderColor: 'rgba(249,115,22,0.5)', color: '#f97316', background: 'rgba(249,115,22,0.12)' }}
          >
            {l.badge}
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-5 max-w-2xl tracking-tight">
            {l.title}{' '}
            <span style={{ color: '#f97316' }}>{l.titleHighlight}</span>
          </h1>
          <p className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: 'rgba(245,245,245,0.8)' }}>
            {l.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-7 py-3.5 rounded-xl text-sm font-bold"
              style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 30px rgba(249,115,22,0.45)' }}
            >
              {l.ctaPrimary}
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(245,245,245,0.85)' }}
            >
              {l.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Mockup ──────────────────────────────────────── */}
      <section className="px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--muted-foreground)' }}>
            {l.exampleLabel}
          </p>
          <LandingMockup />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-2xl font-bold mb-10">{l.featuresTitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* Feature 1: Predictor de ritmo — con imagen del reloj */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="relative h-44 w-full">
                <Image src="/watch-pace.jpg" alt="Pace predictor" fill className="object-cover object-center" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--card) 100%)' }} />
              </div>
              <div className="px-6 pb-6 -mt-2">
                <p className="font-semibold mb-2">{l.features[0].title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{l.features[0].desc}</p>
              </div>
            </div>

            {/* Feature 2: Hidratación — sin imagen, tarjeta centrada */}
            <div className="rounded-2xl border p-6 flex flex-col justify-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="text-3xl mb-4">{l.features[1].icon}</div>
              <p className="font-semibold mb-2">{l.features[1].title}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{l.features[1].desc}</p>
            </div>

            {/* Feature 3: Clima del día — con imagen del reloj bajo lluvia */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="relative h-44 w-full">
                <Image src="/watch-rain.jpg" alt="Race day weather" fill className="object-cover object-center" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--card) 100%)' }} />
              </div>
              <div className="px-6 pb-6 -mt-2">
                <p className="font-semibold mb-2">{l.features[2].title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{l.features[2].desc}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Separador visual: línea de largada aérea ─────── */}
      <div className="relative w-full h-56 overflow-hidden mb-0">
        <Image src="/start-aerial.jpg" alt="Marathon start line" fill className="object-cover object-center" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--background) 0%, transparent 25%, transparent 75%, var(--background) 100%)' }} />
      </div>

      {/* ── CTA final con imagen de llegada ──────────────── */}
      <section className="relative mx-4 mb-20 rounded-3xl overflow-hidden text-center">
        <Image src="/finish-line.jpg" alt="Finish line" fill className="object-cover object-center" />
        <div className="absolute inset-0 rounded-3xl" style={{ background: 'rgba(10,10,10,0.75)' }} />
        <div className="relative px-8 py-16" style={{ zIndex: 1 }}>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">{l.ctaSectionTitle}</h2>
          <p className="mb-8 text-sm" style={{ color: 'rgba(245,245,245,0.75)' }}>{l.ctaSectionSubtitle}</p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 rounded-2xl text-sm font-bold"
            style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 40px rgba(249,115,22,0.5)' }}
          >
            {l.ctaPrimary}
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t px-6 py-5 flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
        <span>Race<span style={{ color: '#f97316' }}>Copilot</span> © {new Date().getFullYear()}</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:opacity-80">{n.pricing}</Link>
          <Link href="/terms"   className="hover:opacity-80">{n.terms}</Link>
          <Link href="/privacy" className="hover:opacity-80">{n.privacy}</Link>
          <Link href="/login"   className="hover:opacity-80">{n.enter}</Link>
        </div>
      </footer>

    </div>
  );
}
