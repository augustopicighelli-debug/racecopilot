// Landing SEO pública en español: /carreras/[slug]
// ISR: se genera al primer request y se cachea 24h — nuevas carreras en Supabase
// aparecen solas sin rebuild.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllRaces, getRaceBySlug, distanceLabel } from '@/lib/races/catalog';
import { RaceSEOLanding } from '@/components/race-seo-landing';

export const revalidate = 86400; // 24h
export const dynamicParams = true; // permite slugs no pre-generados

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const races = await getAllRaces();
  return races.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);
  if (!race) return {};

  const dist  = distanceLabel(race.distance_km, 'es');
  const title = `Plan ${race.name} — Ritmo, Hidratación y Nutrición`;
  const desc  = `Plan personalizado para la ${dist} de ${race.city}. Splits por km, hidratación y nutrición calibrados al recorrido real. 7 días gratis.`;

  return {
    title,
    description: desc,
    alternates: {
      canonical: `https://racecopilot.com/carreras/${race.slug}`,
      languages: {
        es: `https://racecopilot.com/carreras/${race.slug}`,
        en: `https://racecopilot.com/race/${race.slug}`,
      },
    },
    openGraph: { title, description: desc, url: `https://racecopilot.com/carreras/${race.slug}`, locale: 'es_ES', type: 'article' },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);
  if (!race) notFound();
  return <RaceSEOLanding race={race} locale="es" />;
}
