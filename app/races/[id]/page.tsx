'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

interface Race {
  id: string;
  name: string;
  distance_km: number;
  race_date: string;
  city: string | null;
  target_time_s: number | null;
  elevation_gain: number | null;
}

// Formatea segundos → H:MM:SS
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// Formatea segundos/km → M:SS /km
function fmtPace(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2,'0')} /km`;
}

export default function RacePage() {
  const router   = useRouter();
  const params   = useParams();
  const id       = params?.id as string;
  const [race, setRace]       = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data, error: err } = await supabase
        .from('races')
        .select('id,name,distance_km,race_date,city,target_time_s,elevation_gain')
        .eq('id', id)
        .maybeSingle();

      if (err || !data) { setError('Carrera no encontrada'); setLoading(false); return; }
      setRace(data);
      setLoading(false);
    };
    init();
  }, [id, router]);

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d + 'T12:00:00').getTime() - Date.now()) / 86400000);
    if (diff > 0) return `Faltan ${diff} días`;
    if (diff === 0) return '¡Es hoy!';
    return `Hace ${Math.abs(diff)} días`;
  };

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // Pace estimado a partir del tiempo objetivo
  const estimatedPace = race?.target_time_s
    ? race.target_time_s / race.distance_km
    : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
      Cargando...
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <p style={{ color: 'var(--muted-foreground)' }}>{error}</p>
      <button onClick={() => router.push('/dashboard')} className="text-sm" style={{ color: 'var(--primary)' }}>
        ← Volver al dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <button onClick={() => router.push('/dashboard')} className="text-sm mb-6 block" style={{ color: 'var(--muted-foreground)' }}>
          ← Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{race?.name}</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: 'var(--muted-foreground)' }}>
            {race ? fmtDate(race.race_date) : ''}{race?.city ? ` · ${race.city}` : ''}
          </p>
        </div>

        {/* Stats de la carrera */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Distancia', value: `${race?.distance_km} km` },
            { label: 'Cuenta regresiva', value: race ? daysUntil(race.race_date) : '' },
            { label: 'Tiempo objetivo', value: race?.target_time_s ? fmtTime(race.target_time_s) : '—' },
            { label: 'Ritmo objetivo', value: estimatedPace ? fmtPace(estimatedPace) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              <p className="font-semibold text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Desnivel */}
        {race?.elevation_gain && (
          <div className="rounded-xl border p-4 mb-6 flex items-center gap-3" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <span className="text-lg">⛰</span>
            <div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Desnivel positivo</p>
              <p className="font-semibold text-sm">{race.elevation_gain} m</p>
            </div>
          </div>
        )}

        {/* Plan — próximamente */}
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="text-3xl mb-3">🏃</div>
          <p className="font-semibold mb-2">Plan de carrera</p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Para generar tu plan completo necesitamos tus carreras de referencia
            (tiempos pasados) para calibrar el predictor.
          </p>
          <button
            className="px-4 py-2 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
            style={{ background: 'var(--primary)', color: '#fff' }}
            disabled
          >
            Generar plan — próximamente
          </button>
        </div>

      </div>
    </div>
  );
}
