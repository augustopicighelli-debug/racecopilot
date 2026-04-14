'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState<'login' | 'signup'>('login');

  // Si ya hay sesión activa, redirigir al dashboard directamente
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (data.user) router.push('/dashboard');
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        // Si hay sesión inmediata (email confirm desactivado), ir directo al onboarding
        if (data.session) {
          router.push('/onboarding');
        } else {
          setError('¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Race<span style={{ color: '#f97316' }}>Copilot</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Tu plan de carrera inteligente
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

          {/* Tabs login/signup */}
          <div className="flex rounded-lg p-1 mb-6" style={{ background: 'var(--muted)' }}>
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
                style={{
                  background: mode === m ? 'var(--card)' : 'transparent',
                  color: mode === m ? 'var(--foreground)' : 'var(--muted-foreground)',
                }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {/* Error / info */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                background: error.includes('¡') ? '#14532d33' : '#7f1d1d33',
                color: error.includes('¡') ? '#4ade80' : '#fca5a5',
                border: `1px solid ${error.includes('¡') ? '#166534' : '#991b1b'}`,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
              style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
