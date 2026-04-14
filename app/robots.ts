import type { MetadataRoute } from 'next';

// robots.txt generado dinámicamente por Next.js
// Bloquea las páginas autenticadas / privadas del crawler
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/profile',
          '/onboarding',
          '/races/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://racecopilot.vercel.app/sitemap.xml',
  };
}
