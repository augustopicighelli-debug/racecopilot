// Cron endpoint: envía emails de onboarding, reactivación y upsell post-carrera
// Se llama cada día a las 9am UTC via vercel.json
// Protegido con Authorization: Bearer {CRON_SECRET}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendOnboardingDay1Es,
  sendOnboardingDay3Es,
  sendOnboardingDay5Es,
  sendOnboardingDay7Es,
  sendReactivationDay3Es,
  sendReactivationDay14Es,
  sendReactivationDay45Es,
  sendPostRaceUpsellEs,
} from '@/lib/email/sequences';

// =============================================================================
// GET /api/cron/email-sequences
// =============================================================================
export async function GET(req: NextRequest) {
  // Validar CRON_SECRET
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Obtener todos los usuarios de auth (máx 1000)
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Cargar runners con campos necesarios para cada secuencia
  const { data: runners } = await supabase
    .from('runners')
    .select('id, user_id, is_premium, premium_until');

  // Cargar carreras pasadas (para upsell) de corredores free
  const today = new Date().toISOString().split('T')[0];
  const { data: pastRaces } = await supabase
    .from('races')
    .select('runner_id, name, id')
    .lt('race_date', today);

  const sent: string[] = [];
  const errors: string[] = [];

  const now = Date.now();

  // Helper: días desde una fecha ISO
  function daysSince(isoDate: string): number {
    return Math.round((now - new Date(isoDate).getTime()) / 86400000);
  }

  for (const runner of runners ?? []) {
    const user = users.find(u => u.id === runner.user_id);
    if (!user?.email) continue;

    const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? undefined;

    // === ONBOARDING (basado en created_at del user de auth) ===
    const daysRegistered = daysSince(user.created_at);

    if (daysRegistered === 1) {
      try {
        await sendOnboardingDay1Es(user.email, firstName);
        sent.push(`onboarding-d1:${user.id}`);
      } catch (e: any) { errors.push(`onboarding-d1:${user.id}: ${e.message}`); }
    }

    if (daysRegistered === 3) {
      // Verificar si el runner tiene al menos una carrera cargada
      const { count } = await supabase
        .from('races')
        .select('id', { count: 'exact', head: true })
        .eq('runner_id', runner.id);
      try {
        await sendOnboardingDay3Es(user.email, firstName, (count ?? 0) > 0);
        sent.push(`onboarding-d3:${user.id}`);
      } catch (e: any) { errors.push(`onboarding-d3:${user.id}: ${e.message}`); }
    }

    if (daysRegistered === 5) {
      try {
        await sendOnboardingDay5Es(user.email, firstName);
        sent.push(`onboarding-d5:${user.id}`);
      } catch (e: any) { errors.push(`onboarding-d5:${user.id}: ${e.message}`); }
    }

    if (daysRegistered === 7) {
      try {
        await sendOnboardingDay7Es(user.email, firstName);
        sent.push(`onboarding-d7:${user.id}`);
      } catch (e: any) { errors.push(`onboarding-d7:${user.id}: ${e.message}`); }
    }

    // === REACTIVACIÓN (basado en premium_until, solo para ex-premium) ===
    if (!runner.is_premium && runner.premium_until) {
      const daysSinceCancelled = daysSince(runner.premium_until);

      if (daysSinceCancelled === 3) {
        try {
          await sendReactivationDay3Es(user.email, firstName);
          sent.push(`reactivation-d3:${user.id}`);
        } catch (e: any) { errors.push(`reactivation-d3:${user.id}: ${e.message}`); }
      }

      if (daysSinceCancelled === 14) {
        try {
          await sendReactivationDay14Es(user.email, firstName);
          sent.push(`reactivation-d14:${user.id}`);
        } catch (e: any) { errors.push(`reactivation-d14:${user.id}: ${e.message}`); }
      }

      if (daysSinceCancelled === 45) {
        try {
          await sendReactivationDay45Es(user.email, firstName);
          sent.push(`reactivation-d45:${user.id}`);
        } catch (e: any) { errors.push(`reactivation-d45:${user.id}: ${e.message}`); }
      }
    }

    // === UPSELL POST-CARRERA (solo usuarios free con carreras pasadas) ===
    // Solo se envía una vez: cuando tienen exactamente 3 días desde su primera carrera pasada
    if (!runner.is_premium) {
      const myPastRaces = (pastRaces ?? []).filter(r => r.runner_id === runner.id);
      if (myPastRaces.length > 0) {
        // Tomar la carrera más reciente pasada para calcular días
        // (no tenemos race_date en el join aquí, así que buscamos con otra query)
        const { data: latestPastRace } = await supabase
          .from('races')
          .select('race_date, name, id')
          .eq('runner_id', runner.id)
          .lt('race_date', today)
          .order('race_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestPastRace) {
          const daysSinceRace = daysSince(latestPastRace.race_date + 'T12:00:00');
          // Enviar upsell 3 días después de la carrera
          if (daysSinceRace === 3) {
            try {
              await sendPostRaceUpsellEs(user.email, firstName, latestPastRace.name);
              sent.push(`upsell-postrace:${user.id}`);
            } catch (e: any) { errors.push(`upsell-postrace:${user.id}: ${e.message}`); }
          }
        }
      }
    }
  }

  return NextResponse.json({
    sent: sent.length,
    emails: sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
