'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { RacePlanClient } from '@/components/race-plan-client';
import { RaceResult } from '@/components/race-result';
import { WarmupPlan } from '@/components/warmup-plan';
import type { TripleObjectivePlan, GpxPoint } from '@/lib/engine/types';
import { parseGpx } from '@/lib/gpx/parser';
import { useUnits } from '@/lib/units';
import { UnitsToggle } from '@/components/units-toggle';
import { useLang } from '@/lib/lang';
import { TrendingDown, ArrowRight, TrendingUp } from 'lucide-react';

interface Race {
  id: string;
  name: string;
  distance_km: number;
  race_date: string;
  city: string | null;
  target_time_s: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  actual_time_s: number | null;
  goal_type: 'finish' | 'pr' | 'target' | null;
  gpx_slug: string | null;
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
  const { fmtDist, fmtPace, fmtTemp, fmtElev } = useUnits();
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

  // Campos del form de referencia — modo carrera
  const [refDist, setRefDist] = useState('');
  const [refTimeHH, setRefTimeHH] = useState('');   // horas
  const [refTimeMM, setRefTimeMM] = useState('');   // minutos
  const [refTimeSS, setRefTimeSS] = useState('');   // segundos
  const [refDate, setRefDate] = useState('');
  const [refType, setRefType] = useState<'race' | 'training'>('race');
  const [refHR, setRefHR]     = useState('');       // FC promedio (opcional)
  // Campos extra modo "pasadas"
  const [refRepCount,  setRefRepCount]  = useState('');  // cantidad de repeticiones
  const [refRepDist,   setRefRepDist]   = useState('');  // distancia por rep (metros)
  const [refPaceMm,    setRefPaceMm]    = useState('');  // ritmo prom: minutos
  const [refPaceSs,    setRefPaceSs]    = useState('');  // ritmo prom: segundos

