'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [ready, setReady]         = useState(false); // true cuando hay sesión de recovery

  // Supabase dispara el evento PASSWORD_RECOVERY cuando el usuario llega
  // desde el link del email. Esperamos ese evento para habilitar el form.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6)  { setError('Mínimo 6 caracteres'); return; }

    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setSuccess(true);
    // Redirigir al login luego de 2 segundos
    setTimeout(() => router.push('/login'), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Race<span style={{ color: '#f97316' }}>Copilot</span>
          </h1>
        </div>

        <div className="rounded-xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Nueva contraseña</h2>

          {success ? (
            <div className="p-3 rounded-lg text-sm text-center mt-4" style={{ background: '#14532d33', color: '#4ade80', border: '1px solid #166534' }}>
              ¡Contraseña actualizada! Redirigiendo...
            </div>
          ) : !ready ? (
            // Mientras no llegue el evento PASSWORD_RECOVERY
            <p className="text-sm mt-4" style={{ color: 'var(--muted-foreground)' }}>
              Verificando enlace...
            </p>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3 mt-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  required
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirmar contraseña"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
