'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { RacePlanClient } from '@/components/race-plan-client';
import type { TripleObjectivePlan } from '@/lib/engine/types';
import { useUnits } from '@/lib/units';
import { UnitsToggle } from '@/components/units-toggle';
import { useLang } from '@/lib/lang';

interface Race {
  id: string;
  name: string;
  distance_km: number;
  race_date: string;
  city: string | null;
  target_time_s: number | null;
  elevation_gain: number | null;
}

interface ReferenceRace {
  id: string;
  distance_km: number;
  time_seconds: number;
  race_date: string;
  race_type: 'race' | 'training';
  avg_heart_rate: number | null;
}

// Formatea segundos → H:MM:SS
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// Formatea segundos/km → M:SS /km (usado internamente para tiempos de referencia)
function fmtPaceRaw(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2,'0')} /km`;
}

// Convierte string "H:MM:SS" o "M:SS" a segundos totales
function parseTimeInput(val: string): number | null {
  const parts = val.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function RacePage() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const id           = params?.id as string;
  const justEdited   = searchParams?.get('updated') === '1';
  const { fmtDist, fmtPace, fmtTemp } = useUnits();
  const { t } = useLang();

  // --- estado de la carrera principal ---
  const [race, setRace]       = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // --- estado de carreras de referencia ---
  const [runnerId, setRunnerId]       = useState<string | null>(null);
  const [refRaces, setRefRaces]       = useState<ReferenceRace[]>([]);
  const [showRefForm, setShowRefForm] = useState(false);
  const [refSaving, setRefSaving]     = useState(false);
  const [refError, setRefError]       = useState('');

  // Campos del form de referencia
  const [refDist, setRefDist] = useState('');
  const [refTime, setRefTime] = useState(''); // formato H:MM:SS
  const [refDate, setRefDate] = useState('');
  const [refType, setRefType] = useState<'race' | 'training'>('race');
  const [refHR, setRefHR]     = useState(''); // FC promedio (opcional)

  // --- estado del plan ---
  const [plan, setPlan]               = useState<TripleObjectivePlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError]     = useState('');
  const [notPremium, setNotPremium]   = useState(false); // true cuando la API devuelve 403

  // --- estado del link compartido ---
  const [shareUrl,      setShareUrl]      = useState<string | null>(null);
  const [shareLoading,  setShareLoading]  = useState(false);
  const [shareCopied,   setShareCopied]   = useState(false);

  // Carga el plan desde la API
  const fetchPlan = useCallback(async () => {
    setPlanLoading(true);
    setPlanError('');
    setPlan(null);
    setNotPremium(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/plan/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      // Paywall: el usuario no tiene suscripción activa
      if (res.status === 403) {
        setNotPremium(true);
        return;
      }

      if (!res.ok) {
        const body = await res.json();
        setPlanError(body.error ?? 'Error generando plan');
        return;
      }

      const data = await res.json();
      setPlan(data);
    } catch {
      setPlanError('Error de conexión');
    } finally {
      setPlanLoading(false);
    }
  }, [id]);

  // Carga (o recarga) las carreras de referencia del runner
  const loadRefRaces = useCallback(async (rid: string) => {
    const { data } = await supabase
      .from('reference_races')
      .select('id,distance_km,time_seconds,race_date,race_type,avg_heart_rate')
      .eq('runner_id', rid)
      .order('race_date', { ascending: false });
    setRefRaces(data ?? []);
    return data ?? [];
  }, []);

  // Carga la carrera principal + runner_id + reference_races + plan inicial
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      // Cargar carrera
      const { data, error: err } = await supabase
        .from('races')
        .select('id,name,distance_km,race_date,city,target_time_s,elevation_gain')
        .eq('id', id)
        .maybeSingle();

      if (err || !data) { setError('Carrera no encontrada'); setLoading(false); return; }
      setRace(data);

      // Cargar runner
      const { data: runner } = await supabase
        .from('runners')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (runner) {
        setRunnerId(runner.id);
        const loaded = await loadRefRaces(runner.id);
        // Generar plan si hay tiempos de referencia, o forzar si viene de editar
        if (loaded.length > 0) fetchPlan();
      }

      // Limpiar el param ?updated=1 de la URL sin recargar la página
      if (justEdited) {
        window.history.replaceState(null, '', `/races/${id}`);
      }

      setLoading(false);
    };
    init();
  }, [id, router, loadRefRaces, fetchPlan]);

  // Guarda una nueva carrera de referencia
  const handleAddRefRace = async () => {
    if (!runnerId) return;
    setRefError('');

    const dist = parseFloat(refDist);
    const secs = parseTimeInput(refTime);
    const hr   = refHR ? parseInt(refHR) : null;

    if (!dist || dist <= 0)   { setRefError('Distancia inválida'); return; }
    if (!secs || secs <= 0)   { setRefError('Tiempo inválido — usá H:MM:SS o M:SS'); return; }
    if (!refDate)             { setRefError('Fecha requerida'); return; }

    setRefSaving(true);
    const { error: err } = await supabase.from('reference_races').insert({
      runner_id:      runnerId,
      distance_km:    dist,
      time_seconds:   secs,
      race_date:      refDate,
      race_type:      refType,
      avg_heart_rate: hr,
    });
    setRefSaving(false);

    if (err) { setRefError(err.message); return; }

    // Limpiar form, recargar lista y regenerar plan
    setRefDist(''); setRefTime(''); setRefDate(''); setRefType('race'); setRefHR('');
    setShowRefForm(false);
    await loadRefRaces(runnerId);
    fetchPlan();
  };

  // Borra una carrera de referencia y regenera el plan
  const handleDeleteRefRace = async (refId: string) => {
    if (!runnerId) return;
    await supabase.from('reference_races').delete().eq('id', refId);
    const remaining = await loadRefRaces(runnerId);
    if (remaining.length > 0) fetchPlan();
    else { setPlan(null); setPlanError(''); }
  };

  // Genera (o reutiliza) el link compartido y lo copia al portapapeles
  const handleShare = async () => {
    if (shareLoading) return;

    // Si ya tenemos la URL, solo copiar
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      return;
    }

    setShareLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/races/${id}/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;

      const { url } = await res.json();
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } finally {
      setShareLoading(false);
    }
  };

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d + 'T12:00:00').getTime() - Date.now()) / 86400000);
    if (diff > 0)  return t.race.daysUntil(diff);
    if (diff === 0) return t.race.today;
    return t.race.daysAgo(Math.abs(diff));
  };

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString(t.race.dateLocale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const estimatedPace = race?.target_time_s
    ? race.target_time_s / race.distance_km
    : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
      {t.common.loading}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <p style={{ color: 'var(--muted-foreground)' }}>{error}</p>
      <button onClick={() => router.push('/dashboard')} className="text-sm" style={{ color: 'var(--primary)' }}>
        {t.common.backDash}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header: volver + acciones — todo oculto en impresión */}
        <div className="flex items-center justify-between mb-6 no-print">
          <button onClick={() => router.push('/dashboard')} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t.common.backDash}
          </button>
          <div className="flex items-center gap-2">
            <UnitsToggle />
            {/* Botón compartir plan (solo visible si ya hay plan generado) */}
            {plan && !planLoading && (
              <button
                onClick={handleShare}
                disabled={shareLoading}
                className="text-xs px-3 py-1.5 rounded-lg border font-semibold disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: shareCopied ? '#22c55e' : 'var(--foreground)' }}
              >
                {shareLoading ? t.race.shareGenerating : shareCopied ? t.race.shareCopied : t.race.shareBtn}
              </button>
            )}
            {/* Botón exportar PDF (solo visible si hay plan) */}
            {plan && !planLoading && (
              <button
                onClick={() => window.print()}
                className="text-xs px-3 py-1.5 rounded-lg border"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                {t.race.exportPdf}
              </button>
            )}
            <button
              onClick={async () => {
                // Pedir confirmación antes de borrar
                if (!confirm(t.race.deleteConfirm(race?.name ?? ''))) return;
                await supabase.from('races').delete().eq('id', id);
                router.push('/dashboard');
              }}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {t.race.deleteRace}
            </button>
          </div>
        </div>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{race?.name}</h1>
            <p className="text-sm mt-1 capitalize" style={{ color: 'var(--muted-foreground)' }}>
              {race ? fmtDate(race.race_date) : ''}{race?.city ? ` · ${race.city}` : ''}
            </p>
          </div>
          <button
            onClick={() => router.push(`/races/${id}/edit`)}
            className="text-xs px-3 py-1.5 rounded-lg border shrink-0 no-print"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            {t.common.edit}
          </button>
        </div>

        {/* Stats de la carrera */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t.race.distance,   value: race ? fmtDist(race.distance_km) : '—' },
            { label: t.race.countdown,  value: race ? daysUntil(race.race_date) : '' },
            { label: t.race.targetTime, value: race?.target_time_s ? fmtTime(race.target_time_s) : '—' },
            { label: t.race.targetPace, value: estimatedPace ? fmtPace(estimatedPace) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              <p className="font-semibold text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Desnivel */}
        {race?.elevation_gain && (
          <div className="rounded-xl border p-4 mb-6 flex items-center gap-3" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <span className="text-lg">⛰</span>
            <div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.race.elevation}</p>
              <p className="font-semibold text-sm">{race.elevation_gain} m</p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Sección: Mis tiempos de referencia — oculta en impresión           */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border mb-6 no-print" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="font-semibold text-sm">{t.race.refTitle}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {t.race.refSubtitle}
              </p>
            </div>
            <button
              onClick={() => { setShowRefForm(v => !v); setRefError(''); }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {showRefForm ? t.common.cancel : t.race.refAdd}
            </button>
          </div>

          {/* Form de nuevo tiempo */}
          {showRefForm && (
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-2 gap-3 mb-3">

                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refDistLabel}</label>
                  <input
                    type="number" min="0.1" step="0.001"
                    value={refDist} onChange={e => setRefDist(e.target.value)}
                    placeholder="42.195"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refTimeLabel}</label>
                  <input
                    type="text"
                    value={refTime} onChange={e => setRefTime(e.target.value)}
                    placeholder="3:45:00"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refDateLabel}</label>
                  <input
                    type="date"
                    value={refDate} onChange={e => setRefDate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refTypeLabel}</label>
                  <select
                    value={refType} onChange={e => setRefType(e.target.value as 'race' | 'training')}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <option value="race">{t.race.refTypeRace}</option>
                    <option value="training">{t.race.refTypeTrain}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refHrLabel} — {t.common.optional}</label>
                  <input
                    type="number" min="60" max="220"
                    value={refHR} onChange={e => setRefHR(e.target.value)}
                    placeholder="158"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

              </div>

              {refError && (
                <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{refError}</p>
              )}
              <button
                onClick={handleAddRefRace}
                disabled={refSaving}
                className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {refSaving ? t.common.saving : t.race.refSave}
              </button>
            </div>
          )}

          {/* Lista de tiempos */}
          {refRaces.length === 0 ? (
            <p className="px-5 py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t.race.refEmpty}
            </p>
          ) : (
            <ul>
              {refRaces.map((r, i) => (
                <li
                  key={r.id}
                  className={`flex items-center justify-between px-5 py-3 ${i < refRaces.length - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {fmtDist(r.distance_km)} &mdash; {fmtTime(r.time_seconds)}
                      <span className="ml-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        ({fmtPaceRaw(r.time_seconds / r.distance_km)})
                      </span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {new Date(r.race_date + 'T12:00:00').toLocaleDateString(t.race.dateLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}{r.race_type === 'race' ? t.race.refTypeRace : t.race.refTypeTrain}
                      {r.avg_heart_rate ? ` · ${r.avg_heart_rate} bpm` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRefRace(r.id)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: 'var(--muted-foreground)' }}
                    title={t.common.delete}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Sección: Plan de carrera                                            */}
        {/* ------------------------------------------------------------------ */}

        {/* Aviso: sin ciudad → clima no disponible — oculto en impresión */}
        {!race?.city && refRaces.length > 0 && !notPremium && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-sm flex items-start gap-2 no-print"
            style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', color: '#facc15' }}
          >
            <span>⚠</span>
            <span>
              {t.race.noCityWarning}{' '}
              <button
                onClick={() => router.push(`/races/${id}/edit`)}
                className="underline"
              >
                {t.race.noCityEdit}
              </button>
            </span>
          </div>
        )}

        {/* Paywall: usuario sin suscripción activa — oculto en impresión */}
        {notPremium && (
          <div className="rounded-xl border p-8 text-center no-print" style={{ background: 'var(--card)', borderColor: 'rgba(249,115,22,0.4)' }}>
            <div className="text-3xl mb-3">🔒</div>
            <p className="font-semibold mb-2">{t.race.paywallTitle}</p>
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              {t.race.paywallDesc}
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {t.race.paywallCta}
            </button>
          </div>
        )}

        {/* Sin tiempos de referencia → placeholder */}
        {!notPremium && refRaces.length === 0 && (
          <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="text-3xl mb-3">🏃</div>
            <p className="font-semibold mb-2">{t.race.planTitle}</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t.race.noPlanNoRef}
            </p>
          </div>
        )}

        {/* Cargando el plan */}
        {!notPremium && refRaces.length > 0 && planLoading && (
          <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.race.generating}</p>
          </div>
        )}

        {/* Error generando el plan */}
        {!notPremium && refRaces.length > 0 && !planLoading && planError && (
          <div className="rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{planError}</p>
            <button
              onClick={fetchPlan}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {t.common.retry}
            </button>
          </div>
        )}

        {/* Plan listo → mostrar componentes del plan */}
        {plan && !planLoading && (
          <RacePlanClient
            plan={plan}
            mapPoints={[]}
            distanceKm={race?.distance_km ?? 0}
          />
        )}

      </div>
    </div>
  );
}

// Suspense requerido por Next.js 15 al usar useSearchParams en un Client Component
export default function RacePageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
        Cargando...
      </div>
    }>
      <RacePage />
    </Suspense>
  );
}
