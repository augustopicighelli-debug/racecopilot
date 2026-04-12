'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

// Página para crear una nueva carrera.
// Guarda en la tabla `races` y redirige al dashboard.
export default function NewRacePage() {
  const router = useRouter();
  const [runnerId, setRunnerId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Campos del formulario
  const [name, setName]               = useState('');
  const [distanceKm, setDistanceKm]   = useState('');
  const [raceDate, setRaceDate]       = useState('');
  const [city, setCity]               = useState('');
  const [targetTime, setTargetTime]   = useState(''); // formato "H:MM:SS"
  const [elevGain, setElevGain]       = useState('');

  // Obtener runner_id del usuario logueado
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data } = await supabase
        .from('runners')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!data) { router.push('/onboarding'); return; }
      setRunnerId(data.id);
    };
    init();
  }, [router]);

  // Convierte "H:MM:SS" o "MM:SS" a segundos
  const parseTimeToSeconds = (t: string): number | null => {
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
      // Convertir tiempo objetivo si fue ingresado
      let targetTimeSec: number | null = null;
      if (targetTime.trim()) {
        targetTimeSec = parseTimeToSeconds(targetTime);
        if (!targetTimeSec) throw new Error('Formato de tiempo inválido. Usá H:MM:SS o MM:SS');
      }

      const { error: insertError } = await supabase.from('races').insert({
        runner_id:      runnerId,
        name:           name.trim(),
        distance_km:    parseFloat(distanceKm),
        race_date:      raceDate,
        city:           city.trim() || null,
        target_time_s:  targetTimeSec,
        elevation_gain: elevGain ? parseFloat(elevGain) : null,
      });

      if (insertError) throw insertError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al guardar la carrera');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-10">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 block"
        >
          ← Volver
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-1">Nueva carrera</h1>
          <p className="text-gray-500 text-sm mb-6">
            Ingresá los datos para generar tu plan.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre de la carrera */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maratón de Mendoza 2026"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Distancia y fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distancia (km)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="42.195"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de la carrera
                </label>
                <input
                  type="date"
                  value={raceDate}
                  onChange={(e) => setRaceDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mendoza"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tiempo objetivo y desnivel */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo objetivo <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  placeholder="3:45:00"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desnivel + (m) <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={elevGain}
                  onChange={(e) => setElevGain(e.target.value)}
                  placeholder="250"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !runnerId}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mt-2"
            >
              {loading ? 'Guardando...' : 'Crear carrera →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
