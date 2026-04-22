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

// Re-exportar desde utils para que los server components puedan importar todo desde acá
export { cleanSlug, cleanName, distanceLabel } from './utils';

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

