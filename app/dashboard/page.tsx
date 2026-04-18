'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useUnits } from '@/lib/units';
import { UnitsToggle } from '@/components/units-toggle';
import { useLang } from '@/lib/lang';

// Incluye is_premium para mostrar/ocultar el banner de trial
interface Runner { id: string; weight_kg: number; sweat_level: string; is_premium: boolean | null; }
interface Race { id: string; name: string; distance_km: number; race_date: string; city: string | null; }

// Componente separado para usar useSearchParams (requiere Suspense en Next.js 15)
function DashboardContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const checkoutOk   = searchParams.get('checkout') === 'success';
  const { fmtDist, fmtWeight } = useUnits();
  const { t } = useLang();
  const d = t.dashboard;
  const n = t.nav;

  const [email, setEmail]     = useState('');
  const [runner, setRunner]   = useState<Runner | null>(null);
  const [races, setRaces]     = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setEmail(session.user.email ?? '');

      // Traer también is_premium para el banner de trial
      const { data: r } = await supabase.from('runners').select('id,weight_kg,sweat_level,is_premium')
        .eq('user_id', session.user.id).maybeSingle();
      if (!r) { router.push('/onboarding'); return; }
      setRunner(r);

      const { data: rs } = await supabase.from('races')
        .select('id,name,distance_km,race_date,city')
        .eq('runner_id', r.id).order('race_date', { ascending: true });
      setRaces(rs ?? []);
      setLoading(false);
    };
    init();
  }, [router]);

  // Estado del banner post-checkout (se oculta cuando se confirma premium o tras 10s)
  const [showBanner, setShowBanner] = useState(checkoutOk);

  // Sync premium via Stripe directo al volver de checkout.
  // Evita depender del webhook (que puede tardar o no estar configurado).
  useEffect(() => {
    if (!checkoutOk || !runner) return;

    let attempts = 0;

    const syncPremium = async () => {
      attempts++;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      try {
        const res = await fetch('/api/stripe/sync-premium', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return false;
        const { premium } = await res.json();
        return !!premium;
      } catch {
        return false;
      }
    };

    const run = async () => {
      // Intentar hasta 8 veces con 2s entre intentos (≈16s máximo)
      while (attempts < 8) {
        const isPremium = await syncPremium();
        if (isPremium) {
          // Actualizar runner local y ocultar banner
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: fresh } = await supabase
              .from('runners')
              .select('id,weight_kg,sweat_level,is_premium')
              .eq('user_id', session.user.id)
              .maybeSingle();
            if (fresh) setRunner(fresh);
          }
          setShowBanner(false);
          // Limpiar el param ?checkout=success de la URL
          window.history.replaceState(null, '', '/dashboard');
          return;
        }
        // Esperar 2s antes del próximo intento
        await new Promise(r => setTimeout(r, 2000));
      }
      // Fallback: ocultar banner después de 10s aunque no se confirme
      setShowBanner(false);
      window.history.replaceState(null, '', '/dashboard');
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOk]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d + 'T12:00:00').getTime() - Date.now()) / 86400000);
    return diff > 0 ? `en ${diff}d` : diff === 0 ? 'hoy' : 'pasada';
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
      Cargando...
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Banner post-checkout: visible hasta que se confirme premium o tras timeout */}
        {showBanner && (
          <div
            className="rounded-xl px-4 py-3 mb-6 text-sm font-medium"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}
          >
            {d.checkoutBanner}
          </div>
        )}

        {runner && !runner.is_premium && !checkoutOk && (
          <a
            href="/pricing"
            className="flex items-center justify-between rounded-xl px-4 py-3 mb-6 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.4)', color: '#f97316' }}
          >
            <span>{d.trialBanner}</span>
            <span>→</span>
          </a>
        )}

        {/* Email del usuario */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{email}</p>
          <button
            onClick={() => router.push('/season')}
            className="text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t.season.link}
          </button>
        </div>

        {/* Stats del runner */}
        <div className="rounded-xl p-4 border mb-6 flex gap-6 text-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <span style={{ color: 'var(--muted-foreground)' }}>
            {d.weight}: <strong style={{ color: 'var(--foreground)' }}>{runner ? fmtWeight(runner.weight_kg) : '—'}</strong>
          </span>
          <span style={{ color: 'var(--muted-foreground)' }}>
            {d.sweat}: <strong style={{ color: 'var(--foreground)' }}>
              {runner?.sweat_level === 'low' ? d.sweatLow : runner?.sweat_level === 'medium' ? d.sweatMedium : d.sweatHigh}
            </strong>
          </span>
        </div>

        {/* Carreras */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{d.myRaces}</h2>
          <button
            onClick={() => router.push('/races/new')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {d.newRace}
          </button>
        </div>

        {races.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="font-medium mb-1">{d.noRaces}</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{d.noRacesDesc}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {races.map((race) => (
              <button
                key={race.id}
                onClick={() => router.push(`/races/${race.id}`)}
                className="w-full rounded-xl border p-4 text-left transition-colors"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{race.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {fmtDist(race.distance_km)}{race.city ? ` · ${race.city}` : ''} · {fmtDate(race.race_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                      {daysUntil(race.race_date)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Suspense requerido por Next.js 15 cuando se usa useSearchParams en un Client Component
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
        Cargando...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
