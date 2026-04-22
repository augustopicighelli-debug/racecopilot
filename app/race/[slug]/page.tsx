// Landing SEO pública en inglés: /race/[slug]
// ISR: se genera al primer request y se cachea 24h.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllRaces, getRaceBySlug, distanceLabel } from '@/lib/races/catalog';
import { RaceSEOLanding } from '@/components/race-seo-landing';

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const races = await getAllRaces();
  return races.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);
  if (!race) return {};

  const dist  = distanceLabel(race.distance_km, 'en');
  const title = `${race.name} Pacing Plan — Splits, Hydration & Nutrition`;
  const desc  = `Personalized pacing plan for the ${race.city} ${dist}. Km-by-km splits, hydration and nutrition calibrated to the actual course. 7 days free.`;

  return {
    title,
    description: desc,
    alternates: {
      canonical: `https://racecopilot.com/race/${race.slug}`,
      languages: {
        en: `https://racecopilot.com/race/${race.slug}`,
        es: `https://racecopilot.com/carreras/${race.slug}`,
      },
    },
    openGraph: { title, description: desc, url: `https://racecopilot.com/race/${race.slug}`, locale: 'en_US', type: 'article' },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);
  if (!race) notFound();
  return <RaceSEOLanding race={race} locale="en" />;
}
