// POST /api/lemonsqueezy/cancel
// Cancela la suscripción de LS al final del período actual.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelSubscription } from '@/lib/lemonsqueezy';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Verificar JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // Buscar suscripción activa
  const { data: runner } = await supabaseAdmin
    .from('runners')
    .select('id,lemon_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!runner?.lemon_subscription_id) {
    return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 });
  }

  const ok = await cancelSubscription(runner.lemon_subscription_id);
  if (!ok) {
    return NextResponse.json({ error: 'Error al cancelar' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
