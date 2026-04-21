'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useLang } from '@/lib/lang';
import { useUnits } from '@/lib/units';

const SWEAT_VALUES = ['low', 'medium', 'high'] as const;

// Formatea segundos → H:MM:SS / MM:SS
function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

interface ReferenceRace {
  id: string;
  distance_km: number;
  time_seconds: number;
  race_date: string;
  race_type: 'race' | 'training';
}

interface NutritionProduct {
  id: string;
  name: string;
  type: 'gel' | 'salt_pill';
  carbs_grams: number;
  sodium_mg: number;
  caffeine_mg: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLang();
  const { units, distUnit, fmtDist, fmtPace } = useUnits();
  const imp = units === 'imperial';

  // Paso actual: 1 = perfil, 2 = tiempos de referencia, 3 = nutrición
  const [step, setStep]         = useState(1);
  const [runnerId, setRunnerId] = useState<string | null>(null);

  // ── Paso 1: datos del corredor ──────────────────────────────────────────
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [weightKg, setWeightKg]   = useState('');
  const [heightCm, setHeightCm]   = useState('');
  const [sweat, setSweat]         = useState<'low'|'medium'|'high'>('medium');
  const [maxHr, setMaxHr]         = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [weeklyKm, setWeeklyKm]   = useState('');

  // ── Paso 2: tiempos de referencia ───────────────────────────────────────
  const [refRaces, setRefRaces]       = useState<ReferenceRace[]>([]);
  const [showRefForm, setShowRefForm] = useState(false);
  const [refSaving, setRefSaving]     = useState(false);
  const [refError, setRefError]       = useState('');
  // campos modo carrera
  const [refDist, setRefDist]         = useState('');
  const [refTimeHH, setRefTimeHH]     = useState('');
  const [refTimeMM, setRefTimeMM]     = useState('');
  const [refTimeSS, setRefTimeSS]     = useState('');
  const [refDate, setRefDate]         = useState('');
  const [refType, setRefType]         = useState<'race' | 'training'>('race');
  const [refHR, setRefHR]             = useState('');
  // campos modo pasadas
  const [refRepCount, setRefRepCount] = useState('');
  const [refRepDist, setRefRepDist]   = useState('');
  const [refPaceMm, setRefPaceMm]     = useState('');
  const [refPaceSs, setRefPaceSs]     = useState('');

  // ── Paso 3: productos de nutrición ─────────────────────────────────────
  const [products, setProducts]           = useState<NutritionProduct[]>([]);
  const [showProdForm, setShowProdForm]   = useState(false);
  const [savingProd, setSavingProd]       = useState(false);
  const [prodName, setProdName]           = useState('');
  const [prodType, setProdType]           = useState<'gel' | 'salt_pill'>('gel');
  const [prodCarbs, setProdCarbs]         = useState('');
  const [prodSodium, setProdSodium]       = useState('');
  const [prodCaffeine, setProdCaffeine]   = useState('');

