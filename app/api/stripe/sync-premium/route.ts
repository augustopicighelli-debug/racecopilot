// POST /api/stripe/sync-premium
// Consulta Stripe directamente para verificar el estado de suscripción del usuario
// y actualiza is_premium en la DB. Bypasea el webhook — útil post-checkout.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // 1. Verificar JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // 2. Buscar runner y su stripe_customer_id
  const { data: runner } = await supabaseAdmin
    .from('runners')
    .select('id, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!runner?.stripe_customer_id) {
    // Sin customer → no tiene suscripción
    return NextResponse.json({ premium: false });
  }

  // 3. Consultar suscripciones activas en Stripe
  const subs = await stripe.subscriptions.list({
    customer: runner.stripe_customer_id,
    limit: 5,
  });

  // Buscar una suscripción activa o en trial
  const activeSub = subs.data.find(
    s => s.status === 'active' || s.status === 'trialing'
  );

  const isPremium    = !!activeSub;
  const premiumUntil = activeSub
    ? new Date(activeSub.current_period_end * 1000).toISOString()
    : null;

  // 4. Actualizar la DB con el estado real de Stripe
  await supabaseAdmin
    .from('runners')
    .update({
      is_premium:             isPremium,
      premium_until:          premiumUntil,
      stripe_subscription_id: activeSub?.id ?? null,
    })
    .eq('id', runner.id);

  return NextResponse.json({ premium: isPremium });
}
