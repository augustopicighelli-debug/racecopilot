// Landing SEO pública en inglés: /race/[slug]
// ISR 24h — nuevas carreras en Supabase aparecen solas sin rebuild.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllRaces, getRaceByCleanSlug, cleanSlug, cleanName, distanceLabel } from '@/lib/races/catalog';
import { RaceSEOLanding } from '@/components/race-seo-landing';

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const races = await getAllRaces();
  return races.map((r) => ({ slug: cleanSlug(r.slug) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const race = await getRaceByCleanSlug(slug);
  if (!race) return {};

  const name  = cleanName(race.name);
  const dist  = distanceLabel(race.distance_km, 'en');
  const title = `${name} Pacing Plan — Splits, Hydration & Nutrition`;
  const desc  = `Personalized pacing plan for the ${race.city} ${dist}. Km-by-km splits, hydration and nutrition calibrated to the actual course. 7 days free.`;
  const url   = `https://racecopilot.com/race/${slug}`;

  return {
    title,
    description: desc,
    alternates: {
      canonical: url,
      languages: { en: url, es: `https://racecopilot.com/carreras/${slug}` },
    },
    openGraph: { title, description: desc, url, locale: 'en_US', type: 'article' },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const race = await getRaceByCleanSlug(slug);
  if (!race) notFound();
  return <RaceSEOLanding race={race} />;
}
