'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Supabase envía un email con link para resetear la contraseña
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
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
          <h2 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Recuperar contraseña</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>
            Ingresá tu email y te enviamos un link para resetear tu contraseña.
          </p>

          {sent ? (
            /* Confirmación de envío */
            <div className="p-3 rounded-lg text-sm text-center" style={{ background: '#14532d33', color: '#4ade80', border: '1px solid #166534' }}>
              Revisá tu casilla de correo.
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
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
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>
            </>
          )}
        </div>

        <button
          onClick={() => router.push('/login')}
          className="mt-4 w-full text-center text-sm"
          style={{ color: 'var(--muted-foreground)' }}
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
