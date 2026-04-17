// GET /api/gpx/search?q=mendoza
// Busca en gpx_catalog (Supabase) por nombre o ciudad.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('gpx_catalog')
    .select('slug, name, country, city, distance_km, gain_m, loss_m')
    .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
    .order('name')
    .limit(8);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
