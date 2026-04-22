// Helper para leer carreras del catálogo SEO desde Supabase.
// Reemplaza el JSON estático — cualquier carrera nueva en gpx_catalog
// aparece automáticamente en las landings sin rebuild.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type Race = {
  id:           number;
  slug:         string;
  name:         string;
  year:         number;
  country:      string;
  city:         string;
  distance_km:  number;
  gain_m:       number | null;
  loss_m:       number | null;
};

const SELECT = 'id, slug, name, year, country, city, distance_km, gain_m, loss_m';

/** Elimina el año (20XX) del slug para URLs limpias. */
export function cleanSlug(slug: string): string {
  return slug.replace(/-20\d\d/g, '');
}

/** Elimina el año del nombre para display. */
export function cleanName(name: string): string {
  return name.replace(/\s+20\d\d\b/g, '').trim();
}

/** Todas las carreras ordenadas por nombre. */
export async function getAllRaces(): Promise<Race[]> {
  const { data, error } = await supabase
    .from('gpx_catalog')
    .select(SELECT)
    .order('name');
  if (error) { console.error('catalog getAllRaces:', error.message); return []; }
  return (data ?? []) as Race[];
}

/**
 * Busca por clean slug (sin año).
 * Carga todas y filtra en memoria — evita consulta compleja en Supabase.
 */
export async function getRaceByCleanSlug(slug: string): Promise<Race | undefined> {
  const all = await getAllRaces();
  return all.find((r) => cleanSlug(r.slug) === slug);
}

/** Distancia en texto legible. */
export function distanceLabel(km: number, locale: 'es' | 'en'): string {
  if (Math.abs(km - 42.195) < 0.5) return locale === 'es' ? 'Maratón' : 'Marathon';
  if (Math.abs(km - 21.1)   < 0.3) return locale === 'es' ? 'Media Maratón' : 'Half Marathon';
  if (Math.abs(km - 10)     < 0.3) return '10K';
  if (Math.abs(km - 5)      < 0.3) return '5K';
  return `${km} km`;
}
