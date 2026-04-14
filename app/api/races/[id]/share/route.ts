// POST /api/races/[id]/share
// Genera (o devuelve) el share_token de una carrera.
// Devuelve la URL pública del plan.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { id } = await params;

  // Verificar que la carrera pertenece al usuario
  const { data: runner } = await supabaseAdmin
    .from('runners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: race } = await supabaseAdmin
    .from('races')
    .select('id, share_token, runner_id')
    .eq('id', id)
    .maybeSingle();

  if (!race || race.runner_id !== runner?.id) {
    return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 });
  }

  // Si ya tiene token, devolver el existente; sino generar uno nuevo
  let token = race.share_token;
  if (!token) {
    token = crypto.randomUUID();
    await supabaseAdmin.from('races').update({ share_token: token }).eq('id', id);
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/p/${token}`;
  return NextResponse.json({ url, token });
}
