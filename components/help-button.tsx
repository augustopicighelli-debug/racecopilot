'use client';

import { MessageCircle } from 'lucide-react';
import { useLang } from '@/lib/lang';

export function HelpButton() {
  const { t } = useLang();

  return (
    <a
      href={`mailto:hola@racecopilot.com?subject=${encodeURIComponent(t.nav.helpSubject ?? 'Ayuda')}`}
      className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-xs font-semibold transition-opacity hover:opacity-90"
      style={{
        background:   'var(--card)',
        border:       '1px solid var(--border)',
        color:        'var(--foreground)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <MessageCircle size={14} style={{ color: '#f97316' }} />
      {t.nav.help ?? 'Ayuda'}
    </a>
  );
}
