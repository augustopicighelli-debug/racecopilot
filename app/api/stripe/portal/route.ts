// API Route: POST /api/stripe/portal
// Crea una sesión del Stripe Customer Portal para que el usuario
// pueda gestionar su suscripción (cambiar tarjeta, ver facturas, cancelar).
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

  // Buscar stripe_customer_id del runner
  const { data: runner } = await supabaseAdmin
    .from('runners')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!runner?.stripe_customer_id) {
    return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 });
  }

  // Crear sesión del portal — redirige al perfil al salir
  const session = await stripe.billingPortal.sessions.create({
    customer:   runner.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
  });

  return NextResponse.json({ url: session.url });
}
