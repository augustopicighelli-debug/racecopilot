'use client';

// Página pública del plan compartido — visible sin login
// Accesible vía /p/[token] donde token es el share_token UUID de la carrera
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RacePlanClient } from '@/components/race-plan-client';
import type { TripleObjectivePlan } from '@/lib/engine/types';

interface RaceMeta {
  name: string;
  distanceKm: number;
  raceDate: string;
  city: string | null;
  targetTimeS: number | null;
  elevationGain: number | null;
}

// Formatea segundos → H:MM:SS
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export default function SharedPlanPage() {
  const params = useParams();
  const token  = params?.token as string;

  const [plan,    setPlan]    = useState<TripleObjectivePlan | null>(null);
  const [race,    setRace]    = useState<RaceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/plan/share/${token}`);
        if (!res.ok) {
          const body = await res.json();
          setError(body.error ?? 'Plan no encontrado');
          return;
        }
        const { plan: p, race: r } = await res.json();
        setPlan(p);
        setRace(r);
      } catch {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
      Cargando plan...
    </div>
  );

  if (error || !plan || !race) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <p className="text-lg font-semibold">Plan no encontrado</p>
      <p className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
        {error || 'El link puede haber expirado o ser incorrecto.'}
      </p>
      <a href="/" className="text-sm" style={{ color: 'var(--primary)' }}>
        Ir a Race Copilot →
      </a>
    </div>
  );

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header de la carrera */}
        <div className="mb-6">
          {/* Badge "plan compartido" */}
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 no-print"
            style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
          >
            Plan compartido · Race Copilot
          </span>

          <h1 className="text-2xl font-bold">{race.name}</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: 'var(--muted-foreground)' }}>
            {fmtDate(race.raceDate)}
            {race.city ? ` · ${race.city}` : ''}
          </p>
          {race.targetTimeS && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Objetivo: {fmtTime(race.targetTimeS)} · {race.distanceKm} km
            </p>
          )}
        </div>

        {/* Botón de exportar PDF — oculto en impresión */}
        <div className="mb-4 no-print">
          <button
            onClick={() => window.print()}
            className="text-xs px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            Exportar PDF
          </button>
        </div>

        {/* Plan completo */}
        <RacePlanClient
          plan={plan}
          mapPoints={[]}
          distanceKm={race.distanceKm}
        />

        {/* CTA de conversión — oculto en impresión */}
        <div
          className="mt-10 rounded-2xl p-8 text-center no-print"
          style={{ background: 'var(--card)', border: '1px solid rgba(249,115,22,0.3)' }}
        >
          <div className="text-3xl mb-3">🏃</div>
          <h2 className="text-lg font-bold mb-2">Generá tu propio plan de carrera</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Race Copilot predice tu ritmo ideal, hidratación y nutrición km a km usando tus tiempos reales y el clima del día de la carrera.
          </p>
          <a
            href="/signup"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            Empezar gratis — 7 días de prueba
          </a>
        </div>

      </div>
    </div>
  );
}
