'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

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
// Sección B — gestionar productos de nutrición
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const router = useRouter();

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

  // --- Sección B: productos de nutrición ---
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
      setSaveMsg('Cambios guardados');
    } catch (err: any) {
      setSaveErr(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Sección B: agregar producto de nutrición
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
    if (!confirm('¿Cancelar tu suscripción? Mantenés el acceso hasta que venza el período actual.')) return;
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
      setCancelMsg('Suscripción cancelada. Tenés acceso hasta que venza el período actual.');
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
      Cargando...
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
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Mi perfil</p>
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
        <h2 className="font-semibold mb-3">Mi perfil</h2>
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Peso (kg)</label>
                <input
                  type="number" step="0.1" min="30" max="200"
                  value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Altura (cm)</label>
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
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Nivel de sudoración</label>
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
                    {s === 'low' ? 'Poco' : s === 'medium' ? 'Moderado' : 'Mucho'}
                  </button>
                ))}
              </div>
            </div>

            {/* FC máx, FC reposo y km/semana */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  FC máx <span style={{ color: 'var(--border)' }}>(opc)</span>
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
                  FC reposo <span style={{ color: 'var(--border)' }}>(opc)</span>
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
                  Km/semana <span style={{ color: 'var(--border)' }}>(opc)</span>
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
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* ================================================================
            SECCIÓN B — Suscripción
        ================================================================ */}
        <h2 className="font-semibold mb-3">Suscripción</h2>
        <div className="rounded-xl border p-5 mb-8" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {isPremium ? (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>Activa</p>
                  {premiumUntil && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      Acceso hasta: {new Date(premiumUntil).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
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
                    {portalLoading ? 'Abriendo...' : 'Gestionar suscripción'}
                  </button>
                  {hasSub && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      {cancelling ? 'Cancelando...' : 'Cancelar'}
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
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Sin suscripción activa</p>
              <button
                onClick={() => router.push('/pricing')}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                Activar prueba gratis
              </button>
            </div>
          )}
        </div>

        {/* ================================================================
            SECCIÓN C — Mis productos de nutrición
        ================================================================ */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Mis productos de nutrición</h2>
          {/* Mostrar botón + solo si el form está cerrado */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              + Agregar producto
            </button>
          )}
        </div>

        {/* Lista de productos existentes */}
        <div className="space-y-2 mb-4">
          {products.length === 0 && !showForm && (
            <div
              className="rounded-xl border p-8 text-center text-sm"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              Sin productos todavía. Agregá geles o pastillas de sal.
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
                  {p.type === 'gel' ? 'Gel' : 'Pastilla de sal'}
                  {p.carbs_grams > 0 ? ` · ${p.carbs_grams}g carbos` : ''}
                  {p.sodium_mg > 0 ? ` · ${p.sodium_mg}mg sodio` : ''}
                  {p.caffeine_mg > 0 ? ` · ${p.caffeine_mg}mg cafeína` : ''}
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
            <h3 className="text-sm font-semibold mb-4">Nuevo producto</h3>

            <form onSubmit={handleAddProduct} className="space-y-3">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Nombre</label>
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
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['gel', 'salt_pill'] as const).map((t) => (
                    <button
                      key={t} type="button" onClick={() => setProductType(t)}
                      className="py-2 rounded-lg text-sm font-medium border transition-colors"
                      style={{
                        background:  productType === t ? 'var(--primary)' : 'var(--muted)',
                        color:       productType === t ? '#fff' : 'var(--muted-foreground)',
                        borderColor: productType === t ? 'var(--primary)' : 'var(--border)',
                      }}
                    >
                      {t === 'gel' ? 'Gel' : 'Pastilla de sal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carbos, sodio, cafeína en grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Carbos (g)</label>
                  <input
                    type="number" step="0.1" min="0" max="500"
                    value={productCarbs} onChange={(e) => setProductCarbs(e.target.value)}
                    placeholder="22"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Sodio (mg)</label>
                  <input
                    type="number" min="0" max="2000"
                    value={productSodium} onChange={(e) => setProductSodium(e.target.value)}
                    placeholder="200"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Cafeína (mg)</label>
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
                  {savingProduct ? 'Guardando...' : 'Guardar producto'}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--muted)' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
