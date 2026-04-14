'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

type Plan = 'monthly' | 'yearly';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading]     = useState<Plan | null>(null);
  const [error, setError]         = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [checking, setChecking]   = useState(true);

  // Verificar si el usuario ya es premium al cargar
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setChecking(false); return; }

      const { data: runner } = await supabase
        .from('runners')
        .select('is_premium')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setIsPremium(!!runner?.is_premium);
      setChecking(false);
    };
    check();
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    setLoading(plan);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? 'Error al iniciar el checkout. Intentá de nuevo.');
        setLoading(null);
        return;
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setLoading(null);
    }
  };

  if (checking) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
      Cargando...
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* Botón volver (solo si tiene sesión) */}
      <div className="w-full max-w-2xl mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm"
          style={{ color: 'var(--muted-foreground)' }}
        >
          ← Dashboard
        </button>
      </div>

      {/* Título */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold mb-2">
          Race<span style={{ color: '#f97316' }}>Copilot</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Empezá gratis — 7 días sin cargo, cancelá cuando quieras.
        </p>
      </div>

      {/* Ya es premium → mensaje y botón al dashboard */}
      {isPremium ? (
        <div className="w-full max-w-md rounded-2xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'rgba(249,115,22,0.4)' }}>
          <p className="font-semibold mb-2" style={{ color: '#4ade80' }}>Ya tenés una suscripción activa</p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Podés gestionar tu suscripción desde tu perfil.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Ir al dashboard
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              Mi perfil
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Error de checkout */}
          {error && (
            <div className="w-full max-w-2xl mb-6 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
              {error}
            </div>
          )}

          {/* Cards de planes */}
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">

            {/* Plan mensual */}
            <div
              className="flex-1 rounded-2xl border p-6 flex flex-col"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Mensual
              </p>
              <p className="text-3xl font-bold mb-1">$15</p>
              <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>por mes</p>

              <ul className="text-sm space-y-2 mb-8 flex-1" style={{ color: 'var(--muted-foreground)' }}>
                <li>✓ Planes de hidratación y nutrición</li>
                <li>✓ Predictor de ritmo con IA</li>
                <li>✓ Análisis de recorrido GPX</li>
                <li>✓ Soporte prioritario</li>
              </ul>

              <button
                onClick={() => handleSelectPlan('monthly')}
                disabled={loading !== null}
                className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {loading === 'monthly' ? 'Redirigiendo...' : 'Empezar prueba gratis — 7 días'}
              </button>
            </div>

            {/* Plan anual — destacado */}
            <div
              className="flex-1 rounded-2xl border-2 p-6 flex flex-col relative"
              style={{ background: 'var(--card)', borderColor: '#f97316' }}
            >
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: '#f97316', color: '#fff' }}
              >
                2 meses gratis
              </span>

              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Anual
              </p>
              <p className="text-3xl font-bold mb-1">$120</p>
              <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
                por año <span style={{ color: '#f97316' }}>· $10/mes</span>
              </p>

              <ul className="text-sm space-y-2 mb-8 flex-1" style={{ color: 'var(--muted-foreground)' }}>
                <li>✓ Planes de hidratación y nutrición</li>
                <li>✓ Predictor de ritmo con IA</li>
                <li>✓ Análisis de recorrido GPX</li>
                <li>✓ Soporte prioritario</li>
              </ul>

              <button
                onClick={() => handleSelectPlan('yearly')}
                disabled={loading !== null}
                className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ background: '#f97316', color: '#fff' }}
              >
                {loading === 'yearly' ? 'Redirigiendo...' : 'Empezar prueba gratis — 7 días'}
              </button>
            </div>
          </div>

          <p className="text-xs mt-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
            Al continuar aceptás nuestros términos. Cancelá antes del día 7 para no ser cobrado.
          </p>
        </>
      )}
    </div>
  );
}
