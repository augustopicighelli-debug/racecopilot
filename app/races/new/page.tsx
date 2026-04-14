'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useLang } from '@/lib/lang';

export default function NewRacePage() {
  const router = useRouter();
  const { t } = useLang();
  const [runnerId, setRunnerId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [name, setName]               = useState('');
  const [distanceKm, setDistanceKm]   = useState('');
  const [raceDate, setRaceDate]       = useState('');
  const [city, setCity]               = useState('');
  const [targetTime, setTargetTime]   = useState('');
  const [elevGain, setElevGain]       = useState('');
  const [goalType, setGoalType]       = useState<'finish' | 'pr' | 'target'>('pr');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase.from('runners').select('id').eq('user_id', session.user.id).maybeSingle();
      if (!data) { router.push('/onboarding'); return; }
      setRunnerId(data.id);
    };
    init();
  }, [router]);

  const parseTime = (t: string): number | null => {
    const parts = t.trim().split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runnerId) return;
    setLoading(true);
    setError('');
    try {
      let targetTimeSec: number | null = null;
      if (targetTime.trim()) {
        targetTimeSec = parseTime(targetTime);
        if (!targetTimeSec) throw new Error('Tiempo inválido. Usá H:MM:SS');
      }
      // Retornar el id para redirigir directo a la carrera creada
      const { data: newRace, error: err } = await supabase.from('races').insert({
        runner_id:      runnerId,
        name:           name.trim(),
        distance_km:    parseFloat(distanceKm),
        race_date:      raceDate,
        city:           city.trim() || null,
        target_time_s:  targetTimeSec,
        elevation_gain: elevGain ? parseFloat(elevGain) : null,
        goal_type:      goalType,
      }).select('id').single();
      if (err) throw err;
      router.push(`/races/${newRace.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' };
  const labelStyle = { color: 'var(--muted-foreground)' };

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-md mx-auto">

        <button onClick={() => router.push('/dashboard')} className="text-sm mb-6 block" style={{ color: 'var(--muted-foreground)' }}>
          ← Volver
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Nueva carrera</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Ingresá los datos para generar tu plan.
          </p>
        </div>

        <div className="rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Maratón de Mendoza 2026"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Distancia (km)</label>
                <input type="number" step="0.001" min="1" value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)} placeholder="42.195"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Fecha</label>
                <input type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Ciudad <span style={{ color: 'var(--border)' }}>(opcional)</span>
              </label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Mendoza"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>

            {/* Objetivo de la carrera */}
            <div>
              <label className="block text-sm font-medium mb-2" style={labelStyle}>{t.goal.label}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'finish' as const, icon: '🏁', title: t.goal.finishTitle, desc: t.goal.finishDesc },
                  { value: 'pr'     as const, icon: '⚡', title: t.goal.prTitle,     desc: t.goal.prDesc },
                  { value: 'target' as const, icon: '🎯', title: t.goal.targetTitle, desc: t.goal.targetDesc },
                ].map(({ value, icon, title, desc }) => (
                  <button
                    key={value} type="button" onClick={() => setGoalType(value)}
                    className="py-3 px-2 rounded-xl text-left border transition-colors"
                    style={{
                      background:  goalType === value ? 'rgba(249,115,22,0.12)' : 'var(--muted)',
                      borderColor: goalType === value ? 'rgba(249,115,22,0.5)'  : 'var(--border)',
                    }}
                  >
                    <p className="text-base text-center mb-1">{icon}</p>
                    <p className="text-xs font-semibold text-center" style={{ color: goalType === value ? '#f97316' : 'var(--foreground)' }}>
                      {title}
                    </p>
                    <p className="text-xs text-center mt-0.5 leading-tight opacity-60" style={{ color: 'var(--muted-foreground)' }}>
                      {desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  Tiempo objetivo <span style={{ color: 'var(--border)' }}>{goalType === 'target' ? t.goal.timeRequired : `(${t.common.optional})`}</span>
                </label>
                <input type="text" value={targetTime} onChange={(e) => setTargetTime(e.target.value)}
                  placeholder="3:45:00"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  Desnivel + (m) <span style={{ color: 'var(--border)' }}>(opcional)</span>
                </label>
                <input type="number" min="0" value={elevGain} onChange={(e) => setElevGain(e.target.value)}
                  placeholder="250"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={loading || !runnerId}
              className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {loading ? 'Guardando...' : 'Crear carrera →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
