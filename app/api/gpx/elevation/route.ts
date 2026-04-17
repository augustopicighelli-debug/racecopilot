// GET /api/gpx/elevation?slug=maraton-de-mendoza-2025-42k
// Devuelve el perfil de elevación pre-cocinado desde Supabase.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.replace(/[^a-z0-9-]/g, '') ?? '';
  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 });

  const { data, error } = await supabase
    .from('gpx_catalog')
    .select('slug, name, distance_km, gain_m, loss_m, elevation_profile')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(data);
}
