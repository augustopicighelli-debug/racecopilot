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
            {/* CTA principal → directo a registro, no a login */}
            <Link
              href="/login?tab=register"
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
            {[
              {
                icon: (
                  // Cronómetro — predictor de ritmo
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2.5 2.5" />
                    <path d="M9 3h6" />
                    <path d="M12 3v2" />
                  </svg>
                ),
                title: l.features[0].title,
                desc:  l.features[0].desc,
              },
              {
                icon: (
                  // Gota de agua — hidratación
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6 10 4 14 4 16a8 8 0 0 0 16 0c0-2-2-6-8-14z" />
                  </svg>
                ),
                title: l.features[1].title,
                desc:  l.features[1].desc,
              },
              {
                icon: (
                  // Sol con nube — clima del día
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v2M4.22 4.22l1.42 1.42M2 12h2M4.22 19.78l1.42-1.42M12 20v2M19.78 19.78l-1.42-1.42M22 12h-2M19.78 4.22l-1.42 1.42" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ),
                title: l.features[2].title,
                desc:  l.features[2].desc,
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border p-7 flex flex-col" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                {/* Ícono con fondo sutil */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(249,115,22,0.1)' }}>
                  {icon}
                </div>
                <p className="font-semibold mb-2">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonios ──────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-2xl font-bold mb-10">Lo que dicen los corredores</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                quote: 'Usé el plan para el Maratón de Barcelona. Me dio 3:58 como objetivo realista y terminé en 4:02 — primero que corría más de 30km. La tabla de hidratación fue clave, nunca tuve calambres.',
                name: 'Pau M.',
                location: 'Barcelona, España',
              },
              {
                quote: 'Me preparé dos años para Berlín. No quería dejar nada al azar en la carrera de mi vida. Seguí el plan al detalle — ritmo, hidratación, calentamiento — y bajé mi marca en 8 minutos. Fue el mejor día de mi vida como corredor.',
                name: 'Thomas R.',
                location: 'Berlín, Alemania',
              },
              {
                quote: 'Fiz a Meia de São Paulo. O plano calculou que eu precisava de gel a cada 7km com o calor previsto. Segui à risca e bati meu PR por 4 minutos.',
                name: 'Lucas B.',
                location: 'São Paulo, Brasil',
              },
            ].map(({ quote, name, location }) => (
              <div key={name} className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted-foreground)' }}>"{quote}"</p>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precios (snippet) ─────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-2xl font-bold mb-2">Simple y sin sorpresas</p>
          <p className="text-sm mb-10" style={{ color: 'var(--muted-foreground)' }}>
            7 días de prueba gratis. Cancelá cuando quieras.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            {/* Mensual */}
            <div className="flex-1 rounded-2xl border p-6 text-left max-w-xs mx-auto sm:mx-0" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Mensual</p>
              <p className="text-3xl font-bold">$8<span className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>/mes</span></p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>cobrado mensualmente</p>
            </div>
            {/* Anual — destacado */}
            <div className="flex-1 rounded-2xl border-2 p-6 text-left relative max-w-xs mx-auto sm:mx-0" style={{ background: 'var(--card)', borderColor: '#f97316' }}>
              <span className="absolute -top-3 left-5 text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#f97316', color: '#fff' }}>
                2 meses gratis
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Anual</p>
              <p className="text-3xl font-bold">$4<span className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>/mes</span></p>
              <p className="text-xs mt-0.5" style={{ color: '#f97316' }}>$48/año cobrado anualmente</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-block mt-8 px-6 py-3 rounded-xl text-sm font-semibold border"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Ver planes completos →
          </Link>
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
            href="/login?tab=register"
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
