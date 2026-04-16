'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useLang } from '@/lib/lang';
import { useUnits } from '@/lib/units';

// Carrera con los campos necesarios para la vista de temporada
interface Race {
  id:           string;
  name:         string;
  distance_km:  number;
  race_date:    string;
  city:         string | null;
  target_time_s: number | null;
  actual_time_s: number | null;
  goal_type:    'finish' | 'pr' | 'target' | null;
}

// Formatea segundos → H:MM:SS
function fmtTime(s: number): string {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function SeasonPage() {
  const router = useRouter();
  const { t }  = useLang();
  const { fmtDist } = useUnits();

  const [races, setRaces]             = useState<Race[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      // Verificar que el runner existe
      const { data: r } = await supabase
        .from('runners').select('id')
        .eq('user_id', session.user.id).maybeSingle();
      if (!r) { router.push('/onboarding'); return; }

      // Traer todas las carreras con campos para mostrar resultados
      const { data: rs } = await supabase
        .from('races')
        .select('id,name,distance_km,race_date,city,target_time_s,actual_time_s,goal_type')
        .eq('runner_id', r.id)
        .order('race_date', { ascending: true });

      const allRaces = rs ?? [];
      setRaces(allRaces);

      // Si el año actual no tiene carreras, mostrar el año más reciente con carreras
      const currentYear = new Date().getFullYear();
      const years = [...new Set(allRaces.map(
        (rc) => new Date(rc.race_date + 'T12:00:00').getFullYear()
      ))];
      if (years.length > 0 && !years.includes(currentYear)) {
        setSelectedYear(Math.max(...years));
      }

      setLoading(false);
    };
    init();
  }, [router]);

  // Años únicos, orden descendente (más reciente primero)
  const years = [...new Set(
    races.map((r) => new Date(r.race_date + 'T12:00:00').getFullYear())
  )].sort((a, b) => b - a);

  // Carreras del año seleccionado
  const yearRaces = races.filter(
    (r) => new Date(r.race_date + 'T12:00:00').getFullYear() === selectedYear
  );

  // Stats del año
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const totalKm   = yearRaces.reduce((sum, r) => sum + r.distance_km, 0);
  const completed = yearRaces.filter((r) => r.actual_time_s != null).length;
  const upcoming  = yearRaces.filter((r) => r.race_date > todayStr).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
      {t.common.loading}
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm mb-2 block"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t.common.backDash}
          </button>
          <h1 className="text-xl font-bold">{t.season.title}</h1>
        </div>

        {/* Selector de año — solo si hay más de un año */}
        {years.length > 1 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={{
                  background:  selectedYear === y ? 'var(--primary)' : 'var(--muted)',
                  color:       selectedYear === y ? '#fff' : 'var(--muted-foreground)',
                  borderColor: selectedYear === y ? 'var(--primary)' : 'var(--border)',
                }}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {/* Stats del año seleccionado */}
        {yearRaces.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: t.season.statRaces,     value: String(yearRaces.length) },
              { label: t.season.statKm,        value: fmtDist(totalKm) },
              { label: t.season.statCompleted, value: String(completed) },
              { label: t.season.statUpcoming,  value: String(upcoming) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border p-3 text-center"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <p className="text-lg font-bold tabular-nums">{value}</p>
                <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Lista de carreras */}
        {yearRaces.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center text-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            {t.season.empty(selectedYear)}
          </div>
        ) : (
          <div className="space-y-3">
            {yearRaces.map((race) => {
              const raceDate   = new Date(race.race_date + 'T12:00:00');
              const isPast     = race.race_date < todayStr;
              const isToday    = race.race_date === todayStr;
              const isUpcoming = race.race_date > todayStr;
              const isCompleted = race.actual_time_s != null;

              // Días hasta la carrera (solo para próximas)
              const diffDays = Math.ceil(
                (raceDate.getTime() - Date.now()) / 86400000
              );

              // Diferencia vs objetivo (solo si hay resultado y objetivo)
              let diffLabel = '';
              let diffColor = 'var(--muted-foreground)';
              if (isCompleted && race.target_time_s) {
                const diff = race.actual_time_s! - race.target_time_s;
                if (diff < 0) {
                  diffLabel = `−${fmtTime(Math.abs(diff))}`;
                  diffColor = '#22c55e'; // verde = más rápido
                } else if (diff > 0) {
                  diffLabel = `+${fmtTime(diff)}`;
                  diffColor = '#ef4444'; // rojo = más lento
                }
              }

              // Label de mes abreviado para el indicador de fecha
              const month = raceDate.toLocaleDateString(t.race.dateLocale, { month: 'short' });
              const day   = raceDate.getDate();

              return (
                <button
                  key={race.id}
                  onClick={() => router.push(`/races/${race.id}`)}
                  className="w-full rounded-xl border p-4 text-left flex items-center gap-4 transition-colors"
                  style={{
                    background:  'var(--card)',
                    borderColor: 'var(--border)',
                    // Carreras pasadas sin resultado se ven más tenues
                    opacity: isPast && !isCompleted && !isToday ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}
                >
                  {/* Indicador de fecha */}
                  <div className="text-center min-w-[36px]">
                    <p className="text-xs uppercase leading-none"
                      style={{ color: 'var(--muted-foreground)' }}>
                      {month}
                    </p>
                    <p className="text-xl font-bold tabular-nums leading-tight mt-0.5">{day}</p>
                  </div>

                  {/* Divisor vertical */}
                  <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

                  {/* Nombre + distancia */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{race.name}</p>
                    <p className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--muted-foreground)' }}>
                      {fmtDist(race.distance_km)}{race.city ? ` · ${race.city}` : ''}
                    </p>
                  </div>

                  {/* Estado / resultado */}
                  <div className="text-right shrink-0">
                    {isCompleted ? (
                      // Carrera completada: mostrar tiempo real y diff vs objetivo
                      <div>
                        <p className="text-sm font-bold tabular-nums">
                          {fmtTime(race.actual_time_s!)}
                        </p>
                        {diffLabel && (
                          <p className="text-xs font-mono mt-0.5" style={{ color: diffColor }}>
                            {diffLabel}
                          </p>
                        )}
                      </div>
                    ) : isToday ? (
                      // Día de la carrera
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-md"
                        style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
                      >
                        {t.race.today}
                      </span>
                    ) : isUpcoming ? (
                      // Próxima: días restantes
                      <span
                        className="text-xs px-2 py-1 rounded-md"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      >
                        {t.race.daysUntil(diffDays)}
                      </span>
                    ) : (
                      // Pasada sin resultado
                      <span
                        className="text-xs px-2 py-1 rounded-md"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      >
                        {t.season.noResult}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
