'use client';
import { UnitsProvider } from '@/lib/units';
import { LangProvider } from '@/lib/lang';
import { TopControls } from '@/components/top-controls';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <UnitsProvider>
        {/* Barra fija con toggles de idioma y unidades — visible en todas las páginas */}
        <TopControls />
        {children}
      </UnitsProvider>
    </LangProvider>
  );
}
