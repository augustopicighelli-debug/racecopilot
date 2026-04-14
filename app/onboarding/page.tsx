'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

// Descripción visual del nivel de sudoración para ayudar al usuario a elegir
const SWEAT_OPTIONS = [
  {
    value: 'low'    as const,
    label: 'Poco',
    desc:  'Apenas sudás, sin manchas de sal',
  },
  {
    value: 'medium' as const,
    label: 'Moderado',
    desc:  'Sudás bastante pero sin manchas marcadas',
  },
  {
    value: 'high'   as const,
    label: 'Mucho',
    desc:  'Manchas blancas de sal en la ropa',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [sweat, setSweat]       = useState<'low'|'medium'|'high'>('medium');
  const [maxHr, setMaxHr]       = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [weeklyKm, setWeeklyKm] = useState('');

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase.from('runners').select('id').eq('user_id', session.user.id).maybeSingle();
      if (data) router.push('/dashboard');
    };
    check();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sin sesión');

      const { error: err } = await supabase.from('runners').insert({
        user_id:    session.user.id,
        weight_kg:  parseFloat(weightKg),
        height_cm:  parseFloat(heightCm),
        sweat_level: sweat,
        max_hr:     maxHr     ? parseInt(maxHr)      : null,
        resting_hr: restingHr ? parseInt(restingHr)  : null,
        weekly_km:  weeklyKm  ? parseFloat(weeklyKm) : null,
      });
      if (err) throw err;

      // Email de bienvenida — no crítico, ignorar errores
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch { /* silencioso */ }

      router.push('/pricing');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">

        {/* Logo + intro */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Race<span style={{ color: '#f97316' }}>Copilot</span>
          </h1>
          <p className="mt-2 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            Configurá tu perfil
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Estos datos calibran tu plan de hidratación, nutrición y ritmo.
            Solo tomará 1 minuto.
          </p>
        </div>

        <div className="rounded-xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Separador sección obligatoria */}
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Datos esenciales
            </p>

            {/* Peso y altura */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Peso</label>
                <div className="relative">
                  <input type="number" step="0.1" min="30" max="200" value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)} placeholder="70"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-10" style={inputStyle} required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>kg</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Calcula tu pérdida de líquido por hora</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Altura</label>
                <div className="relative">
                  <input type="number" step="0.1" min="120" max="230" value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)} placeholder="170"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-10" style={inputStyle} required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>cm</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Usada junto al peso para la tasa de sudor</p>
              </div>
            </div>

            {/* Sudoración */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Nivel de sudoración</label>
              <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Determina cuánto sodio y líquido necesitás reponer
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SWEAT_OPTIONS.map(({ value, label, desc }) => (
                  <button key={value} type="button" onClick={() => setSweat(value)}
                    className="py-3 px-2 rounded-xl text-sm font-medium border transition-colors text-left"
                    style={{
                      background:  sweat === value ? 'rgba(249,115,22,0.12)' : 'var(--muted)',
                      color:       sweat === value ? '#f97316'               : 'var(--muted-foreground)',
                      borderColor: sweat === value ? 'rgba(249,115,22,0.5)'  : 'var(--border)',
                    }}>
                    <p className="font-semibold text-center mb-1">{label}</p>
                    <p className="text-xs opacity-70 text-center leading-tight">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Opcionales — FC y volumen */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Opcionales — mejoran la precisión del plan
              </p>

              {/* FC máx y FC reposo */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>FC máxima</label>
                  <div className="relative">
                    <input type="number" min="100" max="230" value={maxHr}
                      onChange={(e) => setMaxHr(e.target.value)} placeholder="180"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-12" style={inputStyle} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>bpm</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Mejor estimación: test de 1km al máximo</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>FC en reposo</label>
                  <div className="relative">
                    <input type="number" min="30" max="100" value={restingHr}
                      onChange={(e) => setRestingHr(e.target.value)} placeholder="55"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-12" style={inputStyle} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>bpm</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Medila al despertar antes de levantarte</p>
                </div>
              </div>

              {/* Km/semana */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Km / semana</label>
                <div className="relative">
                  <input type="number" step="0.1" min="0" max="300" value={weeklyKm}
                    onChange={(e) => setWeeklyKm(e.target.value)} placeholder="50"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-10" style={inputStyle} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>km</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Volumen semanal promedio en las últimas 8 semanas</p>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {loading ? 'Guardando...' : 'Continuar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
