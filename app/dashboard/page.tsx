'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

interface Runner {
  id: string;
  weight_kg: number;
  height_cm: number;
  sweat_level: string;
}

interface Race {
  id: string;
  name: string;
  distance_km: number;
  race_date: string;
  city: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [runner, setRunner]   = useState<Runner | null>(null);
  const [races, setRaces]     = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Verificar sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      setEmail(session.user.email ?? '');

      // Buscar perfil del runner
      const { data: runnerData } = await supabase
        .from('runners')
        .select('id, weight_kg, height_cm, sweat_level')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // Si no tiene perfil → onboarding
      if (!runnerData) { router.push('/onboarding'); return; }

      setRunner(runnerData);

      // Cargar carreras del runner
      const { data: racesData } = await supabase
        .from('races')
        .select('id, name, distance_km, race_date, city')
        .eq('runner_id', runnerData.id)
        .order('race_date', { ascending: true });

      setRaces(racesData ?? []);
      setLoading(false);
    };

    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Formatea segundos → "H:MM:SS"
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">RaceCopilot</h1>
            <p className="text-gray-500 text-sm">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Perfil del runner */}
        <div className="bg-white rounded-lg shadow p-5 mb-6 flex gap-6 text-sm text-gray-600">
          <span><strong className="text-gray-900">{runner?.weight_kg} kg</strong></span>
          <span><strong className="text-gray-900">{runner?.height_cm} cm</strong></span>
          <span>
            Sudoración:{' '}
            <strong className="text-gray-900">
              {runner?.sweat_level === 'low' ? 'poca' : runner?.sweat_level === 'medium' ? 'moderada' : 'mucha'}
            </strong>
          </span>
        </div>

        {/* Carreras */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Mis carreras</h2>
          <button
            onClick={() => router.push('/races/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Nueva carrera
          </button>
        </div>

        {races.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
            <p className="mb-2 text-lg">Sin carreras todavía</p>
            <p className="text-sm">Agregá tu primera carrera para generar un plan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {races.map((race) => (
              <div
                key={race.id}
                onClick={() => router.push(`/races/${race.id}`)}
                className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{race.name}</p>
                  <p className="text-sm text-gray-500">
                    {race.distance_km} km · {race.city ?? ''} · {formatDate(race.race_date)}
                  </p>
                </div>
                <span className="text-blue-600 text-sm font-medium">Ver plan →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
