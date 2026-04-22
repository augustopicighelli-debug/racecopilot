// Cron mensual: envía el newsletter el día 1 de cada mes a las 12:00 UTC
// (9am Argentina / 1pm España). Protegido con CRON_SECRET.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMonthlyNewsletterEs, sendMonthlyNewsletterEn } from '@/lib/email/sequences';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Traer todos los usuarios registrados
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // Traer preferencias de idioma
  const { data: runners } = await supabase
    .from('runners')
    .select('user_id, language');

  const runnerLangMap: Record<string, string> = {};
  for (const r of runners ?? []) {
    runnerLangMap[r.user_id] = r.language ?? 'es';
  }

  const sent: string[] = [];
  const errors: string[] = [];

  for (const user of users) {
    if (!user.email) continue;
    const lang = runnerLangMap[user.id] ?? 'es';
    const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? undefined;

    try {
      const sendFn = lang === 'en' ? sendMonthlyNewsletterEn : sendMonthlyNewsletterEs;
      await sendFn(user.email, firstName);
      sent.push(user.id);
    } catch (e: any) {
      errors.push(`${user.id}: ${e.message}`);
    }
  }

  return NextResponse.json({ sent: sent.length, errors: errors.length ? errors : undefined });
}
