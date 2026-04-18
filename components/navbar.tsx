'use client';
// Barra de navegación global — aparece en todas las páginas.
// Muestra logo + links según estado de autenticación + toggles de idioma/unidades.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { LangToggle } from './lang-toggle';
import { UnitsToggle } from './units-toggle';
import { useLang } from '@/lib/lang';

export function Navbar() {
  // null = desconocido (cargando), true = logueado, false = no logueado
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();
  const { t } = useLang();
  const n = t.nav;

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
    // Reaccionar a cambios de sesión (login/logout en otra pestaña, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-14 no-print"
      style={{
        background:      'rgba(10,10,10,0.88)',
        backdropFilter:  'blur(12px)',
        borderBottom:    '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo — enlaza a dashboard si está logueado, a landing si no */}
      <Link
        href={authed ? '/dashboard' : '/'}
        className="text-base font-bold tracking-tight select-none"
      >
        Race<span style={{ color: '#f97316' }}>Copilot</span>
      </Link>

      {/* Acciones — dependen del estado de auth */}
      <div className="flex items-center gap-3">

        {/* === Logueado === */}
        {authed === true && (
          <>
            <Link href="/dashboard" className="text-xs transition-opacity hover:opacity-100 opacity-70" style={{ color: 'var(--foreground)' }}>
              {n.dashboard}
            </Link>
            <Link href="/profile" className="text-xs transition-opacity hover:opacity-100 opacity-70" style={{ color: 'var(--foreground)' }}>
              {n.profile}
            </Link>
            <button
              onClick={handleLogout}
              title={n.logout}
              className="opacity-50 hover:opacity-90 transition-opacity ml-0.5"
            >
              <LogOut size={14} style={{ color: 'var(--foreground)' }} />
            </button>
          </>
        )}

        {/* === No logueado === */}
        {authed === false && (
          <>
            <Link href="/pricing" className="text-xs transition-opacity hover:opacity-100 opacity-70" style={{ color: 'var(--foreground)' }}>
              {n.pricing}
            </Link>
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {n.enter}
            </Link>
          </>
        )}

        {/* Toggles siempre visibles */}
        <div className="flex items-center gap-1.5 ml-1">
          <LangToggle />
          <UnitsToggle />
        </div>
      </div>
    </header>
  );
}
