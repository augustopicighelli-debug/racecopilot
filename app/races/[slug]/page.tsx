// Landing SEO pública en inglés: /races/[slug]
// Espejo de /carreras/[slug] para mercado anglo (US/UK/CA/AU).

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllRaces, getRaceBySlugEN } from '@/lib/races/catalog';
import { RaceSEOLanding } from '@/components/race-seo-landing';

type Props = { params: Promise<{ slug: string }> };

/**
 * Pre-renderizar todas las landings EN en build time.
 */
export async function generateStaticParams() {
  return getAllRaces().map((race) => ({ slug: race.slug_en }));
}

/**
 * Metadata dinámica EN con hreflang al ES.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const race = getRaceBySlugEN(slug);

  if (!race) return {};

  const title = `${race.name_en} Pacing Plan — Splits, Hydration & Nutrition`;
  const description = race.intro_en.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: `https://racecopilot.com/races/${race.slug_en}`,
      languages: {
        en: `https://racecopilot.com/races/${race.slug_en}`,
        es: `https://racecopilot.com/carreras/${race.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://racecopilot.com/races/${race.slug_en}`,
      locale: 'en_US',
      type: 'article',
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const race = getRaceBySlugEN(slug);

  if (!race) notFound();

  return <RaceSEOLanding race={race} locale="en" />;
}
