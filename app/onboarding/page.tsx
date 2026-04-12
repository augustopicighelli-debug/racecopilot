'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

// Onboarding: se muestra la primera vez que el usuario inicia sesión.
// Guarda el perfil básico en la tabla `runners`.
export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Campos del perfil
  const [weightKg, setWeightKg]     = useState('');
  const [heightCm, setHeightCm]     = useState('');
  const [sweatLevel, setSweatLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [maxHr, setMaxHr]           = useState('');
  const [weeklyKm, setWeeklyKm]     = useState('');

  // Si ya tiene perfil, ir directo al dashboard
  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data } = await supabase
        .from('runners')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (data) router.push('/dashboard');
    };
    checkProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      // Insertar perfil del runner
      const { error: insertError } = await supabase.from('runners').insert({
        user_id:     session.user.id,
        weight_kg:   parseFloat(weightKg),
        height_cm:   parseFloat(heightCm),
        sweat_level: sweatLevel,
        max_hr:      maxHr ? parseInt(maxHr) : null,
        weekly_km:   weeklyKm ? parseFloat(weeklyKm) : null,
      });

      if (insertError) throw insertError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-1">Configura tu perfil</h1>
          <p className="text-gray-500 text-sm mb-6">
            Lo usaremos para calibrar tu plan de carrera.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Peso y altura en la misma fila */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="70"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="120"
                  max="230"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="170"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Nivel de sudoración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de sudoración
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSweatLevel(level)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      sweatLevel === level
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {level === 'low' ? 'Poco' : level === 'medium' ? 'Moderado' : 'Mucho'}
                  </button>
                ))}
              </div>
            </div>

            {/* FC Máx y km semanales — opcionales */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FC máxima <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="100"
                  max="230"
                  value={maxHr}
                  onChange={(e) => setMaxHr(e.target.value)}
                  placeholder="180"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Km/semana <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={weeklyKm}
                  onChange={(e) => setWeeklyKm(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mt-2"
            >
              {loading ? 'Guardando...' : 'Continuar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
