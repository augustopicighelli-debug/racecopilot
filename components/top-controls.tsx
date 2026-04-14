'use client';
import { LangToggle } from './lang-toggle';
import { UnitsToggle } from './units-toggle';

// Barra fija en la parte superior — aparece en todas las páginas.
// Muestra los toggles de idioma y unidades de medida.
export function TopControls() {
  return (
    <div
      className="fixed top-0 right-0 z-50 flex items-center gap-1.5 px-3 py-1.5 no-print"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        borderBottomLeftRadius: '0.5rem',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <LangToggle />
      <UnitsToggle />
    </div>
  );
}
