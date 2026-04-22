import type { MetadataRoute } from 'next';
import { getAllRaces, cleanSlug } from '@/lib/races/catalog';

const BASE = 'https://racecopilot.com';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/terms`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ];

  const races = await getAllRaces();
  const raceLandings: MetadataRoute.Sitemap = races.flatMap((r) => {
    const slug = cleanSlug(r.slug);
    return [
      { url: `${BASE}/carreras/${slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
      { url: `${BASE}/race/${slug}`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ];
  });

  return [...staticPages, ...raceLandings];
}
