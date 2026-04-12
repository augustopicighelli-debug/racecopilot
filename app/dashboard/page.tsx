'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    const fetchRaces = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase.from('races').select('*').eq('runner_id', session.user.id);
      setRaces(data || []);
      setLoading(false);
    };
    if (session?.user?.id) fetchRaces();
  }, [session?.user?.id]);

  if (status === 'loading' || loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis Carreras</h1>
            <p className="text-gray-600 mt-1">Hola, {session?.user?.name || session?.user?.email}</p>
          </div>
          <button onClick={() => router.push('/race/new')} className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            + Nueva carrera
          </button>
        </div>

        {races.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No tienes carreras aún</p>
            <button onClick={() => router.push('/race/new')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Crear tu primera carrera
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {races.map((race: any) => (
              <div key={race.id} onClick={() => router.push(`/race/${race.id}`)} className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{race.name}</h2>
                    <p className="text-gray-600 mt-1">{race.city} • {race.distance_km}km</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
