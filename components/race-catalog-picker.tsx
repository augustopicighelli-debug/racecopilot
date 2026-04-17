'use client';
/**
 * RaceCatalogPicker — desplegable con todas las carreras del catálogo GPX.
 * - Al hacer foco muestra todas las carreras agrupadas por país
 * - Al tipear filtra en tiempo real (sin API calls — todo client-side)
 * - Los nombres no muestran el año
 * - Al final siempre aparece "Mi carrera no figura"
 */
import { useState, useEffect, useRef } from 'react';

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
  onSelect: (race: CatalogRace) => void;
  onManual: () => void;
}

/** Quita el año (4 dígitos) del nombre para mostrarlo más limpio */
function stripYear(name: string): string {
  return name.replace(/\s+\d{4}/g, '').trim();
}

/** Agrupa las carreras por país */
function groupByCountry(races: CatalogRace[]): { country: string; races: CatalogRace[] }[] {
  const map = new Map<string, CatalogRace[]>();
  for (const r of races) {
    if (!map.has(r.country)) map.set(r.country, []);
    map.get(r.country)!.push(r);
  }
  return Array.from(map.entries()).map(([country, races]) => ({ country, races }));
}

/** Filtra por query contra nombre, ciudad y país (case-insensitive, sin tildes) */
function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function filterRaces(races: CatalogRace[], q: string): CatalogRace[] {
  const nq = normalize(q);
  return races.filter(r =>
    normalize(r.name).includes(nq) ||
    normalize(r.city ?? '').includes(nq) ||
    normalize(r.country).includes(nq)
  );
}

export default function RaceCatalogPicker({ onSelect, onManual }: Props) {
  const [allRaces, setAllRaces]   = useState<CatalogRace[]>([]);
  const [query, setQuery]         = useState('');
  const [open, setOpen]           = useState(false);
  const [loadError, setLoadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar catálogo completo una sola vez al montar
  useEffect(() => {
    fetch('/api/gpx/catalog')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: CatalogRace[]) => setAllRaces(data))
      .catch(() => setLoadError(true));
  }, []);

  const handleSelect = (r: CatalogRace) => {
    setQuery(stripYear(r.name));
    setOpen(false);
    onSelect(r);
  };

  const handleManual = () => {
    setOpen(false);
    onManual();
  };

  // Calcular qué mostrar en el dropdown
  const filtered = query.length >= 1 ? filterRaces(allRaces, query) : allRaces;
  const groups   = groupByCountry(filtered);

  return (
    <div className="mb-5 relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={loadError ? 'Error cargando catálogo' : 'Buscar carrera... ej: Mendoza, Boston, Lima'}
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          autoComplete="off"
        />
        {/* Indicador de carga */}
        {allRaces.length === 0 && !loadError && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            ...
          </span>
        )}
        {/* Flecha desplegable */}
        {allRaces.length > 0 && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setOpen(o => !o); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && allRaces.length > 0 && (
        <div
          className="absolute z-20 w-full mt-1 rounded-lg border shadow-lg overflow-y-auto"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', maxHeight: '320px' }}
        >
          {groups.length === 0 && (
            <p className="px-3 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Sin resultados para "{query}"
            </p>
          )}

          {groups.map(({ country, races }) => (
            <div key={country}>
              {/* Encabezado de país */}
              <p
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide sticky top-0"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {country}
              </p>

              {races.map(r => (
                <button
                  key={r.slug}
                  type="button"
                  onMouseDown={() => handleSelect(r)}
                  className="w-full px-3 py-2.5 text-left hover:bg-orange-500/10 transition-colors border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {stripYear(r.name)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {r.city && `${r.city} · `}{r.distance_km} km
                    {r.gain_m ? ` · +${r.gain_m}m` : ''}
                    {r.loss_m ? ` −${r.loss_m}m` : ''}
                  </p>
                </button>
              ))}
            </div>
          ))}

          {/* Opción fija: cargar manualmente */}
          <button
            type="button"
            onMouseDown={handleManual}
            className="w-full px-3 py-3 text-left hover:bg-orange-500/10 transition-colors flex items-center gap-2 border-t"
            style={{ borderColor: 'var(--border)' }}
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
