// Landing SEO compartida entre /carreras/[slug] (ES) y /race/[slug] (EN).
// Datos vienen de Supabase (gpx_catalog) — sin intro ni clima histórico por ahora.

import Link from 'next/link';
import type { Race } from '@/lib/races/catalog';
import { distanceLabel } from '@/lib/races/catalog';

type Props = {
  race:   Race;
  locale: 'es' | 'en';
};

const T = {
  es: {
    back:        '← Inicio',
    subtitle:    'Ritmo, hidratación y nutrición · calibrado al recorrido real',
    distance:    'Distancia',
    elevation:   'Desnivel positivo',
    drop:        'Desnivel negativo',
    city:        'Ciudad',
    country:     'País',
    ctaTitle:    'Generá tu plan personalizado',
    ctaBody:     'En 3 minutos tenés un plan ajustado a tus tiempos, el recorrido real de esta carrera y el clima del día. 7 días gratis, sin tarjeta.',
    ctaBtn:      'Empezar gratis →',
    disclaimer:  'Datos orientativos. Verificá siempre en el sitio oficial de la carrera.',
    profileH2:   'El recorrido importa',
    profileBody: 'La diferencia entre un plan genérico y uno inteligente está en el perfil de elevación. RaceCopilot ajusta tu ritmo km a km según los desniveles reales, el viento estimado y tu nivel de fatiga acumulada.',
    howH2:       '¿Cómo funciona?',
    howSteps:    [
      'Cargás esta carrera (ya tiene el recorrido)',
      'Ingresás tu ritmo objetivo o tiempo meta',
      'El motor calcula splits, hidratación y nutrición km a km',
      'Descargás el plan o lo llevás en el celular el día de la carrera',
    ],
  },
  en: {
    back:        '← Home',
    subtitle:    'Pace, hydration and nutrition · calibrated to the actual course',
    distance:    'Distance',
    elevation:   'Elevation gain',
    drop:        'Elevation loss',
    city:        'City',
    country:     'Country',
    ctaTitle:    'Generate your personalized plan',
    ctaBody:     'In 3 minutes you get a plan tailored to your times, the actual course profile and race-day weather. 7 days free, no credit card.',
    ctaBtn:      'Start free →',
    disclaimer:  'Information is for guidance only. Always verify on the official race website.',
    profileH2:   'Course profile matters',
    profileBody: 'The difference between a generic plan and a smart one is the elevation profile. RaceCopilot adjusts your pace km by km based on real elevation changes, estimated wind and accumulated fatigue.',
    howH2:       'How does it work?',
    howSteps:    [
      'Add this race (route already included)',
      'Enter your target pace or goal time',
      'The engine calculates splits, hydration and nutrition km by km',
      'Download the plan or open it on your phone on race day',
    ],
  },
} as const;

export function RaceSEOLanding({ race, locale }: Props) {
  const t = T[locale];
  const dist = distanceLabel(race.distance_km, locale);

  // CTA con UTMs para atribuir conversiones a SEO orgánico
  const ctaHref = `/login?tab=register&utm_source=seo&utm_medium=organic&utm_campaign=race-${race.slug}`;

  // Schema.org SportsEvent — rich snippet en Google
  const schema = {
    '@context': 'https://schema.org',
    '@type':    'SportsEvent',
    name:       race.name,
    sport:      'Running',
    location: {
      '@type': 'Place',
      name:    race.city,
      address: { '@type': 'PostalAddress', addressLocality: race.city, addressCountry: race.country },
    },
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="max-w-2xl mx-auto px-5 py-12">
        <Link href="/" className="text-sm mb-8 inline-block" style={{ color: 'var(--muted-foreground)' }}>
          {t.back}
        </Link>

        {/* H1 — keyword primaria */}
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">
          {locale === 'es' ? `Plan ${race.name}` : `${race.name} Pacing Plan`}
        </h1>
        <p className="text-base mb-10" style={{ color: 'var(--muted-foreground)' }}>
          {t.subtitle}
        </p>

        {/* Ficha técnica */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 rounded-2xl border mb-10"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <Stat label={t.distance}  value={dist} />
          <Stat label={t.city}      value={race.city} />
          <Stat label={t.country}   value={race.country} />
          {race.gain_m != null && <Stat label={t.elevation} value={`${race.gain_m} m`} />}
          {race.loss_m != null && <Stat label={t.drop}      value={`${race.loss_m} m`} />}
        </div>

        {/* Bloques de contenido para SEO */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{t.profileH2}</h2>
          <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>{t.profileBody}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">{t.howH2}</h2>
          <ol className="space-y-3">
            {t.howSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section
          className="p-8 rounded-2xl text-center border-2"
          style={{ background: 'var(--card)', borderColor: '#f97316' }}
        >
          <h2 className="text-2xl font-bold mb-3">{t.ctaTitle}</h2>
          <p className="mb-6 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {t.ctaBody}
          </p>
          <Link
            href={ctaHref}
            className="inline-block px-8 py-4 rounded-xl font-bold text-sm"
            style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 30px rgba(249,115,22,0.35)' }}
          >
            {t.ctaBtn}
          </Link>
        </section>

        <p className="text-xs text-center mt-8" style={{ color: 'var(--muted-foreground)' }}>
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
