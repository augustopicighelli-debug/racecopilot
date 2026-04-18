// Componente compartido entre /carreras/[slug] (ES) y /races/[slug] (EN).
// Renderiza una landing SEO con el contenido largo + CTA al registro.
// No tiene lógica de negocio — solo presentación a partir del objeto Race.

import Link from 'next/link';
import type { Race } from '@/lib/races/catalog';

type Props = {
  race: Race;
  locale: 'es' | 'en';
};

// Traducciones mínimas inline — estos textos solo se usan acá,
// no vale la pena agregarlos al sistema global de translations.
const T = {
  es: {
    backToHome: '← Inicio',
    when: 'Fecha',
    where: 'Dónde',
    distance: 'Distancia',
    elevation: 'Desnivel acumulado',
    terrain: 'Terreno',
    officialSite: 'Web oficial',
    climateTitle: 'Clima histórico del mes',
    avgTemp: 'Temperatura promedio',
    avgHumidity: 'Humedad promedio',
    climateNote: 'La ciencia del running muestra que por cada grado sobre 12°C el ritmo cae entre 0.3% y 0.5% (Ely et al., 2007). Tu plan debe ajustarse al clima real del día.',
    ctaTitle: 'Generá tu plan personalizado',
    ctaBody: 'Esta guía es un punto de partida. Para un plan ajustado a tus tiempos reales, tu GPX y el clima del día de carrera, creá tu cuenta gratis.',
    ctaBtn: 'Empezá gratis — 7 días',
    disclaimer: 'Las recomendaciones son orientativas. Consultá siempre a tu médico antes de planificar una carrera.',
    terrainLabels: { flat: 'Plano', hilly: 'Con desniveles', mountain: 'Montaña' },
  },
  en: {
    backToHome: '← Home',
    when: 'Date',
    where: 'Where',
    distance: 'Distance',
    elevation: 'Elevation gain',
    terrain: 'Terrain',
    officialSite: 'Official site',
    climateTitle: 'Historical climate',
    avgTemp: 'Average temperature',
    avgHumidity: 'Average humidity',
    climateNote: 'Running science shows that for every degree above 12°C, pace drops 0.3% to 0.5% (Ely et al., 2007). Your plan should adjust to the actual day conditions.',
    ctaTitle: 'Generate your personalized plan',
    ctaBody: 'This guide is a starting point. For a plan tailored to your real times, your GPX and the race-day weather, create your free account.',
    ctaBtn: 'Start free — 7 days',
    disclaimer: 'Recommendations are for guidance only. Always consult your doctor before planning a race.',
    terrainLabels: { flat: 'Flat', hilly: 'Hilly', mountain: 'Mountainous' },
  },
} as const;

export function RaceSEOLanding({ race, locale }: Props) {
  // Elegir copy del idioma correcto
  const t = T[locale];
  const name = locale === 'es' ? race.name_es : race.name_en;
  const notes = locale === 'es' ? race.notes_es : race.notes_en;
  const intro = locale === 'es' ? race.intro_es : race.intro_en;
  const country = locale === 'es' ? race.country_name_es : race.country_name_en;

  // Slug para el CTA — usa el slug del idioma activo
  const slug = locale === 'es' ? race.slug : race.slug_en;

  // CTA URL con UTMs para atribuir la conversión a SEO orgánico
  const ctaHref = `/login?tab=register&utm_source=seo&utm_medium=organic&utm_campaign=race-${slug}`;

  // Fecha formateada según locale
  const dateFormatted = new Date(race.date).toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Schema.org SportsEvent — para que Google muestre rich snippet
  // Este JSON-LD se inyecta en la página vía <script type="application/ld+json">
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    startDate: race.date,
    sport: 'Running',
    location: {
      '@type': 'Place',
      name: race.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: race.city,
        addressCountry: race.country,
      },
    },
    url: race.official_url,
    description: notes,
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* Schema.org — mejora SEO con rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back link a landing */}
        <Link
          href="/"
          className="text-sm mb-8 inline-block"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {t.backToHome}
        </Link>

        {/* H1 principal — keyword primaria */}
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 leading-tight">
          {locale === 'es' ? `Plan ${name}` : `${name} pacing plan`}
        </h1>
        <p
          className="text-lg mb-10"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {locale === 'es'
            ? 'Ritmo, hidratación y nutrición — calibrado al circuito y al clima'
            : 'Pace, hydration and nutrition — calibrated to the course and weather'}
        </p>

        {/* Ficha técnica de la carrera — grid con datos estructurados */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 rounded-2xl border mb-10"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <FieldRow label={t.when} value={dateFormatted} />
          <FieldRow label={t.where} value={`${race.city}, ${country}`} />
          <FieldRow
            label={t.distance}
            value={`${race.distance_km} km`}
          />
          {race.elevation_gain_m !== null && (
            <FieldRow
              label={t.elevation}
              value={`${race.elevation_gain_m} m`}
            />
          )}
          <FieldRow
            label={t.terrain}
            value={t.terrainLabels[race.terrain]}
          />
          {race.official_url && (
            <FieldRow
              label={t.officialSite}
              value={
                <a
                  href={race.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: '#f97316' }}
                >
                  Link
                </a>
              }
            />
          )}
        </div>

        {/* Intro largo — SEO copy principal */}
        <div className="prose-like mb-10 leading-relaxed">
          <p>{intro}</p>
          <p className="mt-4">{notes}</p>
        </div>

        {/* Clima histórico — bloque destacado */}
        {(race.avg_temp_c !== null || race.avg_humidity !== null) && (
          <section
            className="p-6 rounded-2xl border mb-10"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-4">{t.climateTitle}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {race.avg_temp_c !== null && (
                <div>
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {t.avgTemp}
                  </p>
                  <p className="text-2xl font-bold">{race.avg_temp_c}°C</p>
                </div>
              )}
              {race.avg_humidity !== null && (
                <div>
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {t.avgHumidity}
                  </p>
                  <p className="text-2xl font-bold">{race.avg_humidity}%</p>
                </div>
              )}
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {t.climateNote}
            </p>
          </section>
        )}

        {/* CTA final — único botón, con UTM */}
        <section
          className="p-8 rounded-2xl border-2 text-center"
          style={{
            background: 'var(--card)',
            borderColor: '#f97316',
          }}
        >
          <h2 className="text-2xl font-bold mb-3">{t.ctaTitle}</h2>
          <p
            className="mb-6 leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t.ctaBody}
          </p>
          <Link
            href={ctaHref}
            className="inline-block px-8 py-4 rounded-xl font-bold text-sm"
            style={{
              background: '#f97316',
              color: '#fff',
              boxShadow: '0 0 30px rgba(249,115,22,0.4)',
            }}
          >
            {t.ctaBtn}
          </Link>
        </section>

        {/* Disclaimer médico — legal */}
        <p
          className="text-xs text-center mt-10"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}

// Fila compacta de la ficha técnica — label + value
function FieldRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="text-xs uppercase tracking-wider mb-1"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
