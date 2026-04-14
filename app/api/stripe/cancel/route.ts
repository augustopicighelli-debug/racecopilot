// API Route: POST /api/stripe/cancel
// Cancela la suscripción al final del período actual (el usuario mantiene acceso hasta premium_until).
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

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

  // Buscar el runner y su suscripción
  const { data: runner } = await supabaseAdmin
    .from('runners')
    .select('id,stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!runner?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 });
  }

  // Cancelar al final del período (el usuario mantiene acceso hasta premium_until)
  await stripe.subscriptions.update(runner.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  return NextResponse.json({ ok: true });
}
