// POST /api/lemonsqueezy/checkout
// Crea una URL de checkout de Lemon Squeezy para el plan indicado.
// Requiere JWT de Supabase en el header Authorization.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckout } from '@/lib/lemonsqueezy';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // 1. Verificar autenticación
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // 2. Validar el plan
  const body = await req.json();
  const plan: 'monthly' | 'yearly' = body.plan;
  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
  }

  // 3. Elegir el variant ID según el plan
  const variantId = plan === 'monthly'
    ? process.env.LEMONSQUEEZY_VARIANT_MONTHLY!
    : process.env.LEMONSQUEEZY_VARIANT_YEARLY!;

  // 4. Crear la URL de checkout en LS
  const origin     = req.headers.get('origin') ?? 'https://racecopilot.com';
  const successUrl = `${origin}/dashboard?checkout=success`;
  const cancelUrl  = `${origin}/pricing`;

  const checkoutUrl = await createCheckout(
    variantId,
    user.email!,
    user.id,
    successUrl,
    cancelUrl,
  );

  if (!checkoutUrl) {
    return NextResponse.json({ error: 'Error al crear el checkout' }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutUrl });
}
