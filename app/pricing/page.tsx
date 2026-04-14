'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

// Tipos de plan disponibles
type Plan = 'monthly' | 'yearly';

export default function PricingPage() {
  const router = useRouter();
  // Estado de loading por plan para mostrar spinner en el botón correcto
  const [loading, setLoading] = useState<Plan | null>(null);

  // Maneja el click en un plan: verifica auth y llama al endpoint de checkout
  const handleSelectPlan = async (plan: Plan) => {
    setLoading(plan);

    // Verificar que el usuario esté logueado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      // Llamar al API route que crea la Checkout Session en Stripe
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Enviar el JWT de Supabase para autenticar en el servidor
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('[Pricing] Error al crear checkout:', err);
        setLoading(null);
        return;
      }

      const { url } = await res.json();

      // Redirigir a Stripe Checkout
      window.location.href = url;
    } catch (e) {
      console.error('[Pricing] Error de red:', e);
      setLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* Título */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold mb-2">
          Race<span style={{ color: '#f97316' }}>Copilot</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Empezá gratis — 7 días sin cargo, cancelá cuando quieras.
        </p>
      </div>

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

          {/* Features */}
          <ul className="text-sm space-y-2 mb-8 flex-1" style={{ color: 'var(--muted-foreground)' }}>
            <li>✓ Planes de hidratación y nutrición</li>
            <li>✓ Predictor de ritmo con IA</li>
            <li>✓ Análisis de recorrido GPX</li>
            <li>✓ Soporte prioritario</li>
          </ul>

          <button
            onClick={() => handleSelectPlan('monthly')}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
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
          {/* Badge "Mejor valor" */}
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

          {/* Features */}
          <ul className="text-sm space-y-2 mb-8 flex-1" style={{ color: 'var(--muted-foreground)' }}>
            <li>✓ Planes de hidratación y nutrición</li>
            <li>✓ Predictor de ritmo con IA</li>
            <li>✓ Análisis de recorrido GPX</li>
            <li>✓ Soporte prioritario</li>
          </ul>

          <button
            onClick={() => handleSelectPlan('yearly')}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
            style={{ background: '#f97316', color: '#fff' }}
          >
            {loading === 'yearly' ? 'Redirigiendo...' : 'Empezar prueba gratis — 7 días'}
          </button>
        </div>
      </div>

      {/* Nota al pie */}
      <p className="text-xs mt-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
        Al continuar aceptás nuestros términos. Cancelá antes del día 7 para no ser cobrado.
      </p>
    </div>
  );
}
