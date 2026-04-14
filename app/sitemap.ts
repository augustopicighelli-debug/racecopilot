import type { MetadataRoute } from 'next';

const BASE_URL = 'https://racecopilot.vercel.app';

// sitemap.xml generado dinámicamente
// Solo incluye páginas públicas indexables
export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
}
