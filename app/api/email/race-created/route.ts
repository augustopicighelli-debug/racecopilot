// Envía confirmación de carrera creada al usuario
// POST con {raceId} — fetcha los datos de la carrera y manda el email
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendRaceCreatedEmail } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.email) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const { raceId } = await req.json();
  if (!raceId) return NextResponse.json({ error: 'Falta raceId' }, { status: 400 });

  const { data: race } = await supabase
    .from('races')
    .select('id, name, race_date, distance_km, city')
    .eq('id', raceId)
    .maybeSingle();

  if (!race) return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 });

  try {
    await sendRaceCreatedEmail(user.email, race.name, race.race_date, race.id, race.distance_km, race.city);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[race-created email]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
