// Landing SEO pública en español: /carreras/[slug]
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
  const dist  = distanceLabel(race.distance_km, 'es');
  const title = `Plan ${name} — Ritmo, Hidratación y Nutrición`;
  const desc  = `Plan personalizado para la ${dist} de ${race.city}. Splits por km, hidratación y nutrición calibrados al recorrido real. 7 días gratis.`;
  const url   = `https://racecopilot.com/carreras/${slug}`;

  return {
    title,
    description: desc,
    alternates: {
      canonical: url,
      languages: { es: url, en: `https://racecopilot.com/race/${slug}` },
    },
    openGraph: { title, description: desc, url, locale: 'es_ES', type: 'article' },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const race = await getRaceByCleanSlug(slug);
  if (!race) notFound();
  return <RaceSEOLanding race={race} />;
}
