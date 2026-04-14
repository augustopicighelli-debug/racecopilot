'use client';
import { useLang } from '@/lib/lang';

export function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      className="text-xs px-2.5 py-1 rounded-md border font-medium transition-colors"
      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'transparent' }}
      title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      {lang === 'es' ? 'ES' : 'EN'}
    </button>
  );
}
