'use client';

// Landing SEO compartida entre /carreras/[slug] (ES) y /race/[slug] (EN).
// Client component para que el toggle de idioma funcione.

import Link from 'next/link';
import type { Race } from '@/lib/races/catalog';
import { cleanName, distanceLabel } from '@/lib/races/utils';
import { useLang } from '@/lib/lang';
import { trackEvent } from '@/lib/analytics/pixels';

type Props = { race: Race };

export function RaceSEOLanding({ race }: Props) {
  const { t, lang } = useLang();
  const locale = lang as 'es' | 'en';

  const name = cleanName(race.name);
  const dist = distanceLabel(race.distance_km, locale);
  const ctaHref = `/login?tab=register&utm_source=seo&utm_medium=organic&utm_campaign=race-${race.slug}`;

  const copy = locale === 'es' ? {
    back:        '← Inicio',
    subtitle:    'Ritmo, hidratación y nutrición · calibrado al recorrido real',
    distance:    'Distancia',
    elevation:   'Desnivel positivo',
    drop:        'Desnivel negativo',
    city:        'Ciudad',
    country:     'País',
    profileH2:   'El recorrido importa',
    profileBody: 'La diferencia entre un plan genérico y uno inteligente está en el perfil de elevación. RaceCopilot ajusta tu ritmo km a km según los desniveles reales, el viento estimado y tu nivel de fatiga acumulada.',
    howH2:       '¿Cómo funciona?',
    howSteps:    ['Cargás esta carrera (ya tiene el recorrido)', 'Ingresás tu ritmo objetivo o tiempo meta', 'El motor calcula splits, hidratación y nutrición km a km', 'Descargás el plan o lo llevás en el celular el día de la carrera'],
    ctaTitle:    'Generá tu plan personalizado',
    ctaBody:     'En 3 minutos tenés un plan ajustado a tus tiempos, el recorrido real de esta carrera y el clima del día. 7 días gratis, sin tarjeta.',
    ctaBtn:      'Empezar gratis →',
    disclaimer:  'Datos orientativos. Verificá siempre en el sitio oficial de la carrera.',
    h1:          `Plan ${name}`,
  } : {
    back:        '← Home',
    subtitle:    'Pace, hydration and nutrition · calibrated to the actual course',
    distance:    'Distance',
    elevation:   'Elevation gain',
    drop:        'Elevation loss',
    city:        'City',
    country:     'Country',
    profileH2:   'Course profile matters',
    profileBody: 'The difference between a generic plan and a smart one is the elevation profile. RaceCopilot adjusts your pace km by km based on real elevation changes, estimated wind and accumulated fatigue.',
    howH2:       'How does it work?',
    howSteps:    ['Add this race (route already included)', 'Enter your target pace or goal time', 'The engine calculates splits, hydration and nutrition km by km', 'Download the plan or open it on your phone on race day'],
    ctaTitle:    'Generate your personalized plan',
    ctaBody:     'In 3 minutes you get a plan tailored to your times, the actual course profile and race-day weather. 7 days free, no credit card.',
    ctaBtn:      'Start free →',
    disclaimer:  'Information is for guidance only. Always verify on the official race website.',
    h1:          `${name} Pacing Plan`,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto px-5 py-12">
        <Link href="/" className="text-sm mb-8 inline-block" style={{ color: 'var(--muted-foreground)' }}>
          {copy.back}
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">{copy.h1}</h1>
        <p className="text-base mb-10" style={{ color: 'var(--muted-foreground)' }}>{copy.subtitle}</p>

        {/* Ficha técnica */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 rounded-2xl border mb-10"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <Stat label={copy.distance} value={dist} />
          <Stat label={copy.city}     value={race.city} />
          <Stat label={copy.country}  value={race.country} />
          {race.gain_m != null && <Stat label={copy.elevation} value={`${race.gain_m} m`} />}
          {race.loss_m != null && <Stat label={copy.drop}      value={`${race.loss_m} m`} />}
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{copy.profileH2}</h2>
          <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>{copy.profileBody}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">{copy.howH2}</h2>
          <ol className="space-y-3">
            {copy.howSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                  {i + 1}
                </span>
                <span style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="p-8 rounded-2xl text-center border-2"
          style={{ background: 'var(--card)', borderColor: '#f97316' }}>
          <h2 className="text-2xl font-bold mb-3">{copy.ctaTitle}</h2>
          <p className="mb-6 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{copy.ctaBody}</p>
          <Link href={ctaHref} className="inline-block px-8 py-4 rounded-xl font-bold text-sm"
            style={{ background: '#f97316', color: '#fff', boxShadow: '0 0 30px rgba(249,115,22,0.35)' }}
            onClick={() => trackEvent('Lead', { source: 'seo_landing', race: race.slug })}>
            {copy.ctaBtn}
          </Link>
        </section>

        <p className="text-xs text-center mt-8" style={{ color: 'var(--muted-foreground)' }}>
          {copy.disclaimer}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
