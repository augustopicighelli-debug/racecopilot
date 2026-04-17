'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useLang } from '@/lib/lang';
import { useUnits } from '@/lib/units';

// Formatea segundos → H:MM:SS / MM:SS
function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// ---------------------------------------------------------------------------
// Tipos locales que mapean las filas de Supabase
// ---------------------------------------------------------------------------
interface Runner {
  id: string;
  weight_kg: number;
  height_cm: number;
  sweat_level: 'low' | 'medium' | 'high';
  max_hr: number | null;
  resting_hr: number | null;
  weekly_km: number | null;
  is_premium: boolean | null;
  premium_until: string | null;
  stripe_subscription_id: string | null;
}

interface ReferenceRace {
  id: string;
  distance_km: number;
  time_seconds: number;
  race_date: string;
  race_type: 'race' | 'training';
  avg_heart_rate: number | null;
}

interface NutritionProduct {
  id: string;
  runner_id: string;
  name: string;
  type: 'gel' | 'salt_pill';
  carbs_grams: number;
  sodium_mg: number;
  caffeine_mg: number;
}

// ---------------------------------------------------------------------------
// Página: /profile
// Sección A — editar perfil del runner
// ---------------------------------------------------------------------------
// Kit sugerido de nutrición — aparece en la sección de productos
// ---------------------------------------------------------------------------
function NutritionKitGuide({ hasGel, hasCafGel, hasSalt }: {
  hasGel: boolean;
  hasCafGel: boolean;
  hasSalt: boolean;
}) {
  // Preferencia de cafeína persiste en localStorage
  const [noCaffeine, setNoCaffeine] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rc_avoid_caffeine') === '1';
  });

  const toggleCaffeine = () => {
    const next = !noCaffeine;
    setNoCaffeine(next);
    localStorage.setItem('rc_avoid_caffeine', next ? '1' : '0');
  };

  // Si evita cafeína, tratar hasCafGel como satisfecho
  const cafSatisfied = hasCafGel || noCaffeine;

  // Kit completo → no mostrar guía
  if (hasGel && cafSatisfied && hasSalt) return null;

  const items: { key: string; icon: string; label: string; desc: string; done: boolean }[] = [
    {
      key: 'gel',
      icon: '⚡',
      label: 'Gel sin cafeína',
      desc: 'Carbos cada ~45 min desde km 7 hasta km 28',
      done: hasGel,
    },
    ...(!noCaffeine ? [{
      key: 'cafgel',
      icon: '⚡☕',
      label: 'Gel con cafeína',
      desc: 'Guardarlo para km 30-32 — efecto máximo en la fatiga final',
      done: hasCafGel,
    }] : []),
    {
      key: 'salt',
      icon: '🧂',
      label: 'Pastilla de sal',
      desc: 'Cada 60-90 min para retener fluidos y evitar calambres',
      done: hasSalt,
    },
  ];

  return (
    <div
      className="rounded-xl border p-4 mb-4"
      style={{ background: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.25)' }}
    >
      {/* Encabezado + toggle cafeína */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: '#f97316' }}>
          💡 Kit recomendado para maratón / media
        </p>
        {/* Toggle: no consumo cafeína */}
        <button
          type="button"
          onClick={toggleCaffeine}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors"
          style={{
            background:   noCaffeine ? 'rgba(99,102,241,0.15)' : 'transparent',
            borderColor:  noCaffeine ? 'rgba(99,102,241,0.5)'  : 'var(--border)',
            color:        noCaffeine ? '#818cf8'                : 'var(--muted-foreground)',
          }}
        >
          ☕ {noCaffeine ? 'Sin cafeína' : 'Con cafeína'}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.key} className={`flex items-start gap-2 ${m.done ? 'opacity-40' : ''}`}>
            <span className="text-xs mt-0.5" style={{ color: m.done ? 'var(--muted-foreground)' : '#f97316' }}>
              {m.done ? '✓' : '+'}
            </span>
            <div>
              <p
                className={`text-xs font-medium ${m.done ? 'line-through' : ''}`}
                style={{ color: m.done ? 'var(--muted-foreground)' : 'var(--foreground)' }}
              >
                {m.icon} {m.label}
              </p>
              {!m.done && (
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{m.desc}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección B — gestionar productos de nutrición
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLang();
  const { fmtDist, fmtPace } = useUnits();

  // --- Estado global ---
  const [runnerId, setRunnerId]           = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const [saveMsg, setSaveMsg]             = useState('');
  const [saveErr, setSaveErr]             = useState('');
  const [isPremium, setIsPremium]         = useState(false);
  const [premiumUntil, setPremiumUntil]   = useState<string | null>(null);
  const [hasSub, setHasSub]               = useState(false);
  const [cancelling, setCancelling]       = useState(false);
  const [cancelMsg, setCancelMsg]         = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  // --- Sección A: perfil ---
  const [weightKg, setWeightKg]   = useState('');
  const [heightCm, setHeightCm]   = useState('');
  const [sweat, setSweat]         = useState<'low' | 'medium' | 'high'>('medium');
  const [maxHr, setMaxHr]         = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [weeklyKm, setWeeklyKm]   = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // --- Sección C: tiempos de referencia ---
  const [refRaces, setRefRaces]         = useState<ReferenceRace[]>([]);
  const [showRefForm, setShowRefForm]   = useState(false);
  const [refCollapsed, setRefCollapsed] = useState(true); // colapsar sección de referencia (inicia cerrado)
  const [refSaving, setRefSaving]       = useState(false);
  const [refError, setRefError]         = useState('');
  // campos modo carrera
  const [refDist, setRefDist]           = useState('');
  const [refTimeHH, setRefTimeHH]       = useState('');
  const [refTimeMM, setRefTimeMM]       = useState('');
  const [refTimeSS, setRefTimeSS]       = useState('');
  const [refDate, setRefDate]           = useState('');
  const [refType, setRefType]           = useState<'race' | 'training'>('race');
  const [refHR, setRefHR]               = useState('');
  // campos modo pasadas
  const [refRepCount, setRefRepCount]   = useState('');
  const [refRepDist, setRefRepDist]     = useState('');
  const [refPaceMm, setRefPaceMm]       = useState('');
  const [refPaceSs, setRefPaceSs]       = useState('');

  // --- Sección D: productos de nutrición ---
  const [products, setProducts]         = useState<NutritionProduct[]>([]);
  const [showForm, setShowForm]         = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productName, setProductName]   = useState('');
  const [productType, setProductType]   = useState<'gel' | 'salt_pill'>('gel');
  const [productCarbs, setProductCarbs] = useState('');
  const [productSodium, setProductSodium] = useState('');
  const [productCaffeine, setProductCaffeine] = useState('');

  // ---------------------------------------------------------------------------
  // Carga inicial: verificar sesión, cargar runner y productos
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      // Cargar perfil del corredor
      const { data: r } = await supabase
        .from('runners')
        .select('id,weight_kg,height_cm,sweat_level,max_hr,resting_hr,weekly_km,is_premium,premium_until,stripe_subscription_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!r) { router.push('/onboarding'); return; }

      // Poblar campos del form con datos actuales
      setRunnerId(r.id);
      setWeightKg(String(r.weight_kg));
      setHeightCm(String(r.height_cm));
      setSweat(r.sweat_level);
      setMaxHr(r.max_hr ? String(r.max_hr) : '');
      setRestingHr(r.resting_hr ? String(r.resting_hr) : '');
      setWeeklyKm(r.weekly_km ? String(r.weekly_km) : '');
      setIsPremium(!!r.is_premium);
      setPremiumUntil(r.premium_until ?? null);
      setHasSub(!!r.stripe_subscription_id);

      // Cargar tiempos de referencia del runner
      const { data: refs } = await supabase
        .from('reference_races')
        .select('id,distance_km,time_seconds,race_date,race_type,avg_heart_rate')
        .eq('runner_id', r.id)
        .order('race_date', { ascending: false });
      setRefRaces(refs ?? []);

      // Cargar productos de nutrición del runner
      const { data: prods } = await supabase
        .from('nutrition_products')
        .select('id,runner_id,name,type,carbs_grams,sodium_mg,caffeine_mg')
        .eq('runner_id', r.id)
        .order('created_at', { ascending: true });

      setProducts(prods ?? []);
      setLoading(false);
    };
    init();
  }, [router]);

  // ---------------------------------------------------------------------------
  // Sección A: guardar cambios del perfil
  // ---------------------------------------------------------------------------
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveMsg('');
    setSaveErr('');

    try {
      const { error: err } = await supabase
        .from('runners')
        .update({
          weight_kg:   parseFloat(weightKg),
          height_cm:   parseFloat(heightCm),
          sweat_level: sweat,
          max_hr:      maxHr ? parseInt(maxHr) : null,
          resting_hr:  restingHr ? parseInt(restingHr) : null,
          weekly_km:   weeklyKm ? parseFloat(weeklyKm) : null,
          updated_at:  new Date().toISOString(),
        })
        .eq('id', runnerId!);

      if (err) throw err;
      setSaveMsg(t.profile.saveSuccess);
    } catch (err: any) {
      setSaveErr(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Sección C: agregar tiempo de referencia
  // ---------------------------------------------------------------------------
  const handleAddRefRace = useCallback(async () => {
    if (!runnerId) return;
    setRefError('');
    if (!refDate) { setRefError('Fecha requerida'); return; }

    const hr = refHR ? parseInt(refHR) : null;
    let distKm: number;
    let timeSecs: number;

    if (refType === 'training') {
      const count   = parseInt(refRepCount);
      const repDist = parseFloat(refRepDist) / 1000; // metros → km
      const pm      = parseInt(refPaceMm) || 0;
      const ps      = parseInt(refPaceSs) || 0;
      const paceSecPerKm = pm * 60 + ps;
      if (!count || count <= 0)     { setRefError('Cantidad inválida'); return; }
      if (!repDist || repDist <= 0) { setRefError('Distancia por rep inválida'); return; }
      if (paceSecPerKm <= 0)        { setRefError('Ritmo inválido'); return; }
      distKm   = count * repDist;
      timeSecs = distKm * paceSecPerKm;
    } else {
      distKm = parseFloat(refDist);
      const hh = parseInt(refTimeHH) || 0;
      const mm = parseInt(refTimeMM) || 0;
      const ss = parseInt(refTimeSS) || 0;
      timeSecs = hh * 3600 + mm * 60 + ss;
      if (!distKm || distKm <= 0) { setRefError('Distancia inválida'); return; }
      if (timeSecs <= 0)          { setRefError('Tiempo inválido'); return; }
    }

    setRefSaving(true);
    const { data, error: err } = await supabase
      .from('reference_races')
      .insert({ runner_id: runnerId, distance_km: distKm, time_seconds: timeSecs, race_date: refDate, race_type: refType, avg_heart_rate: hr })
      .select('id,distance_km,time_seconds,race_date,race_type,avg_heart_rate')
      .single();
    setRefSaving(false);

    if (err) { setRefError(err.message); return; }

    // Agregar a la lista local y resetear form
    setRefRaces(prev => [data, ...prev]);
    setRefDist(''); setRefTimeHH(''); setRefTimeMM(''); setRefTimeSS('');
    setRefRepCount(''); setRefRepDist(''); setRefPaceMm(''); setRefPaceSs('');
    setRefDate(''); setRefType('race'); setRefHR('');
    setShowRefForm(false);
  }, [runnerId, refDate, refHR, refType, refDist, refTimeHH, refTimeMM, refTimeSS, refRepCount, refRepDist, refPaceMm, refPaceSs]);

  const handleDeleteRefRace = async (id: string) => {
    await supabase.from('reference_races').delete().eq('id', id);
    setRefRaces(prev => prev.filter(r => r.id !== id));
  };

  // ---------------------------------------------------------------------------
  // Sección D: agregar producto de nutrición
  // ---------------------------------------------------------------------------
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runnerId) return;
    setSavingProduct(true);

    try {
      const { data, error: err } = await supabase
        .from('nutrition_products')
        .insert({
          runner_id:   runnerId,
          name:        productName.trim(),
          type:        productType,
          carbs_grams: productCarbs ? parseFloat(productCarbs) : 0,
          sodium_mg:   productSodium ? parseInt(productSodium) : 0,
          caffeine_mg: productCaffeine ? parseInt(productCaffeine) : 0,
        })
        .select('id,runner_id,name,type,carbs_grams,sodium_mg,caffeine_mg')
        .single();

      if (err) throw err;

      // Agregar a la lista local sin recargar desde DB
      setProducts((prev) => [...prev, data]);

      // Resetear form y ocultarlo
      setProductName('');
      setProductType('gel');
      setProductCarbs('');
      setProductSodium('');
      setProductCaffeine('');
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Sección B: borrar producto
  // ---------------------------------------------------------------------------
  const handleDeleteProduct = async (id: string) => {
    const { error: err } = await supabase
      .from('nutrition_products')
      .delete()
      .eq('id', id);

    if (err) { alert(err.message); return; }

    // Actualizar lista local
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ---------------------------------------------------------------------------
  // Abrir portal de Stripe (cambiar tarjeta, ver facturas, cancelar)
  // ---------------------------------------------------------------------------
  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error); }
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al abrir el portal');
    } finally {
      setPortalLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Cancelar suscripción (cancel_at_period_end = true)
  // ---------------------------------------------------------------------------
  const handleCancel = async () => {
    if (!confirm(t.profile.subCancelConfirm)) return;
    setCancelling(true);
    setCancelMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error); }
      setCancelMsg(t.profile.subCancelledMsg);
      setHasSub(false);
    } catch (err: unknown) {
      setCancelMsg(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setCancelling(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Estados de carga y estilos reutilizables
  // ---------------------------------------------------------------------------
  const inputStyle = {
    background:   'var(--input)',
    borderColor:  'var(--border)',
    color:        'var(--foreground)',
  };

  if (loading) return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}
    >
      {t.common.loading}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header con botón volver */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold">
              Race<span style={{ color: '#f97316' }}>Copilot</span>
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t.profile.title}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            ← Dashboard
          </button>
        </div>

        {/* ================================================================
            SECCIÓN A — Mi perfil
        ================================================================ */}
        <h2 className="font-semibold mb-3">{t.profile.sectionProfile}</h2>
        <div className="rounded-xl p-6 border mb-8" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

          {/* Mensaje de éxito / error al guardar */}
          {saveMsg && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#14532d33', color: '#86efac', border: '1px solid #166534' }}>
              {saveMsg}
            </div>
          )}
          {saveErr && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
              {saveErr}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">

            {/* Peso y altura en grid 2 columnas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{t.profile.fieldWeight}</label>
                <input
                  type="number" step="0.1" min="30" max="200"
                  value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{t.profile.fieldHeight}</label>
                <input
                  type="number" step="0.1" min="120" max="230"
                  value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  required
                />
              </div>
            </div>

            {/* Nivel de sudoración */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>{t.profile.fieldSweat}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((s) => (
                  <button
                    key={s} type="button" onClick={() => setSweat(s)}
                    className="py-2 rounded-lg text-sm font-medium border transition-colors"
                    style={{
                      background:   sweat === s ? 'var(--primary)' : 'var(--muted)',
                      color:        sweat === s ? '#fff' : 'var(--muted-foreground)',
                      borderColor:  sweat === s ? 'var(--primary)' : 'var(--border)',
                    }}
                  >
                    {s === 'low' ? t.profile.sweatLow : s === 'medium' ? t.profile.sweatMedium : t.profile.sweatHigh}
                  </button>
                ))}
              </div>
            </div>

            {/* FC máx, FC reposo y km/semana */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  {t.profile.fieldMaxHr} <span style={{ color: 'var(--border)' }}>{t.profile.opc}</span>
                </label>
                <input
                  type="number" min="100" max="230"
                  value={maxHr} onChange={(e) => setMaxHr(e.target.value)}
                  placeholder="180"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  {t.profile.fieldRestingHr} <span style={{ color: 'var(--border)' }}>{t.profile.opc}</span>
                </label>
                <input
                  type="number" min="30" max="100"
                  value={restingHr} onChange={(e) => setRestingHr(e.target.value)}
                  placeholder="55"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  {t.profile.fieldWeeklyKm} <span style={{ color: 'var(--border)' }}>{t.profile.opc}</span>
                </label>
                <input
                  type="number" step="0.1" min="0" max="300"
                  value={weeklyKm} onChange={(e) => setWeeklyKm(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                />
              </div>
            </div>

            {/* Botón guardar */}
            <button
              type="submit" disabled={savingProfile}
              className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 mt-2"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {savingProfile ? t.common.saving : t.common.save}
            </button>
          </form>
        </div>

        {/* ================================================================
            SECCIÓN B — Suscripción
        ================================================================ */}
        <h2 className="font-semibold mb-3">{t.profile.sectionSubscription}</h2>
        <div className="rounded-xl border p-5 mb-8" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {isPremium ? (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>{t.profile.subActive}</p>
                  {premiumUntil && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {t.profile.accessUntil} {new Date(premiumUntil).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                {/* Portal de Stripe: cambiar tarjeta, ver facturas, cancelar */}
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {portalLoading ? t.profile.subOpening : t.profile.subManage}
                  </button>
                  {hasSub && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      {cancelling ? t.profile.subCancelling : t.common.cancel}
                    </button>
                  )}
                </div>
              </div>
              {cancelMsg && (
                <p className="text-xs mt-3" style={{ color: cancelMsg.includes('Error') ? '#ef4444' : '#4ade80' }}>
                  {cancelMsg}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.profile.subNone}</p>
              <button
                onClick={() => router.push('/pricing')}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {t.profile.subActivate}
              </button>
            </div>
          )}
        </div>

        {/* ================================================================
            SECCIÓN C — Tiempos de referencia
        ================================================================ */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setRefCollapsed(c => !c)}
            className="flex items-center gap-2 text-left"
          >
            <span
              className="text-xs transition-transform duration-200"
              style={{ color: 'var(--muted-foreground)', display: 'inline-block', transform: refCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            >▾</span>
            <div>
              <h2 className="font-semibold">{t.race.refTitle}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t.race.refSubtitle}</p>
            </div>
          </button>
          {!refCollapsed && !showRefForm && (
            <button
              onClick={() => { setShowRefForm(true); setRefError(''); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {t.race.refAdd}
            </button>
          )}
        </div>

        {/* Lista de tiempos (colapsable) */}
        {!refCollapsed && <div className="rounded-xl border mb-4 overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {refRaces.length === 0 && !showRefForm ? (
            <p className="px-5 py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.race.refEmpty}</p>
          ) : (
            <ul>
              {refRaces.map((r, i) => (
                <li key={r.id} className={`flex items-center justify-between px-4 py-3 ${i < refRaces.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)' }}>
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
                      {r.avg_heart_rate ? ` · ${r.avg_heart_rate} bpm` : ''}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteRefRace(r.id)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--muted-foreground)' }}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>}

        {/* Formulario inline de nuevo tiempo */}
        {!refCollapsed && showRefForm && (
          <div className="rounded-xl border p-5 mb-8" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            {/* Fila: tipo + fecha */}
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

            {/* FC promedio opcional */}
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
        )}

        {/* ================================================================
            SECCIÓN D — Mis productos de nutrición
        ================================================================ */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{t.profile.sectionNutrition}</h2>
          {/* Mostrar botón + solo si el form está cerrado */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {t.profile.addProduct}
            </button>
          )}
        </div>

        {/* ── Kit sugerido para maratón / media ──────────────────────────── */}
        <NutritionKitGuide hasGel={products.some(p => p.type === 'gel' && p.caffeine_mg === 0)} hasCafGel={products.some(p => p.type === 'gel' && p.caffeine_mg > 0)} hasSalt={products.some(p => p.type === 'salt_pill')} />

        {/* Lista de productos existentes */}
        <div className="space-y-2 mb-4">
          {products.length === 0 && !showForm && (
            <div
              className="rounded-xl border p-8 text-center text-sm"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {t.profile.noProducts}
            </div>
          )}

          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border px-4 py-3 flex items-center justify-between"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* Info del producto */}
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {p.type === 'gel' ? t.profile.gelLabel : t.profile.saltPillLabel}
                  {p.carbs_grams > 0 ? ` · ${p.carbs_grams}g ${t.profile.carbsUnit}` : ''}
                  {p.sodium_mg > 0 ? ` · ${p.sodium_mg}mg ${t.profile.sodiumUnit}` : ''}
                  {p.caffeine_mg > 0 ? ` · ${p.caffeine_mg}mg ${t.profile.caffeineUnit}` : ''}
                </p>
              </div>

              {/* Botón borrar */}
              <button
                onClick={() => handleDeleteProduct(p.id)}
                className="text-lg leading-none ml-4"
                style={{ color: 'var(--muted-foreground)' }}
                title="Borrar producto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Form inline para agregar producto */}
        {showForm && (
          <div
            className="rounded-xl border p-5 mb-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-4">{t.profile.newProduct}</h3>

            <form onSubmit={handleAddProduct} className="space-y-3">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productName}</label>
                <input
                  type="text" maxLength={80}
                  value={productName} onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: SIS Beta Fuel, Tailwind..."
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  required
                />
              </div>

              {/* Tipo: gel / pastilla de sal */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productType}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['gel', 'salt_pill'] as const).map((pt) => (
                    <button
                      key={pt} type="button" onClick={() => setProductType(pt)}
                      className="py-2 rounded-lg text-sm font-medium border transition-colors"
                      style={{
                        background:  productType === pt ? 'var(--primary)' : 'var(--muted)',
                        color:       productType === pt ? '#fff' : 'var(--muted-foreground)',
                        borderColor: productType === pt ? 'var(--primary)' : 'var(--border)',
                      }}
                    >
                      {pt === 'gel' ? t.profile.productGel : t.profile.productSaltPill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carbos (solo para geles), sodio, cafeína */}
              <div className={`grid gap-3 ${productType === 'gel' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {/* Carbs: oculto en pastillas (no aportan carbohidratos) */}
                {productType === 'gel' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productCarbs}</label>
                  <input
                    type="number" step="0.1" min="0" max="500"
                    value={productCarbs} onChange={(e) => setProductCarbs(e.target.value)}
                    placeholder="22"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  />
                </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productSodium}</label>
                  <input
                    type="number" min="0" max="2000"
                    value={productSodium} onChange={(e) => setProductSodium(e.target.value)}
                    placeholder="200"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{t.profile.productCaffeine}</label>
                  <input
                    type="number" min="0" max="300"
                    value={productCaffeine} onChange={(e) => setProductCaffeine(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  />
                </div>
              </div>

              {/* Acciones del form */}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit" disabled={savingProduct}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  {savingProduct ? t.common.saving : t.profile.saveProduct}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--muted)' }}
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
