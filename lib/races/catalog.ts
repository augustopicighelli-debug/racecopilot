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
  country:      string;   // nombre completo, ej: "Argentina"
  city:         string;
  distance_km:  number;
  gain_m:       number | null;
  loss_m:       number | null;
};

const SELECT = 'id, slug, name, year, country, city, distance_km, gain_m, loss_m';

/** Todas las carreras ordenadas por nombre. */
export async function getAllRaces(): Promise<Race[]> {
  const { data, error } = await supabase
    .from('gpx_catalog')
    .select(SELECT)
    .order('name');
  if (error) { console.error('catalog getAllRaces:', error.message); return []; }
  return (data ?? []) as Race[];
}

/** Busca por slug. Devuelve undefined si no existe. */
export async function getRaceBySlug(slug: string): Promise<Race | undefined> {
  const { data, error } = await supabase
    .from('gpx_catalog')
    .select(SELECT)
    .eq('slug', slug)
    .single();
  if (error || !data) return undefined;
  return data as Race;
}

/** Distancia en texto legible. */
export function distanceLabel(km: number, locale: 'es' | 'en'): string {
  if (Math.abs(km - 42.195) < 0.5) return locale === 'es' ? 'Maratón' : 'Marathon';
  if (Math.abs(km - 21.1)   < 0.3) return locale === 'es' ? 'Media Maratón' : 'Half Marathon';
  if (Math.abs(km - 10)     < 0.3) return '10K';
  if (Math.abs(km - 5)      < 0.3) return '5K';
  return `${km} km`;
}
