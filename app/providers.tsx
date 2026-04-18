'use client';
import { UnitsProvider } from '@/lib/units';
import { LangProvider } from '@/lib/lang';
import { Navbar } from '@/components/navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <UnitsProvider>
        {/* Navbar global fija — visible en todas las páginas, oculta en impresión */}
        <Navbar />
        {/* pt-14 compensa la altura fija del Navbar (h-14 = 56px) */}
        <div className="pt-14">{children}</div>
      </UnitsProvider>
    </LangProvider>
  );
}
