'use client';
import { useUnits } from '@/lib/units';

// Botón compacto para cambiar entre métrico e imperial.
// Uso: <UnitsToggle /> — se puede poner en cualquier header.
export function UnitsToggle() {
  const { units, toggle } = useUnits();

  return (
    <button
      onClick={toggle}
      className="text-xs px-2.5 py-1 rounded-md border font-medium transition-colors"
      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'transparent' }}
      title={units === 'metric' ? 'Cambiar a imperial (mi, lb, °F)' : 'Cambiar a métrico (km, kg, °C)'}
    >
      {units === 'metric' ? 'km' : 'mi'}
    </button>
  );
}
