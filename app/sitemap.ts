import type { MetadataRoute } from 'next';
import { getAllRaces } from '@/lib/races/catalog';

const BASE_URL = 'https://racecopilot.vercel.app';

// sitemap.xml generado dinámicamente
// Incluye páginas públicas + todas las landings SEO de /carreras/[slug] y /races/[slug]
export default function sitemap(): MetadataRoute.Sitemap {
  // Páginas estáticas fijas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              `${BASE_URL}/`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${BASE_URL}/pricing`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/terms`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.3,
    },
    {
      url:              `${BASE_URL}/privacy`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.3,
    },
  ];

  // Landings SEO por carrera — una URL ES y otra EN por cada carrera del catálogo
  const raceLandings: MetadataRoute.Sitemap = getAllRaces().flatMap((race) => [
    {
      url:              `${BASE_URL}/carreras/${race.slug}`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    {
      url:              `${BASE_URL}/races/${race.slug_en}`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.7,
    },
  ]);

  return [...staticPages, ...raceLandings];
}
