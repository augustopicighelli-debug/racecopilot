'use client';
/**
 * RaceCatalogPicker — buscador de carreras del catálogo GPX.
 * Muestra un input de búsqueda con dropdown de resultados.
 * Al final del dropdown siempre aparece "Mi carrera no figura" para activar el modo manual.
 */
import { useState, useRef } from 'react';

export interface CatalogRace {
  slug: string;
  name: string;
  country: string;
  city: string;
  distance_km: number;
  gain_m: number;
  loss_m: number;
}

interface Props {
  /** Llamado cuando el usuario elige una carrera del catálogo */
  onSelect: (race: CatalogRace) => void;
  /** Llamado cuando el usuario elige "mi carrera no figura" */
  onManual: () => void;
}

export default function RaceCatalogPicker({ onSelect, onManual }: Props) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<CatalogRace[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (q: string) => {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    // Mostrar el dropdown apenas el usuario empiece a escribir
    setOpen(true);
    if (q.length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/gpx/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
      setLoading(false);
    }, 300);
  };

  const handleSelect = (r: CatalogRace) => {
    // Prellenar el input con el nombre de la carrera seleccionada
    setQuery(r.name);
    setResults([]);
    setOpen(false);
    onSelect(r);
  };

  const handleManual = () => {
    setOpen(false);
    onManual();
  };

  const handleBlur = () => {
    // Delay para permitir que los clicks en el dropdown se procesen antes de cerrarlo
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="mb-5 relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder="Buscar carrera... ej: Mendoza, Boston, Lima"
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          autoComplete="off"
        />
        {/* Indicador de carga */}
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            ...
          </span>
        )}
      </div>

      {/* Dropdown de resultados */}
      {open && (
        <div
          className="absolute z-20 w-full mt-1 rounded-lg border shadow-lg overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Resultados del catálogo */}
          {results.map((r) => (
            <button
              key={r.slug}
              type="button"
              onMouseDown={() => handleSelect(r)}
              className="w-full px-3 py-3 text-left hover:bg-orange-500/10 transition-colors border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{r.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {r.city && `${r.city} · `}{r.distance_km} km
                {r.gain_m ? ` · +${r.gain_m}m` : ''}
                {r.loss_m ? ` −${r.loss_m}m` : ''}
              </p>
            </button>
          ))}

          {/* Mensaje cuando no hay resultados pero se buscó algo */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <p className="px-3 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Sin resultados para "{query}"
            </p>
          )}

          {/* Opción siempre visible: cargar manualmente */}
          <button
            type="button"
            onMouseDown={handleManual}
            className="w-full px-3 py-3 text-left hover:bg-orange-500/10 transition-colors flex items-center gap-2"
          >
            <span className="text-base">✏️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#f97316' }}>
                Mi carrera no figura
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Ingresar ciudad, distancia y desnivel manualmente
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
