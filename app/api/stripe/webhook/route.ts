// API Route: POST /api/stripe/webhook
// Recibe eventos de Stripe y actualiza el estado de suscripción en la DB.
// IMPORTANTE: force-dynamic evita que Next.js optimice/buffere el request body,
// lo que rompería la verificación de firma de Stripe.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Cliente Supabase con service role: puede actualizar sin RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Leer el body como buffer raw (necesario para la verificación de firma)
  const rawBody = await req.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret) {
    // Modo producción/staging: verificar firma de Stripe para seguridad
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Sin firma' }, { status: 400 });
    }
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('[Webhook] Firma inválida:', err);
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
    }
  } else {
    // Modo desarrollo sin STRIPE_WEBHOOK_SECRET: parsear sin verificar
    console.warn('[Webhook] STRIPE_WEBHOOK_SECRET no configurado — skipping verificación de firma');
    try {
      event = JSON.parse(rawBody) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }
  }

  // Procesar los eventos relevantes de suscripción
  switch (event.type) {

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      // Determinar si la suscripción da acceso (activa o en trial)
      const isPremium = sub.status === 'active' || sub.status === 'trialing';

      // current_period_end es un Unix timestamp en segundos → convertir a Date
      const premiumUntil = new Date(sub.current_period_end * 1000).toISOString();

      // Actualizar el runner que tenga este customer de Stripe
      const { error } = await supabaseAdmin
        .from('runners')
        .update({
          stripe_subscription_id: sub.id,
          is_premium: isPremium,
          premium_until: premiumUntil,
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error(`[Webhook] Error actualizando runner para customer ${customerId}:`, error);
        // Devolver 500 para que Stripe reintente
        return NextResponse.json({ error: 'Error DB' }, { status: 500 });
      }

      console.log(`[Webhook] ${event.type}: customer ${customerId} → is_premium=${isPremium}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      // Suscripción cancelada/expirada → revocar acceso
      const { error } = await supabaseAdmin
        .from('runners')
        .update({
          is_premium: false,
          stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error(`[Webhook] Error revocando premium para customer ${customerId}:`, error);
        return NextResponse.json({ error: 'Error DB' }, { status: 500 });
      }

      console.log(`[Webhook] subscription.deleted: customer ${customerId} → is_premium=false`);
      break;
    }

    default:
      // Ignorar eventos no manejados (Stripe espera 200 de todas formas)
      console.log(`[Webhook] Evento ignorado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
