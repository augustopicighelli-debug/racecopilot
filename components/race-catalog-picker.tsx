'use client';
/**
 * RaceCatalogPicker — buscador de carreras pre-cargadas del catálogo GPX.
 * Muestra dos slots: "Carrera conocida" (catálogo) y "Manual".
 * Al seleccionar una carrera del catálogo llama a onSelect con los datos.
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
  /** Modo activo al montar. 'catalog' muestra la búsqueda; 'manual' la oculta. */
  defaultMode?: 'catalog' | 'manual';
  onSelect: (race: CatalogRace) => void;
  onManual: () => void;
}

export default function RaceCatalogPicker({ defaultMode = 'catalog', onSelect, onManual }: Props) {
  const [mode, setMode]           = useState<'catalog' | 'manual'>(defaultMode);
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<CatalogRace[]>([]);
  const [loading, setLoading]     = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (q: string) => {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/gpx/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
      setLoading(false);
    }, 300);
  };

  const handleSelect = (r: CatalogRace) => {
    onSelect(r);
    setQuery(r.name);
    setResults([]);
  };

  const handleManual = () => {
    setMode('manual');
    onManual();
  };

  return (
    <div className="mb-5">
      {/* Selector de modo */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button type="button" onClick={() => setMode('catalog')}
          className="py-3 px-4 rounded-xl border text-sm font-semibold transition-colors text-left"
          style={{
            background:  mode === 'catalog' ? 'rgba(249,115,22,0.12)' : 'var(--muted)',
            borderColor: mode === 'catalog' ? 'rgba(249,115,22,0.5)'  : 'var(--border)',
            color:       mode === 'catalog' ? '#f97316'               : 'var(--muted-foreground)',
          }}>
          <p className="font-semibold">Carrera conocida</p>
          <p className="text-xs mt-0.5 opacity-70 font-normal">Buscar en catálogo</p>
        </button>
        <button type="button" onClick={handleManual}
          className="py-3 px-4 rounded-xl border text-sm font-semibold transition-colors text-left"
          style={{
            background:  mode === 'manual' ? 'rgba(249,115,22,0.12)' : 'var(--muted)',
            borderColor: mode === 'manual' ? 'rgba(249,115,22,0.5)'  : 'var(--border)',
            color:       mode === 'manual' ? '#f97316'               : 'var(--muted-foreground)',
          }}>
          <p className="font-semibold">Cargar manualmente</p>
          <p className="text-xs mt-0.5 opacity-70 font-normal">Ingresar mis datos</p>
        </button>
      </div>

      {/* Búsqueda en catálogo */}
      {mode === 'catalog' && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Buscar carrera... ej: Mendoza, Santiago, Lima"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            autoFocus
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              ...
            </span>
          )}
          {results.length > 0 && (
            <div className="mt-1 rounded-lg border overflow-hidden"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {results.map((r) => (
                <button key={r.slug} type="button" onClick={() => handleSelect(r)}
                  className="w-full px-3 py-3 text-left hover:bg-orange-500/10 transition-colors border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{r.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {r.city && `${r.city} · `}{r.distance_km} km
                    {r.gain_m ? ` · +${r.gain_m}m` : ''}
                    {r.loss_m ? ` -${r.loss_m}m` : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
          {query.length >= 2 && !loading && results.length === 0 && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--muted-foreground)' }}>
              Sin resultados — usá "Cargar manualmente"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
