'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { T, type Lang } from './translations';

// Usamos typeof T['es'] como tipo canónico de las traducciones
type Translations = typeof T['es'];

interface LangCtx {
  lang:   Lang;
  toggle: () => void;
  t:      Translations;
}

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es');

  useEffect(() => {
    const saved = localStorage.getItem('racecopilot_lang') as Lang | null;
    if (saved === 'es' || saved === 'en') setLang(saved);
  }, []);

  const toggle = () => {
    setLang(prev => {
      const next: Lang = prev === 'es' ? 'en' : 'es';
      localStorage.setItem('racecopilot_lang', next);
      return next;
    });
  };

  return (
    <LangContext.Provider value={{ lang, toggle, t: T[lang] as unknown as Translations }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangCtx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
