'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/lib/lang';

// ── Íconos inline para las features ──────────────────────────────────────────

function IconTarget() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconDrop() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6 10 4 14 4 16a8 8 0 0 0 16 0c0-2-2-6-8-14z" />
    </svg>
  );
}

function IconThermo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

function IconMountain() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

// ── Estrella para el rating de testimonios ────────────────────────────────────
function Stars() {
  return (
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f97316">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ── Separador de sección ──────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-center text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#f97316' }}>
      {text}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { t } = useLang();
  const l = t.landing;
  const n = t.nav;

  const featureIcons = [<IconTarget key="t" />, <IconDrop key="d" />, <IconThermo key="th" />, <IconMountain key="m" />];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center overflow-hidden"
        style={{ minHeight: '88vh' }}
      >
        <Image
          src="/hero-runner.jpg"
          alt="Runner at race"
          fill
          priority
          className="object-cover object-center"
          style={{ zIndex: 0 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.78) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.92) 100%)', zIndex: 1 }}
        />

        <div className="relative max-w-2xl mx-auto" style={{ zIndex: 2 }}>
          {/* Badge */}
          <div
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 border"
            style={{ borderColor: 'rgba(249,115,22,0.5)', color: '#f97316', background: 'rgba(249,115,22,0.12)' }}
          >
            {l.badge}
          </div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
            {l.title}{' '}
            <span style={{ color: '#f97316' }}>{l.titleHighlight}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(245,245,245,0.82)' }}>
            {l.subtitle}
          </p>

          {/* CTAs — primario (registro) + secundario (login) */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Link
              href="/login?tab=register"
              className="px-8 py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 32px rgba(249,115,22,0.45)' }}
            >
              {l.ctaPrimary}
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl text-sm font-semibold border transition-opacity hover:opacity-80"
              style={{ borderColor: 'rgba(255,255,255,0.22)', color: 'rgba(245,245,245,0.88)' }}
            >
              {l.ctaSignIn}
            </Link>
          </div>

          {/* Proof social mínima */}
          <p className="text-xs" style={{ color: 'rgba(245,245,245,0.38)' }}>{l.socialProof}</p>
        </div>
      </section>

      {/* ── Cómo funciona ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <SectionLabel text={l.howLabel} />
          <p className="text-center text-2xl sm:text-3xl font-bold mb-14">{l.howTitle}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ background: 'var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {(l.steps as readonly { num: string; title: string; desc: string }[]).map(({ num, title, desc }) => (
              <div
                key={num}
                className="flex flex-col p-8"
                style={{ background: 'var(--background)' }}
              >
                <span
                  className="text-5xl font-extrabold mb-5 leading-none select-none"
                  style={{ color: 'rgba(249,115,22,0.2)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {num}
                </span>
                <p className="font-semibold text-base mb-2">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features — 2×2 grid ────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <SectionLabel text={l.featuresLabel} />
          <p className="text-center text-2xl sm:text-3xl font-bold mb-10">{l.featuresTitle}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(l.features as readonly { title: string; desc: string }[]).map(({ title, desc }, i) => (
              <div
                key={title}
                className="rounded-2xl border p-7 flex flex-col"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(249,115,22,0.1)' }}
                >
                  {featureIcons[i]}
                </div>
                <p className="font-semibold mb-2">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonios ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <SectionLabel text={l.testimonialsTitle} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            {(l.testimonials as readonly { quote: string; name: string; location: string }[]).map(({ quote, name, location }) => (
              <div
                key={name}
                className="rounded-2xl border p-6 flex flex-col"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <Stars />
                <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: 'var(--muted-foreground)' }}>
                  &ldquo;{quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precios ───────────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-2xl sm:text-3xl font-bold mb-2">{l.pricingTitle}</p>
          <p className="text-sm mb-10" style={{ color: 'var(--muted-foreground)' }}>{l.pricingSubtitle}</p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            {/* Mensual */}
            <div
              className="flex-1 rounded-2xl border p-6 text-left max-w-xs mx-auto sm:mx-0"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
                {l.monthlyLabel}
              </p>
              <p className="text-3xl font-bold">
                $8<span className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>/mes</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{l.monthlyBilled}</p>
            </div>

            {/* Anual — destacado */}
            <div
              className="flex-1 rounded-2xl border-2 p-6 text-left relative max-w-xs mx-auto sm:mx-0"
              style={{ background: 'var(--card)', borderColor: '#f97316' }}
            >
              <span
                className="absolute -top-3 left-5 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: '#f97316', color: '#fff' }}
              >
                {l.annualBadge}
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
                {l.annualLabel}
              </p>
              <p className="text-3xl font-bold">
                $4<span className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>/mes</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#f97316' }}>$48{l.annualBilled}</p>
            </div>
          </div>

          <Link
            href="/pricing"
            className="inline-block mt-8 px-6 py-3 rounded-xl text-sm font-semibold border transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {l.seePlans}
          </Link>
        </div>
      </section>

      {/* ── Separador visual ──────────────────────────────────────────────── */}
      <div className="relative w-full h-56 overflow-hidden">
        <Image src="/start-aerial.jpg" alt="Marathon start line" fill className="object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, var(--background) 0%, transparent 25%, transparent 75%, var(--background) 100%)' }}
        />
      </div>

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section className="relative mx-4 mb-20 rounded-3xl overflow-hidden text-center">
        <Image src="/finish-line.jpg" alt="Finish line" fill className="object-cover object-center" />
        <div className="absolute inset-0 rounded-3xl" style={{ background: 'rgba(10,10,10,0.78)' }} />
        <div className="relative px-8 py-16" style={{ zIndex: 1 }}>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">{l.ctaSectionTitle}</h2>
          <p className="mb-8 text-sm" style={{ color: 'rgba(245,245,245,0.75)' }}>{l.ctaSectionSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?tab=register"
              className="inline-block px-8 py-4 rounded-2xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 40px rgba(249,115,22,0.5)' }}
            >
              {l.ctaPrimary}
            </Link>
            <Link
              href="/login"
              className="inline-block px-8 py-4 rounded-2xl text-sm font-semibold border transition-opacity hover:opacity-80"
              style={{ borderColor: 'rgba(255,255,255,0.22)', color: 'rgba(245,245,245,0.88)' }}
            >
              {l.ctaSignIn}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="border-t px-6 py-5 flex items-center justify-between text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
      >
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
