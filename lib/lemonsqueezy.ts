/**
 * Cliente para Lemon Squeezy API v1.
 * Docs: https://docs.lemonsqueezy.com/api
 *
 * Requiere env vars:
 *   LEMONSQUEEZY_API_KEY        — clave secreta de LS
 *   LEMONSQUEEZY_STORE_ID       — ID del store (número en la URL del dashboard)
 *   LEMONSQUEEZY_WEBHOOK_SECRET — secreto para verificar firmas de webhooks
 *   LEMONSQUEEZY_VARIANT_MONTHLY — variant ID del plan mensual ($8)
 *   LEMONSQUEEZY_VARIANT_YEARLY  — variant ID del plan anual ($48)
 */

const BASE_URL = 'https://api.lemonsqueezy.com/v1';

/** Headers comunes para todas las requests a LS */
function lsHeaders(): HeadersInit {
  return {
    'Accept':        'application/vnd.api+json',
    'Content-Type':  'application/vnd.api+json',
    'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
  };
}

/** Crea una URL de checkout para el plan indicado.
 *  Devuelve la URL para redirigir al usuario o null si falla. */
export async function createCheckout(
  variantId: string,
  userEmail: string,
  userId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string | null> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    console.error('[LS] LEMONSQUEEZY_STORE_ID no configurado');
    return null;
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_options: { embed: false },
        checkout_data: {
          email: userEmail,
          // user_id se recupera en el webhook para asociar la suscripción
          custom: { user_id: userId },
        },
        product_options: {
          redirect_url: successUrl,
        },
      },
      relationships: {
        store:   { data: { type: 'stores',   id: storeId   } },
        variant: { data: { type: 'variants', id: variantId } },
      },
    },
  };

  try {
    const res = await fetch(`${BASE_URL}/checkouts`, {
      method:  'POST',
      headers: lsHeaders(),
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[LS] createCheckout error:', res.status, err);
      return null;
    }
    const data = await res.json();
    return data?.data?.attributes?.url ?? null;
  } catch (err) {
    console.error('[LS] createCheckout excepción:', err);
    return null;
  }
}

/** Obtiene una suscripción de LS por su ID.
 *  Devuelve el objeto attributes o null. */
export async function getSubscription(subscriptionId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BASE_URL}/subscriptions/${subscriptionId}`, {
      headers: lsHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.attributes ?? null;
  } catch {
    return null;
  }
}

/** Cancela una suscripción (se cancela al final del período actual). */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/subscriptions/${subscriptionId}`, {
      method:  'DELETE',
      headers: lsHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Verifica la firma HMAC-SHA256 del webhook de LS.
 *  Devuelve true si la firma es válida. */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const encoder  = new TextEncoder();
  const key      = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signBuf  = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(signBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}
