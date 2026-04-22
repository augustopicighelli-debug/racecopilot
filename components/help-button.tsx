'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLang } from '@/lib/lang';

export function HelpButton() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const email = 'hello@racecopilot.com';
  const subject = encodeURIComponent(t.nav.helpSubject ?? 'Ayuda');

  return (
    <div className="no-print fixed bottom-5 right-5 z-50">

      {/* Burbuja con email — solo desktop, visible cuando open=true */}
      {open && (
        <div
          className="hidden md:flex flex-col gap-2 mb-2 p-4 rounded-2xl shadow-xl text-sm"
          style={{
            background:   'var(--card)',
            border:       '1px solid var(--border)',
            color:        'var(--foreground)',
            backdropFilter: 'blur(8px)',
            minWidth: '220px',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">{t.nav.help ?? 'Ayuda'}</span>
            <button onClick={() => setOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
              <X size={14} />
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {t.nav.helpDesc ?? 'Escribinos a:'}
          </p>
          <a
            href={`mailto:${email}?subject=${subject}`}
            className="font-medium break-all hover:underline"
            style={{ color: '#f97316' }}
          >
            {email}
          </a>
        </div>
      )}

      {/* Botón principal:
          - Desktop: toggle burbuja
          - Mobile: mailto directo */}
      <a
        href={`mailto:${email}?subject=${subject}`}
        onClick={(e) => {
          // En desktop interceptamos el click para mostrar la burbuja
          if (window.matchMedia('(min-width: 768px)').matches) {
            e.preventDefault();
            setOpen(prev => !prev);
          }
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-xs font-semibold transition-opacity hover:opacity-90"
        style={{
          background:     'var(--card)',
          border:         '1px solid var(--border)',
          color:          'var(--foreground)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <MessageCircle size={14} style={{ color: '#f97316' }} />
        {t.nav.help ?? 'Ayuda'}
      </a>

    </div>
  );
}
