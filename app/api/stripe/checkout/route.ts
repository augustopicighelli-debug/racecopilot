// API Route: POST /api/stripe/checkout
// Crea una Checkout Session de Stripe con trial de 7 días.
// Requiere JWT de Supabase en el header Authorization.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

// Cliente Supabase con service role key: puede leer/escribir sin RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación — esperamos "Bearer <jwt>"
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    // Verificar el JWT con Supabase para obtener el usuario
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // 2. Validar el plan recibido en el body
    const body = await req.json();
    const plan: 'monthly' | 'yearly' = body.plan;
    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    // 3. Buscar el runner del usuario para ver si ya tiene stripe_customer_id
    const { data: runner, error: runnerError } = await supabaseAdmin
      .from('runners')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (runnerError) {
      console.error('[Checkout] Error buscando runner:', runnerError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // 4. Crear o recuperar el Customer de Stripe
    let customerId = runner?.stripe_customer_id;

    if (!customerId) {
      // Primera vez: crear customer en Stripe con el email del usuario
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Guardar el stripe_customer_id en la tabla runners
      if (runner) {
        await supabaseAdmin
          .from('runners')
          .update({ stripe_customer_id: customerId })
          .eq('id', runner.id);
      }
    }

    // 5. Determinar origen para las URLs de redirección
    const origin = req.headers.get('origin') ?? 'http://localhost:3000';

    // 6. Crear la Checkout Session con precio inline (no hardcodeamos price IDs)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            // 1500 centavos = $15 mensual | 12000 centavos = $120 anual
            unit_amount: plan === 'monthly' ? 1500 : 12000,
            recurring: {
              interval: plan === 'monthly' ? 'month' : 'year',
            },
            product_data: {
              name: plan === 'monthly' ? 'RaceCopilot Mensual' : 'RaceCopilot Anual',
            },
          },
          quantity: 1,
        },
      ],
      // Trial de 7 días — Stripe no cobra hasta que termine
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing`,
    });

    // 7. Devolver la URL de Stripe para redirigir al usuario
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Checkout] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
