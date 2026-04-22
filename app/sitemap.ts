import type { MetadataRoute } from 'next';
import { getAllRaces } from '@/lib/races/catalog';

const BASE = 'https://racecopilot.com';

export const revalidate = 86400; // regenerar el sitemap cada 24h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/terms`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ];

  // Una URL ES y una EN por cada carrera del catálogo
  const races = await getAllRaces();
  const raceLandings: MetadataRoute.Sitemap = races.flatMap((r) => [
    { url: `${BASE}/carreras/${r.slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/race/${r.slug}`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]);

  return [...staticPages, ...raceLandings];
}
