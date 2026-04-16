'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Suspense } from 'react';

// Componente interno para poder usar useSearchParams con Suspense
function CallbackHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      if (code) {
        // Intercambia el code PKCE por una sesión activa
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('OAuth callback error:', error);
          router.replace('/login');
          return;
        }

        if (data.user) {
          // Verificar si ya completó el onboarding
          const { data: runner } = await supabase
            .from('runners')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          // Nuevo usuario → onboarding; existente → dashboard
          router.replace(runner ? '/dashboard' : '/onboarding');
          return;
        }
      }

      // Sin code → volver al login
      router.replace('/login');
    };

    handleCallback();
  }, [router, searchParams]);

  // Pantalla de carga mientras se procesa el OAuth
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}
    >
      <p className="text-sm">Iniciando sesión...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }} />
    }>
      <CallbackHandler />
    </Suspense>
  );
}
