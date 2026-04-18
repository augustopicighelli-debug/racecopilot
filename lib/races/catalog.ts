// Helper para cargar y buscar carreras del catálogo SEO programático.
// El JSON lo mantiene el agente race-scraper (.claude/agents/race-scraper.md)
// y el agente seo-content-writer-bilingual enriquece las entradas con copy largo.

import catalog from '@/data/races/catalog.json';

// Tipo de cada entrada del catálogo. Mantener sync con el agente race-scraper.
export type Race = {
  slug: string;                    // slug ES usado en /carreras/[slug]
  slug_en: string;                 // slug EN usado en /races/[slug]
  name_es: string;
  name_en: string;
  date: string;                    // ISO YYYY-MM-DD
  city: string;
  country: string;                 // ISO-2 (ES, AR, MX, ...)
  country_name_es: string;
  country_name_en: string;
  distance_km: number;
  elevation_gain_m: number | null;
  terrain: 'flat' | 'hilly' | 'mountain';
  official_url: string;
  avg_temp_c: number | null;       // temperatura histórica en el mes
  avg_humidity: number | null;
  priority_score: number;          // 0-100, ordenar por esto en listados
  notes_es: string;
  notes_en: string;
  intro_es: string;                // copy largo SEO (200-300 palabras)
  intro_en: string;
};

// Casteo del JSON importado al tipo Race[]
const races = catalog as Race[];

/**
 * Devuelve todas las carreras ordenadas por priority_score desc.
 * Uso típico: generar sitemap + índices.
 */
export function getAllRaces(): Race[] {
  return [...races].sort((a, b) => b.priority_score - a.priority_score);
}

/**
 * Busca una carrera por slug ES. Devuelve undefined si no existe.
 */
export function getRaceBySlugES(slug: string): Race | undefined {
  return races.find((r) => r.slug === slug);
}

/**
 * Busca una carrera por slug EN. Devuelve undefined si no existe.
 */
export function getRaceBySlugEN(slug: string): Race | undefined {
  return races.find((r) => r.slug_en === slug);
}

/**
 * Devuelve las N carreras próximas (por fecha ascendente) desde hoy.
 * Útil para listados en la landing, emails, y el newsletter.
 */
export function getUpcomingRaces(limit = 10): Race[] {
  const today = new Date().toISOString().slice(0, 10);
  return races
    .filter((r) => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}