  // Si ya existe el runner, saltar al paso 2 (o al dashboard si es re-visita)
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase.from('runners').select('id').eq('user_id', session.user.id).maybeSingle();
      if (data) router.push('/dashboard');
    };
    check();
  }, [router]);

  // ── Paso 1: guardar perfil y avanzar al paso 2 ──────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t.onboarding.noSession);

      // Convertir a métrico antes de guardar (DB siempre en kg/cm/km)
      const weightVal = imp ? parseFloat(weightKg) / 2.20462 : parseFloat(weightKg);
      const heightVal = imp ? parseFloat(heightCm) * 2.54    : parseFloat(heightCm);
      const weeklyVal = weeklyKm ? (imp ? parseFloat(weeklyKm) * 1.60934 : parseFloat(weeklyKm)) : null;

      // Detectar idioma del browser: 'en' si empieza con 'en', 'es' en cualquier otro caso
      const lang = navigator.language?.startsWith('en') ? 'en' : 'es';

      const { data: newRunner, error: err } = await supabase
        .from('runners')
        .insert({
          user_id:     session.user.id,
          weight_kg:   weightVal,
          height_cm:   heightVal,
          sweat_level: sweat,
          max_hr:      maxHr     ? parseInt(maxHr)     : null,
          resting_hr:  restingHr ? parseInt(restingHr) : null,
          weekly_km:   weeklyVal,
          language:    lang,
        })
        .select('id')
        .single();

      if (err) throw err;

      // Email de bienvenida — no crítico
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch { /* silencioso */ }

      // Avanzar al paso 2 con el runner recién creado
      setRunnerId(newRunner.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: guardar tiempo de referencia ────────────────────────────────
  const handleAddRefRace = useCallback(async () => {
    if (!runnerId) return;
    setRefError('');
    if (!refDate) { setRefError('Fecha requerida'); return; }

    const hr = refHR ? parseInt(refHR) : null;
    let distKm: number;
    let timeSecs: number;

    if (refType === 'training') {
      const count        = parseInt(refRepCount);
      const repDist      = parseFloat(refRepDist) / 1000; // metros → km
      const paceSecPerKm = (parseInt(refPaceMm) || 0) * 60 + (parseInt(refPaceSs) || 0);
      if (!count || count <= 0)     { setRefError('Cantidad inválida'); return; }
      if (!repDist || repDist <= 0) { setRefError('Distancia por rep inválida'); return; }
      if (paceSecPerKm <= 0)        { setRefError('Ritmo inválido'); return; }
      distKm   = count * repDist;
      timeSecs = distKm * paceSecPerKm;
    } else {
      distKm   = parseFloat(refDist);
      timeSecs = (parseInt(refTimeHH) || 0) * 3600 + (parseInt(refTimeMM) || 0) * 60 + (parseInt(refTimeSS) || 0);
      if (!distKm || distKm <= 0) { setRefError('Distancia inválida'); return; }
      if (timeSecs <= 0)          { setRefError('Tiempo inválido'); return; }
    }

    setRefSaving(true);
    const { data, error: err } = await supabase
      .from('reference_races')
      .insert({ runner_id: runnerId, distance_km: distKm, time_seconds: timeSecs, race_date: refDate, race_type: refType, avg_heart_rate: hr })
      .select('id,distance_km,time_seconds,race_date,race_type')
      .single();
    setRefSaving(false);

    if (err) { setRefError(err.message); return; }

    setRefRaces(prev => [data, ...prev]);
    // Limpiar campos
    setRefDist(''); setRefTimeHH(''); setRefTimeMM(''); setRefTimeSS('');
    setRefRepCount(''); setRefRepDist(''); setRefPaceMm(''); setRefPaceSs('');
    setRefDate(''); setRefType('race'); setRefHR('');
    setShowRefForm(false);
  }, [runnerId, refDate, refHR, refType, refDist, refTimeHH, refTimeMM, refTimeSS, refRepCount, refRepDist, refPaceMm, refPaceSs]);

  const handleDeleteRefRace = async (id: string) => {
    await supabase.from('reference_races').delete().eq('id', id);
    setRefRaces(prev => prev.filter(r => r.id !== id));
  };

  const inputStyle = { background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step >= n ? '#f97316' : 'var(--muted)',
                  color:      step >= n ? '#fff'     : 'var(--muted-foreground)',
                }}
              >
                {n}
              </div>
              {n < 3 && <div className="w-8 h-0.5" style={{ background: step > n ? '#f97316' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        {/* Logo + título dinámico por paso */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Race<span style={{ color: '#f97316' }}>Copilot</span>
          </h1>
          {step === 1 ? (
            <>
              <p className="mt-2 text-base font-semibold" style={{ color: 'var(--foreground)' }}>{t.onboarding.title}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.onboarding.subtitle}</p>
            </>
          ) : step === 2 ? (
            <>
              <p className="mt-2 text-base font-semibold" style={{ color: 'var(--foreground)' }}>{t.race.refTitle}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.race.refSubtitle}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-base font-semibold" style={{ color: 'var(--foreground)' }}>{t.profile.sectionNutrition}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.profile.noProducts}</p>
            </>
          )}
        </div>

        {/* ── PASO 1: datos del corredor ─────────────────────────────────── */}
        {step === 1 && (
          <div className="rounded-xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                {t.onboarding.sectionEssential}
              </p>

              {/* Peso y altura */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>{t.onboarding.fieldWeight}</label>
                  <div className="relative">
                    <input type="number" step="0.1" min={imp ? 66 : 30} max={imp ? 440 : 200} value={weightKg}
                      onChange={e => setWeightKg(e.target.value)} placeholder={imp ? '154' : '70'}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-10" style={inputStyle} required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{imp ? 'lb' : 'kg'}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.onboarding.fieldWeightHint}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>{t.onboarding.fieldHeight}</label>
                  <div className="relative">
                    <input type="number" step="0.1" min={imp ? 47 : 120} max={imp ? 91 : 230} value={heightCm}
                      onChange={e => setHeightCm(e.target.value)} placeholder={imp ? '67' : '170'}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-10" style={inputStyle} required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{imp ? 'in' : 'cm'}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.onboarding.fieldHeightHint}</p>
                </div>
              </div>

              {/* Sudoración */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>{t.onboarding.fieldSweat}</label>
                <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>{t.onboarding.fieldSweatHint}</p>
                <div className="grid grid-cols-3 gap-2">
                  {SWEAT_VALUES.map((value) => {
                    const label = value === 'low' ? t.onboarding.sweatLow : value === 'medium' ? t.onboarding.sweatMedium : t.onboarding.sweatHigh;
                    const desc  = value === 'low' ? t.onboarding.sweatLowDesc : value === 'medium' ? t.onboarding.sweatMediumDesc : t.onboarding.sweatHighDesc;
                    return (
                      <button key={value} type="button" onClick={() => setSweat(value)}
                        className="py-3 px-2 rounded-xl text-sm font-medium border transition-colors text-left"
                        style={{
                          background:  sweat === value ? 'rgba(249,115,22,0.12)' : 'var(--muted)',
                          color:       sweat === value ? '#f97316'               : 'var(--muted-foreground)',
                          borderColor: sweat === value ? 'rgba(249,115,22,0.5)'  : 'var(--border)',
                        }}>
                        <p className="font-semibold text-center mb-1">{label}</p>
                        <p className="text-xs opacity-70 text-center leading-tight">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opcionales */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  {t.onboarding.sectionOptional}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>{t.onboarding.fieldMaxHr}</label>
                    <div className="relative">
                      <input type="number" min="100" max="230" value={maxHr}
                        onChange={e => setMaxHr(e.target.value)} placeholder="180"
                        className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-12" style={inputStyle} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>bpm</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.onboarding.fieldMaxHrHint}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>{t.onboarding.fieldRestingHr}</label>
                    <div className="relative">
                      <input type="number" min="30" max="100" value={restingHr}
                        onChange={e => setRestingHr(e.target.value)} placeholder="55"
                        className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-12" style={inputStyle} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>bpm</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.onboarding.fieldRestingHrHint}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>{t.onboarding.fieldWeeklyKm}</label>
                  <div className="relative">
                    <input type="number" step="0.1" min="0" max={imp ? 186 : 300} value={weeklyKm}
                      onChange={e => setWeeklyKm(e.target.value)} placeholder={imp ? '31' : '50'}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-10" style={inputStyle} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{distUnit}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.onboarding.fieldWeeklyKmHint}</p>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: 'var(--primary)', color: '#fff' }}>
                {loading ? t.common.saving : t.onboarding.submit}
              </button>
            </form>
          </div>
        )}

        {/* ── PASO 2: tiempos de referencia ─────────────────────────────── */}
        {step === 2 && (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

            {/* Lista de tiempos ya cargados */}
            {refRaces.length > 0 && (
              <ul className="border-b" style={{ borderColor: 'var(--border)' }}>
                {refRaces.map((r, i) => (
                  <li key={r.id} className={`flex items-center justify-between px-5 py-3 ${i < refRaces.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-sm font-medium">
                        {fmtDist(r.distance_km)} — {fmtTime(r.time_seconds)}
                        <span className="ml-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          ({fmtPace(r.time_seconds / r.distance_km)})
                        </span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(r.race_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}{r.race_type === 'race' ? t.race.refTypeRace : t.race.refTypeTrain}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteRefRace(r.id)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--muted-foreground)' }}>✕</button>
                  </li>
                ))}
              </ul>
            )}

            {/* Form inline */}
            {showRefForm ? (
              <div className="px-5 py-4">
                {/* Tipo + fecha */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refTypeLabel}</label>
                    <select value={refType} onChange={e => setRefType(e.target.value as 'race' | 'training')}
                      className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle}>
                      <option value="race">{t.race.refTypeRace}</option>
                      <option value="training">{t.race.refTypeTrain}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refDateLabel}</label>
                    <input type="date" value={refDate} onChange={e => setRefDate(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                  </div>
                </div>

                {refType === 'race' ? (
                  <div className="space-y-3 mb-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refDistLabel}</label>
                      <input type="number" min="0.1" step="0.001" value={refDist} onChange={e => setRefDist(e.target.value)}
                        placeholder="42.195" className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                    </div>
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
                            <input type="number" min="0" max={max} value={val} onChange={e => set(e.target.value)}
                              placeholder={ph} className="w-full rounded-lg border px-2 py-2 text-sm text-center" style={inputStyle} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refRepCount}</label>
                        <input type="number" min="1" step="1" value={refRepCount} onChange={e => setRefRepCount(e.target.value)}
                          placeholder="8" className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refRepDist}</label>
                        <input type="number" min="1" step="1" value={refRepDist} onChange={e => setRefRepDist(e.target.value)}
                          placeholder="400" className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refAvgPace}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: t.race.refPaceMm, val: refPaceMm, set: setRefPaceMm, max: 20, ph: '4' },
                          { label: t.race.refPaceSs, val: refPaceSs, set: setRefPaceSs, max: 59, ph: '30' },
                        ].map(({ label, val, set, max, ph }) => (
                          <div key={label}>
                            <p className="text-xs text-center mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                            <input type="number" min="0" max={max} value={val} onChange={e => set(e.target.value)}
                              placeholder={ph} className="w-full rounded-lg border px-2 py-2 text-sm text-center" style={inputStyle} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* FC opcional */}
                <div className="mb-3">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.race.refHrLabel} — {t.common.optional}</label>
                  <input type="number" min="60" max="220" value={refHR} onChange={e => setRefHR(e.target.value)}
                    placeholder="158" className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                </div>

                {refError && <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{refError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleAddRefRace} disabled={refSaving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: 'var(--primary)', color: '#fff' }}>
                    {refSaving ? t.common.saving : t.race.refSave}
                  </button>
                  <button onClick={() => { setShowRefForm(false); setRefError(''); }}
                    className="px-4 py-2.5 rounded-lg text-sm border"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--muted)' }}>
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            ) : (
              /* Botón para mostrar el form */
              <div className="px-5 py-4">
                <button
                  onClick={() => { setShowRefForm(true); setRefError(''); }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold border"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                  + {t.race.refAdd}
                </button>
              </div>
            )}

            {/* Acciones: avanzar al paso 3 o saltar */}
            {!showRefForm && (
              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#f97316', color: '#fff' }}>
                  {refRaces.length > 0 ? 'Continuar →' : 'Saltar por ahora →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 3: productos de nutrición ────────────────────────────── */}
        {step === 3 && (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

            {/* Lista de productos ya cargados */}
            {products.length > 0 && (
              <ul className="border-b" style={{ borderColor: 'var(--border)' }}>
                {products.map((p, i) => (
                  <li key={p.id} className={`flex items-center justify-between px-5 py-3 ${i < products.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {p.type === 'gel' ? t.profile.gelLabel : t.profile.saltPillLabel}
                        {p.carbs_grams > 0 ? ` · ${p.carbs_grams}g ${t.profile.carbsUnit}` : ''}
                        {p.sodium_mg > 0 ? ` · ${p.sodium_mg}mg ${t.profile.sodiumUnit}` : ''}
                        {p.caffeine_mg > 0 ? ` · ${p.caffeine_mg}mg ${t.profile.caffeineUnit}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.from('nutrition_products').delete().eq('id', p.id);
                        setProducts(prev => prev.filter(x => x.id !== p.id));
                      }}
                      className="text-xs px-2 py-1 rounded" style={{ color: 'var(--muted-foreground)' }}>✕</button>
                  </li>
                ))}
              </ul>
            )}

            {/* Form inline */}
            {showProdForm ? (
              <div className="px-5 py-4">
                <div className="space-y-3">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productName}</label>
                    <input type="text" maxLength={80} value={prodName} onChange={e => setProdName(e.target.value)}
                      placeholder="Ej: SIS Beta Fuel, Tailwind..." required
                      className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                  </div>
                  {/* Tipo */}
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productType}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['gel', 'salt_pill'] as const).map(pt => (
                        <button key={pt} type="button" onClick={() => setProdType(pt)}
                          className="py-2 rounded-lg text-sm font-medium border transition-colors"
                          style={{
                            background:  prodType === pt ? 'var(--primary)' : 'var(--muted)',
                            color:       prodType === pt ? '#fff' : 'var(--muted-foreground)',
                            borderColor: prodType === pt ? 'var(--primary)' : 'var(--border)',
                          }}>
                          {pt === 'gel' ? t.profile.productGel : t.profile.productSaltPill}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Valores nutricionales */}
                  <div className={`grid gap-3 ${prodType === 'gel' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {prodType === 'gel' && (
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productCarbs}</label>
                        <input type="number" step="0.1" min="0" max="500" value={prodCarbs} onChange={e => setProdCarbs(e.target.value)}
                          placeholder="22" className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                      </div>
                    )}
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productSodium}</label>
                      <input type="number" min="0" max="2000" value={prodSodium} onChange={e => setProdSodium(e.target.value)}
                        placeholder="200" className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productCaffeine}</label>
                      <input type="number" min="0" max="300" value={prodCaffeine} onChange={e => setProdCaffeine(e.target.value)}
                        placeholder="0" className="w-full rounded-lg border px-3 py-2 text-sm" style={inputStyle} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={async () => {
                      if (!runnerId || !prodName.trim()) return;
                      setSavingProd(true);
                      const { data, error: err } = await supabase
                        .from('nutrition_products')
                        .insert({
                          runner_id:   runnerId,
                          name:        prodName.trim(),
                          type:        prodType,
                          carbs_grams: prodCarbs   ? parseFloat(prodCarbs)   : 0,
                          sodium_mg:   prodSodium  ? parseInt(prodSodium)    : 0,
                          caffeine_mg: prodCaffeine ? parseInt(prodCaffeine) : 0,
                        })
                        .select('id,name,type,carbs_grams,sodium_mg,caffeine_mg')
                        .single();
                      setSavingProd(false);
                      if (err || !data) return;
                      setProducts(prev => [...prev, data]);
                      setProdName(''); setProdType('gel'); setProdCarbs(''); setProdSodium(''); setProdCaffeine('');
                      setShowProdForm(false);
                    }}
                    disabled={savingProd || !prodName.trim()}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: 'var(--primary)', color: '#fff' }}>
                    {savingProd ? t.common.saving : t.profile.saveProduct}
                  </button>
                  <button onClick={() => setShowProdForm(false)}
                    className="px-4 py-2.5 rounded-lg text-sm border"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--muted)' }}>
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4">
                <button onClick={() => setShowProdForm(true)}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold border"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                  + {t.profile.addProduct}
                </button>
              </div>
            )}

            {/* Ir a pricing */}
            {!showProdForm && (
              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={() => router.push('/pricing')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#f97316', color: '#fff' }}>
                  {products.length > 0 ? 'Continuar →' : 'Saltar por ahora →'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
