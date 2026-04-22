// Endpoint para enviar el email de bienvenida al usuario recién registrado
// Llamado desde onboarding/page.tsx después de guardar el perfil
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail, sendWelcomeEmailEn } from '@/lib/email/resend';

// =============================================================================
// POST /api/email/welcome
// Lee la sesión del JWT en el header Authorization y envía el email
// =============================================================================
export async function POST(req: NextRequest) {
  // Extraer el JWT del header Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Sin autorización' }, { status: 401 });
  }
  const token = authHeader.slice(7); // quitar "Bearer "

  // Crear cliente Supabase para verificar el JWT y obtener el usuario
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Obtener el usuario autenticado a partir del JWT
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  // Obtener idioma del runner para elegir versión del email
  const { data: runner } = await supabase
    .from('runners')
    .select('language')
    .eq('user_id', user.id)
    .single();
  const lang = runner?.language ?? 'es';

  try {
    // Enviar email de bienvenida en el idioma del usuario
    const sendFn = lang === 'en' ? sendWelcomeEmailEn : sendWelcomeEmail;
    await sendFn(user.email);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Loguear el error pero no bloqueamos el onboarding si el email falla
    console.error('[welcome email]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
