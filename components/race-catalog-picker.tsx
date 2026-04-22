'use client';
/**
 * RaceCatalogPicker — desplegable con todas las carreras del catálogo GPX.
 * - Agrupa carreras por nombre (sin año) → una sola entrada por evento
 * - Si un evento tiene múltiples distancias, las muestra como sub-opciones
 * - Filtra en tiempo real client-side
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

/** Quita el año (4 dígitos) del nombre */
function stripYear(name: string): string {
  return name.replace(/\s+\d{4}/g, '').trim();
}

/** Normaliza para comparación (sin tildes, minúsculas) */
function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Filtra por query contra nombre, ciudad y país */
function filterRaces(races: CatalogRace[], q: string): CatalogRace[] {
  const nq = normalize(q);
  return races.filter(r =>
    normalize(r.name).includes(nq) ||
    normalize(r.city ?? '').includes(nq) ||
    normalize(r.country).includes(nq)
  );
}

/** Label legible de distancia */
function distLabel(km: number): string {
  if (Math.abs(km - 42.195) < 0.5) return 'Maratón';
  if (Math.abs(km - 21.1) < 0.3)   return 'Media';
  if (Math.abs(km - 10) < 0.3)     return '10K';
  if (Math.abs(km - 5) < 0.3)      return '5K';
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`;
}

/**
 * Agrupa carreras por (country, canonicalName) → un evento = una entrada.
 * Dentro de cada entrada, las distintas distancias quedan como sub-opciones.
 * Si hay duplicados con mismo nombre+distancia, queda solo uno (el primero, ya ordenado por DB).
 */
interface EventGroup {
  displayName: string;
  country: string;
  city: string;
  options: CatalogRace[]; // una por distancia distinta
}

function groupEvents(races: CatalogRace[]): EventGroup[] {
  const map = new Map<string, EventGroup>();

  for (const r of races) {
    const display = stripYear(r.name);
    // Clave única por país + nombre canónico
    const key = `${r.country}||${normalize(display)}`;

    if (!map.has(key)) {
      map.set(key, { displayName: display, country: r.country, city: r.city, options: [] });
    }

    const group = map.get(key)!;
    // Evitar duplicados por la misma distancia
    const alreadyHasDist = group.options.some(
      o => Math.abs(o.distance_km - r.distance_km) < 0.1
    );
    if (!alreadyHasDist) {
      group.options.push(r);
    }
  }

  // Ordenar distancias de mayor a menor dentro de cada evento
  for (const g of map.values()) {
    g.options.sort((a, b) => b.distance_km - a.distance_km);
  }

  return Array.from(map.values());
}

/** Agrupa eventos por país */
function groupByCountry(events: EventGroup[]): { country: string; events: EventGroup[] }[] {
  const map = new Map<string, EventGroup[]>();
  for (const e of events) {
    if (!map.has(e.country)) map.set(e.country, []);
    map.get(e.country)!.push(e);
  }
  return Array.from(map.entries()).map(([country, events]) => ({ country, events }));
}

export default function RaceCatalogPicker({ onSelect, onManual }: Props) {
  const [allRaces, setAllRaces]     = useState<CatalogRace[]>([]);
  const [query, setQuery]           = useState('');
  const [open, setOpen]             = useState(false);
  const [loadError, setLoadError]   = useState(false);
  // Evento expandido (para mostrar sub-opciones de distancia)
  const [expanded, setExpanded]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/gpx/catalog')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: CatalogRace[]) => setAllRaces(data))
      .catch(() => setLoadError(true));
  }, []);

  const handleSelect = (r: CatalogRace) => {
    setQuery(stripYear(r.name));
    setOpen(false);
    setExpanded(null);
    onSelect(r);
  };

  const handleManual = () => {
    setOpen(false);
    setExpanded(null);
    onManual();
  };

  const filtered  = query.length >= 1 ? filterRaces(allRaces, query) : allRaces;
  const events    = groupEvents(filtered);
  const countries = groupByCountry(events);

  const inputStyle = { background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div className="mb-5 relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setExpanded(null); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => { setOpen(false); setExpanded(null); }, 150)}
          placeholder={loadError ? 'Error cargando catálogo' : 'Buscar carrera... ej: Mendoza, Boston, Lima'}
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
          style={inputStyle}
          autoComplete="off"
        />
        {allRaces.length === 0 && !loadError && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            ...
          </span>
        )}
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

      {open && allRaces.length > 0 && (
        <div
          className="absolute z-20 w-full mt-1 rounded-lg border shadow-lg overflow-y-auto"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', maxHeight: '320px' }}
        >
          {events.length === 0 && (
            <p className="px-3 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Sin resultados para "{query}"
            </p>
          )}

          {countries.map(({ country, events }) => (
            <div key={country}>
              <p
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide sticky top-0"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {country}
              </p>

              {events.map(ev => {
                const key = `${ev.country}||${normalize(ev.displayName)}`;
                const isExpanded = expanded === key;
                const onlyOne    = ev.options.length === 1;

                return (
                  <div key={key}>
                    {/* Entrada principal del evento */}
                    <button
                      type="button"
                      onMouseDown={() => {
                        if (onlyOne) {
                          handleSelect(ev.options[0]);
                        } else {
                          // Expandir / colapsar distancias
                          setExpanded(isExpanded ? null : key);
                        }
                      }}
                      className="w-full px-3 py-2.5 text-left hover:bg-orange-500/10 transition-colors border-b"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {ev.displayName}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                            {ev.city && `${ev.city} · `}
                            {onlyOne
                              ? `${ev.options[0].distance_km} km${ev.options[0].gain_m ? ` · +${ev.options[0].gain_m}m` : ''}`
                              : ev.options.map(o => distLabel(o.distance_km)).join(' · ')
                            }
                          </p>
                        </div>
                        {!onlyOne && (
                          <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Sub-opciones de distancia (solo si hay más de 1) */}
                    {!onlyOne && isExpanded && ev.options.map(r => (
                      <button
                        key={r.slug}
                        type="button"
                        onMouseDown={() => handleSelect(r)}
                        className="w-full px-3 py-2 text-left hover:bg-orange-500/10 transition-colors border-b"
                        style={{ borderColor: 'var(--border)', background: 'rgba(249,115,22,0.04)', paddingLeft: '32px' }}
                      >
                        <p className="text-sm font-semibold" style={{ color: '#f97316' }}>
                          {distLabel(r.distance_km)}
                          <span className="font-normal ml-1.5" style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>
                            {r.distance_km} km{r.gain_m ? ` · +${r.gain_m}m` : ''}{r.loss_m ? ` −${r.loss_m}m` : ''}
                          </span>
                        </p>
                      </button>
                    ))}
                  </div>
                );
              })}
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