  // --- estado del plan ---
  const [plan, setPlan]               = useState<TripleObjectivePlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError]     = useState('');
  const [notPremium, setNotPremium]   = useState(false); // true cuando la API devuelve 403

  // --- resultado real de la carrera ---
  const [actualTimeS, setActualTimeS] = useState<number | null>(null);

  // --- puntos GPX para el mapa (lat/lon/elev) ---
  const [mapPoints, setMapPoints] = useState<GpxPoint[]>([]);

  // --- estado del link compartido ---
  const [shareUrl,      setShareUrl]      = useState<string | null>(null);
  const [shareLoading,  setShareLoading]  = useState(false);
  const [shareCopied,   setShareCopied]   = useState(false);

  // --- banner "plan actualizado" tras guardar edición ---
  const [planUpdated, setPlanUpdated] = useState(false);

  // --- split strategy (se puede cambiar inline sin ir a editar) ---
  const [splitType, setSplitType] = useState<'negative' | 'even' | 'positive'>('negative');
  // Estado de colapso de la sección de carreras de referencia
  const [refCollapsed, setRefCollapsed] = useState(true);

  // Cuando llega un plan nuevo y el usuario venía de editar, mostrar banner 3s
  useEffect(() => {
    if (justEdited && plan) {
      setPlanUpdated(true);
      const timer = setTimeout(() => setPlanUpdated(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justEdited, plan]);

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

  // Cambia la estrategia de split → guarda en DB y regenera el plan
  const handleSplitChange = useCallback(async (val: 'negative' | 'even' | 'positive') => {
    setSplitType(val);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('races').update({ split_type: val }).eq('id', id);
    fetchPlan();
  }, [id, fetchPlan]);

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
        .select('id,name,distance_km,race_date,city,target_time_s,elevation_gain,elevation_loss,actual_time_s,goal_type,split_type,gpx_slug')
        .eq('id', id)
        .maybeSingle();

      if (err || !data) { setError('Carrera no encontrada'); setLoading(false); return; }
      setRace(data);
      setActualTimeS(data.actual_time_s ?? null);
      setSplitType((data.split_type as 'negative' | 'even' | 'positive') ?? 'negative');

      // Si la carrera tiene GPX del catálogo, cargar los puntos para el mapa
      if (data.gpx_slug) {
        try {
          const gpxRes = await fetch(`/gpx/${data.gpx_slug}.gpx`);
          if (gpxRes.ok) {
            const xml = await gpxRes.text();
            setMapPoints(parseGpx(xml));
          }
        } catch {
          // Mapa opcional: si falla, simplemente no se muestra
        }
      }

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

    const hr = refHR ? parseInt(refHR) : null;
    if (!refDate) { setRefError('Fecha requerida'); return; }

    let distKm: number;
    let timeSecs: number;

    if (refType === 'training') {
      // Modo pasadas: calcular distancia total y tiempo total desde ritmo prom
      const count   = parseInt(refRepCount);
      const repDist = parseFloat(refRepDist) / 1000; // metros → km
      const pm      = parseInt(refPaceMm) || 0;
      const ps      = parseInt(refPaceSs) || 0;
      const paceSecPerKm = pm * 60 + ps; // segundos por km

      if (!count || count <= 0)        { setRefError('Cantidad inválida'); return; }
      if (!repDist || repDist <= 0)    { setRefError('Distancia por rep inválida'); return; }
      if (paceSecPerKm <= 0)           { setRefError('Ritmo inválido'); return; }

      distKm   = count * repDist;               // distancia total en km
      timeSecs = distKm * paceSecPerKm;         // tiempo total = dist × ritmo
    } else {
      // Modo carrera: leer HH/MM/SS manualmente
      distKm = parseFloat(refDist);
      const hh = parseInt(refTimeHH) || 0;
      const mm = parseInt(refTimeMM) || 0;
      const ss = parseInt(refTimeSS) || 0;
      timeSecs = hh * 3600 + mm * 60 + ss;

      if (!distKm || distKm <= 0)    { setRefError('Distancia inválida'); return; }
      if (timeSecs <= 0)             { setRefError('Tiempo inválido'); return; }
    }

    setRefSaving(true);
    const { error: err } = await supabase.from('reference_races').insert({
      runner_id:      runnerId,
      distance_km:    distKm,
      time_seconds:   timeSecs,
      race_date:      refDate,
      race_type:      refType,
      avg_heart_rate: hr,
    });
    setRefSaving(false);

    if (err) { setRefError(err.message); return; }

    // Limpiar todos los campos del form y regenerar plan
    setRefDist('');
    setRefTimeHH(''); setRefTimeMM(''); setRefTimeSS('');
    setRefRepCount(''); setRefRepDist(''); setRefPaceMm(''); setRefPaceSs('');
    setRefDate(''); setRefType('race'); setRefHR('');
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
            {/* Badge de objetivo — muestra la estrategia seleccionada */}
            {race?.goal_type && (
              <span
                className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}
              >
                {race.goal_type === 'finish' ? t.goal.badgeFinish : race.goal_type === 'pr' ? t.goal.badgePr : t.goal.badgeTarget}
              </span>
            )}
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
        {(!!race?.elevation_gain || !!race?.elevation_loss) && (
          <div className="rounded-xl border p-4 mb-6 flex items-center gap-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <span className="text-lg">⛰</span>
            {!!race?.elevation_gain && (
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>↑ Ascenso</p>
                <p className="font-semibold text-sm">{fmtElev(race.elevation_gain)}</p>
              </div>
            )}
            {!!race?.elevation_loss && (
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>↓ Descenso</p>
                <p className="font-semibold text-sm">{fmtElev(race.elevation_loss)}</p>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Sección: Mis tiempos de referencia — oculta en impresión           */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border mb-6 no-print" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {/* Header — clickeable para colapsar */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => setRefCollapsed(c => !c)}
              className="flex items-center gap-2 text-left flex-1"
            >
              <span
                className="text-xs"
                style={{ color: 'var(--muted-foreground)', display: 'inline-block', transform: refCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >▾</span>
              <div>
                <p className="font-semibold text-sm">{t.race.refTitle}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {t.race.refSubtitle}
                </p>
              </div>
            </button>
            {!refCollapsed && (
              <button
                type="button"
                onClick={() => { setShowRefForm(v => !v); setRefError(''); }}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {showRefForm ? t.common.cancel : t.race.refAdd}
              </button>
            )}
          </div>

          {/* Contenido colapsable */}
          {!refCollapsed && <>

          {/* Form de nuevo tiempo */}
          {showRefForm && (
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>

              {/* Fila 1: Tipo + Fecha */}
              <div className="grid grid-cols-2 gap-3 mb-3">
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
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refDateLabel}</label>
                  <input
                    type="date"
                    value={refDate} onChange={e => setRefDate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              {refType === 'race' ? (
                /* ── Modo carrera: distancia + tiempo HH MM SS ── */
                <div className="space-y-3 mb-3">
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
                  {/* Tiempo dividido en HH / MM / SS */}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refTimeLabel}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'hh', val: refTimeHH, set: setRefTimeHH, max: 23, ph: '3' },
                        { label: 'mm', val: refTimeMM, set: setRefTimeMM, max: 59, ph: '45' },
                        { label: 'ss', val: refTimeSS, set: setRefTimeSS, max: 59, ph: '00' },
                      ].map(({ label, val, set, max, ph }) => (
                        <div key={label}>
                          <p className="text-xs text-center mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                          <input
                            type="number" min="0" max={max}
                            value={val} onChange={e => set(e.target.value)}
                            placeholder={ph}
                            className="w-full rounded-lg border px-2 py-2 text-sm text-center"
                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Modo pasadas: cantidad + dist/rep + ritmo MM:SS ── */
                <div className="space-y-3 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refRepCount}</label>
                      <input
                        type="number" min="1" step="1"
                        value={refRepCount} onChange={e => setRefRepCount(e.target.value)}
                        placeholder="8"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refRepDist}</label>
                      <input
                        type="number" min="1" step="1"
                        value={refRepDist} onChange={e => setRefRepDist(e.target.value)}
                        placeholder="400"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>
                  {/* Ritmo promedio: MM : SS */}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refAvgPace}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: t.race.refPaceMm, val: refPaceMm, set: setRefPaceMm, max: 20, ph: '4' },
                        { label: t.race.refPaceSs, val: refPaceSs, set: setRefPaceSs, max: 59, ph: '30' },
                      ].map(({ label, val, set, max, ph }) => (
                        <div key={label}>
                          <p className="text-xs text-center mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                          <input
                            type="number" min="0" max={max}
                            value={val} onChange={e => set(e.target.value)}
                            placeholder={ph}
                            className="w-full rounded-lg border px-2 py-2 text-sm text-center"
                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FC promedio — siempre opcional */}
              <div className="mb-3">
                <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refHrLabel} — {t.common.optional}</label>
                <input
                  type="number" min="60" max="220"
                  value={refHR} onChange={e => setRefHR(e.target.value)}
                  placeholder="158"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
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
                        ({fmtPace(r.time_seconds / r.distance_km)})
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
          </>}
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

        {/* Banner: plan regenerado tras editar la carrera */}
        {planUpdated && (
          <div
            className="mb-4 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 no-print"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}
          >
            ✓ {t.race.planRefreshed}
          </div>
        )}

        {/* Selector de estrategia de split — visible cuando hay plan */}
        {plan && !planLoading && (
          <div className="grid grid-cols-3 gap-3 mb-4 no-print">
            {([
              { val: 'negative' as const, label: 'Negativo', Icon: TrendingDown, desc: 'Arrancá conservador, acelerá al final' },
              { val: 'even'     as const, label: 'Neutro',   Icon: ArrowRight,   desc: 'Ritmo parejo de principio a fin' },
              { val: 'positive' as const, label: 'Positivo', Icon: TrendingUp,   desc: 'Arrancá fuerte, administrá al final' },
            ]).map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => handleSplitChange(opt.val)}
                className={`rounded-xl border p-3 text-left transition-all ${splitType === opt.val ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]' : 'opacity-60 hover:opacity-90'}`}
                style={{ background: 'var(--card)', borderColor: splitType === opt.val ? 'var(--primary)' : 'var(--border)' }}
              >
                <div className="mb-1"><opt.Icon size={16} style={{ color: splitType === opt.val ? 'var(--primary)' : 'var(--muted-foreground)' }} /></div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{opt.label}</p>
                <p className="text-xs mt-1 leading-tight" style={{ color: 'var(--foreground)' }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Plan listo → mostrar componentes del plan */}
        {plan && !planLoading && (
          <RacePlanClient
            plan={plan}
            mapPoints={mapPoints}
            distanceKm={race?.distance_km ?? 0}
          />
        )}

        {/* Plan de calentamiento — visible solo si la carrera es futura y hay plan */}
        {plan && !planLoading && race && new Date(race.race_date + 'T23:59:59') >= new Date() && (
          <WarmupPlan
            distanceKm={race.distance_km}
            weather={plan.forecast.weather}
          />
        )}

        {/* Comparador post-carrera — visible solo si la carrera ya pasó y hay plan */}
        {plan && !planLoading && race && new Date(race.race_date + 'T23:59:59') < new Date() && (
          <div className="mt-4 no-print">
            <RaceResult
              raceId={id}
              planTimeS={plan.forecast.prediction.timeSeconds}
              planPaceS={plan.forecast.prediction.paceSecondsPerKm}
              distanceKm={race.distance_km}
              actualTimeS={actualTimeS}
              onSave={setActualTimeS}
            />
          </div>
        )}

        {/* Disclaimer médico — visible cuando hay plan generado, incluso en PDF */}
        {plan && !planLoading && (
          <p className="mt-6 text-xs text-center leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            ⚕ {t.race.medicalDisclaimer}
          </p>
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
