'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

// Incluye is_premium para mostrar/ocultar el banner de trial
interface Runner { id: string; weight_kg: number; sweat_level: string; is_premium: boolean | null; }
interface Race { id: string; name: string; distance_km: number; race_date: string; city: string | null; }

export default function DashboardPage() {
  const router = useRouter();
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

        {/* Banner de trial: solo visible si el usuario NO es premium */}
        {runner && !runner.is_premium && (
          <a
            href="/pricing"
            className="flex items-center justify-between rounded-xl px-4 py-3 mb-6 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.4)', color: '#f97316' }}
          >
            <span>Activá tu prueba gratuita de 7 días</span>
            <span>→</span>
          </a>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold">
              Race<span style={{ color: '#f97316' }}>Copilot</span>
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{email}</p>
          </div>
          {/* Acciones del header: perfil y salir */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Mi perfil
            </button>
            <button onClick={handleLogout} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Salir
            </button>
          </div>
        </div>

        {/* Stats del runner */}
        <div className="rounded-xl p-4 border mb-6 flex gap-6 text-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <span style={{ color: 'var(--muted-foreground)' }}>
            Peso: <strong style={{ color: 'var(--foreground)' }}>{runner?.weight_kg} kg</strong>
          </span>
          <span style={{ color: 'var(--muted-foreground)' }}>
            Sudoración: <strong style={{ color: 'var(--foreground)' }}>
              {runner?.sweat_level === 'low' ? 'baja' : runner?.sweat_level === 'medium' ? 'moderada' : 'alta'}
            </strong>
          </span>
        </div>

        {/* Carreras */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Mis carreras</h2>
          <button
            onClick={() => router.push('/races/new')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            + Nueva
          </button>
        </div>

        {races.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="font-medium mb-1">Sin carreras todavía</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Agregá tu primera carrera para generar un plan.
            </p>
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
                      {race.distance_km} km{race.city ? ` · ${race.city}` : ''} · {fmtDate(race.race_date)}
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
