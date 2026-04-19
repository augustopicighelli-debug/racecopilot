// Landing SEO pública en inglés: /race/[slug]
// Ruta EN en singular para no colisionar con /races/[id] (rutas de usuario).

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllRaces, getRaceBySlugEN } from '@/lib/races/catalog';
import { RaceSEOLanding } from '@/components/race-seo-landing';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllRaces().map((race) => ({ slug: race.slug_en }));
}

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
      canonical: `https://racecopilot.com/race/${race.slug_en}`,
      languages: {
        en: `https://racecopilot.com/race/${race.slug_en}`,
        es: `https://racecopilot.com/carreras/${race.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://racecopilot.com/race/${race.slug_en}`,
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
