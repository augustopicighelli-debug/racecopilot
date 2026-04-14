'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [weightKg, setWeightKg]   = useState('');
  const [heightCm, setHeightCm]   = useState('');
  const [sweat, setSweat]         = useState<'low'|'medium'|'high'>('medium');
  const [maxHr, setMaxHr]         = useState('');
  const [weeklyKm, setWeeklyKm]   = useState('');

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
        user_id: session.user.id,
        weight_kg: parseFloat(weightKg),
        height_cm: parseFloat(heightCm),
        sweat_level: sweat,
        max_hr: maxHr ? parseInt(maxHr) : null,
        weekly_km: weeklyKm ? parseFloat(weeklyKm) : null,
      });
      if (err) throw err;

      // Enviar email de bienvenida — usamos el JWT del access token para autenticar la llamada
      // Si falla, lo ignoramos silenciosamente para no bloquear el onboarding
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch {
        // silencioso: el email de bienvenida no es crítico
      }

      // Nuevo usuario → va a pricing para activar el trial
      router.push('/pricing');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--input)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Configurá tu perfil
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Usamos estos datos para calibrar tu plan de carrera.
          </p>
        </div>

        <div className="rounded-xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Peso (kg)</label>
                <input type="number" step="0.1" min="30" max="200" value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)} placeholder="70"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Altura (cm)</label>
                <input type="number" step="0.1" min="120" max="230" value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)} placeholder="170"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Nivel de sudoración</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low','medium','high'] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSweat(s)}
                    className="py-2 rounded-lg text-sm font-medium border transition-colors"
                    style={{
                      background: sweat === s ? 'var(--primary)' : 'var(--muted)',
                      color: sweat === s ? '#fff' : 'var(--muted-foreground)',
                      borderColor: sweat === s ? 'var(--primary)' : 'var(--border)',
                    }}>
                    {s === 'low' ? 'Poco' : s === 'medium' ? 'Moderado' : 'Mucho'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>FC máx <span style={{ color: 'var(--border)' }}>(opcional)</span></label>
                <input type="number" min="100" max="230" value={maxHr}
                  onChange={(e) => setMaxHr(e.target.value)} placeholder="180"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Km/semana <span style={{ color: 'var(--border)' }}>(opcional)</span></label>
                <input type="number" step="0.1" min="0" max="300" value={weeklyKm}
                  onChange={(e) => setWeeklyKm(e.target.value)} placeholder="50"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 mt-2"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {loading ? 'Guardando...' : 'Continuar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
