// Landing SEO pública en español: /carreras/[slug]
// Datos vienen de data/races/catalog.json (agente race-scraper + seo-content-writer-bilingual)
// Esta página es estática — Next.js la genera en build con generateStaticParams.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllRaces, getRaceBySlugES } from '@/lib/races/catalog';
import { RaceSEOLanding } from '@/components/race-seo-landing';

// Next 15+ pasa params como Promise en Server Components
type Props = { params: Promise<{ slug: string }> };

/**
 * Pre-renderizar todas las landings en build time.
 * Cada carrera del catálogo se convierte en una URL estática.
 */
export async function generateStaticParams() {
  return getAllRaces().map((race) => ({ slug: race.slug }));
}

/**
 * Metadata dinámica por carrera para SEO (title, description, og image, canonical).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const race = getRaceBySlugES(slug);

  // Si no existe, metadata vacía — notFound() se encarga abajo
  if (!race) return {};

  const title = `Plan ${race.name_es} — Ritmo, Hidratación y Nutrición`;
  const description = race.intro_es.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      // Self-canonical ES + alternate EN para hreflang
      canonical: `https://racecopilot.com/carreras/${race.slug}`,
      languages: {
        es: `https://racecopilot.com/carreras/${race.slug}`,
        en: `https://racecopilot.com/races/${race.slug_en}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://racecopilot.com/carreras/${race.slug}`,
      locale: 'es_ES',
      type: 'article',
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const race = getRaceBySlugES(slug);

  // 404 si el slug no matchea ninguna carrera
  if (!race) notFound();

  return <RaceSEOLanding race={race} locale="es" />;
}
