// GET /api/gpx/catalog — todas las carreras del catálogo ordenadas por país y nombre
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('gpx_catalog')
    .select('slug, name, country, city, distance_km, gain_m, loss_m')
    .order('country')
    .order('name');

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'public, max-age=3600' }, // cachear 1h en CDN
  });
}
