// POST /api/lemonsqueezy/portal
// Devuelve la URL del customer portal de LS para que el usuario
// gestione su suscripción (cambiar tarjeta, cancelar, etc).
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSubscription } from '@/lib/lemonsqueezy';

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

  // Buscar el runner y su suscripción de LS
  const { data: runner } = await supabaseAdmin
    .from('runners')
    .select('lemon_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!runner?.lemon_subscription_id) {
    return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 });
  }

  // Recuperar la suscripción de LS para obtener la URL del portal
  const sub = await getSubscription(runner.lemon_subscription_id);
  const portalUrl: string | undefined = (sub?.urls as any)?.customer_portal;

  if (!portalUrl) {
    return NextResponse.json({ error: 'Portal no disponible' }, { status: 500 });
  }

  return NextResponse.json({ url: portalUrl });
}
