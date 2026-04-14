'use client';
import Link from 'next/link';
import { LandingMockup } from '@/components/landing-mockup';
import { useLang } from '@/lib/lang';

export default function LandingPage() {
  const { t, lang } = useLang();
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

      {/* ── Hero ────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(249,115,22,0.18) 0%, transparent 65%)' }}
      >
        <div
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 border"
          style={{ borderColor: 'rgba(249,115,22,0.4)', color: '#f97316', background: 'rgba(249,115,22,0.08)' }}
        >
          {l.badge}
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-5 max-w-2xl tracking-tight">
          {l.title}{' '}
          <span style={{ color: '#f97316' }}>{l.titleHighlight}</span>
        </h1>
        <p className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {l.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-xl text-sm font-bold"
            style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 30px rgba(249,115,22,0.35)' }}
          >
            {l.ctaPrimary}
          </Link>
          <Link
            href="/pricing"
            className="px-7 py-3.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            {l.ctaSecondary}
          </Link>
        </div>
      </section>

      {/* ── Mockup ──────────────────────────────────────── */}
      <section className="px-4 pb-24">
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
            {l.features.map(({ icon, title, desc }) => (
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
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">{l.ctaSectionTitle}</h2>
        <p className="mb-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>{l.ctaSectionSubtitle}</p>
        <Link
          href="/login"
          className="inline-block px-8 py-4 rounded-2xl text-sm font-bold"
          style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 40px rgba(249,115,22,0.4)' }}
        >
          {l.ctaPrimary}
        </Link>
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
