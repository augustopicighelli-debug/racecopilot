'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

// Convierte segundos → "H:MM:SS" para mostrar en el input
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// Convierte "H:MM:SS" o "M:SS" → segundos totales
function parseTime(t: string): number | null {
  const parts = t.trim().split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export default function EditRacePage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Campos del form
  const [name, setName]             = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [raceDate, setRaceDate]     = useState('');
  const [city, setCity]             = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [elevGain, setElevGain]     = useState('');

  // Cargar datos actuales de la carrera
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data, error: err } = await supabase
        .from('races')
        .select('name,distance_km,race_date,city,target_time_s,elevation_gain')
        .eq('id', id)
        .maybeSingle();

      if (err || !data) { setError('Carrera no encontrada'); setLoading(false); return; }

      // Poblar el form con los valores actuales
      setName(data.name);
      setDistanceKm(String(data.distance_km));
      setRaceDate(data.race_date);
      setCity(data.city ?? '');
      setTargetTime(data.target_time_s ? fmtTime(data.target_time_s) : '');
      setElevGain(data.elevation_gain ? String(data.elevation_gain) : '');
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let targetTimeSec: number | null = null;
      if (targetTime.trim()) {
        targetTimeSec = parseTime(targetTime);
        if (!targetTimeSec) throw new Error('Tiempo inválido. Usá H:MM:SS');
      }

      const { error: err } = await supabase.from('races').update({
        name:           name.trim(),
        distance_km:    parseFloat(distanceKm),
        race_date:      raceDate,
        city:           city.trim() || null,
        target_time_s:  targetTimeSec,
        elevation_gain: elevGain ? parseFloat(elevGain) : null,
      }).eq('id', id);

      if (err) throw err;
      // Pasar ?updated=1 para que la página de carrera regenere el plan
      router.push(`/races/${id}?updated=1`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const inputStyle = { background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' };
  const labelStyle = { color: 'var(--muted-foreground)' };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
      Cargando...
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-md mx-auto">

        <button onClick={() => router.push(`/races/${id}`)} className="text-sm mb-6 block" style={{ color: 'var(--muted-foreground)' }}>
          ← Volver
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Editar carrera</h1>
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
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Distancia (km)</label>
                <input type="number" step="0.001" min="1" value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
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
                Ciudad <span style={{ color: 'var(--border)' }}>(opcional — para clima)</span>
              </label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Mendoza"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  Tiempo objetivo <span style={{ color: 'var(--border)' }}>(opcional)</span>
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

            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
