// POST /api/lemonsqueezy/webhook
// Recibe eventos de Lemon Squeezy y actualiza is_premium en Supabase.
// LS firma el body con HMAC-SHA256; verificamos antes de procesar.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get('x-signature') ?? '';

  // Verificar firma (evita requests falsas)
  const valid = await verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    console.error('[LS Webhook] Firma inválida');
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event.meta?.event_name ?? '';
  const sub               = event.data?.attributes;
  const subId             = String(event.data?.id ?? '');

  // user_id se incluye en custom_data durante el checkout
  const userId: string | undefined = event.meta?.custom_data?.user_id;

  console.log(`[LS Webhook] ${eventName} sub=${subId} userId=${userId}`);

  switch (eventName) {

    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_resumed':
    case 'subscription_unpaused': {
      // Activo cuando el status es active o on_trial
      const isPremium   = sub?.status === 'active' || sub?.status === 'on_trial';
      // renews_at = próxima renovación | ends_at = cuándo vence si se canceló
      const premiumUntil = sub?.renews_at ?? sub?.ends_at ?? null;

      // Buscar runner por user_id (mandado en custom_data al crear el checkout)
      if (userId) {
        await supabaseAdmin
          .from('runners')
          .update({
            lemon_subscription_id: subId,
            lemon_customer_id:     String(sub?.customer_id ?? ''),
            is_premium:            isPremium,
            premium_until:         premiumUntil,
          })
          .eq('user_id', userId);
      }
      break;
    }

    case 'subscription_cancelled':
    case 'subscription_expired': {
      // Cancelada/expirada → revocar acceso
      if (userId) {
        await supabaseAdmin
          .from('runners')
          .update({
            is_premium:    false,
            premium_until: sub?.ends_at ?? null,
          })
          .eq('user_id', userId);
      }
      break;
    }

    default:
      console.log(`[LS Webhook] Evento ignorado: ${eventName}`);
  }

  return NextResponse.json({ received: true });
}
