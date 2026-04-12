'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Si ya tiene perfil, ir a dashboard
      router.push('/dashboard');
    };

    checkAuth();
  }, [router]);

  return <div className="flex items-center justify-center min-h-screen">Redirigiendo...</div>;
}
