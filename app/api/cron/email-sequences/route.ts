// Cron endpoint: envía emails de onboarding, reactivación y upsell post-carrera
// Se llama cada día a las 9am UTC via vercel.json
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendOnboardingDay1Es, sendOnboardingDay1En,
  sendOnboardingDay3Es, sendOnboardingDay3En,
  sendOnboardingDay5Es, sendOnboardingDay5En,
  sendOnboardingDay7Es, sendOnboardingDay7En,
  sendReactivationDay3Es, sendReactivationDay3En,
  sendReactivationDay14Es, sendReactivationDay14En,
  sendReactivationDay45Es, sendReactivationDay45En,
  sendPostRaceUpsellEs, sendPostRaceUpsellEn,
} from '@/lib/email/sequences';

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

  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  const { data: runners } = await supabase
    .from('runners')
    .select('id, user_id, is_premium, premium_until, language');

  const today = new Date().toISOString().split('T')[0];
  const { data: pastRaces } = await supabase
    .from('races').select('runner_id, name, id').lt('race_date', today);

  const sent: string[] = [];
  const errors: string[] = [];
  const now = Date.now();

  function daysSince(isoDate: string): number {
    return Math.round((now - new Date(isoDate).getTime()) / 86400000);
  }

  for (const runner of runners ?? []) {
    const user = users.find(u => u.id === runner.user_id);
    if (!user?.email) continue;

    const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? undefined;
    const en = (runner.language ?? 'es') === 'en';

    // === ONBOARDING ===
    const daysRegistered = daysSince(user.created_at);

    if (daysRegistered === 1) {
      try {
        await (en ? sendOnboardingDay1En : sendOnboardingDay1Es)(user.email, firstName);
        sent.push(`onboarding-d1:${user.id}`);
      } catch (e: any) { errors.push(`onboarding-d1:${user.id}: ${e.message}`); }
    }

    if (daysRegistered === 3) {
      const { count } = await supabase
        .from('races').select('id', { count: 'exact', head: true }).eq('runner_id', runner.id);
      try {
        await (en ? sendOnboardingDay3En : sendOnboardingDay3Es)(user.email, firstName, (count ?? 0) > 0);
        sent.push(`onboarding-d3:${user.id}`);
      } catch (e: any) { errors.push(`onboarding-d3:${user.id}: ${e.message}`); }
    }

    if (daysRegistered === 5) {
      try {
        await (en ? sendOnboardingDay5En : sendOnboardingDay5Es)(user.email, firstName);
        sent.push(`onboarding-d5:${user.id}`);
      } catch (e: any) { errors.push(`onboarding-d5:${user.id}: ${e.message}`); }
    }

    if (daysRegistered === 7) {
      try {
        await (en ? sendOnboardingDay7En : sendOnboardingDay7Es)(user.email, firstName);
        sent.push(`onboarding-d7:${user.id}`);
      } catch (e: any) { errors.push(`onboarding-d7:${user.id}: ${e.message}`); }
    }

    // === REACTIVACIÓN ===
    if (!runner.is_premium && runner.premium_until) {
      const daysSinceCancelled = daysSince(runner.premium_until);

      if (daysSinceCancelled === 3) {
        try {
          await (en ? sendReactivationDay3En : sendReactivationDay3Es)(user.email, firstName);
          sent.push(`reactivation-d3:${user.id}`);
        } catch (e: any) { errors.push(`reactivation-d3:${user.id}: ${e.message}`); }
      }
      if (daysSinceCancelled === 14) {
        try {
          await (en ? sendReactivationDay14En : sendReactivationDay14Es)(user.email, firstName);
          sent.push(`reactivation-d14:${user.id}`);
        } catch (e: any) { errors.push(`reactivation-d14:${user.id}: ${e.message}`); }
      }
      if (daysSinceCancelled === 45) {
        try {
          await (en ? sendReactivationDay45En : sendReactivationDay45Es)(user.email, firstName);
          sent.push(`reactivation-d45:${user.id}`);
        } catch (e: any) { errors.push(`reactivation-d45:${user.id}: ${e.message}`); }
      }
    }

    // === UPSELL POST-CARRERA ===
    if (!runner.is_premium) {
      const myPastRaces = (pastRaces ?? []).filter(r => r.runner_id === runner.id);
      if (myPastRaces.length > 0) {
        const { data: latestPastRace } = await supabase
          .from('races').select('race_date, name, id')
          .eq('runner_id', runner.id).lt('race_date', today)
          .order('race_date', { ascending: false }).limit(1).maybeSingle();

        if (latestPastRace) {
          const daysSinceRace = daysSince(latestPastRace.race_date + 'T12:00:00');
          if (daysSinceRace === 3) {
            try {
              await (en ? sendPostRaceUpsellEn : sendPostRaceUpsellEs)(user.email, firstName, latestPastRace.name);
              sent.push(`upsell-postrace:${user.id}`);
            } catch (e: any) { errors.push(`upsell-postrace:${user.id}: ${e.message}`); }
          }
        }
      }
    }
  }

  return NextResponse.json({ sent: sent.length, emails: sent, errors: errors.length ? errors : undefined });
}
