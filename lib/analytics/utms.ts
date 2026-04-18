// Helper para capturar y persistir UTMs del primer landing del usuario.
// Estos UTMs luego se atribuyen al signup / trial / paid en Supabase.
//
// Uso:
//   import { captureUTMs, getStoredUTMs } from '@/lib/analytics/utms';
//   useEffect(() => { captureUTMs(); }, []);
//
// Taxonomía estándar:
//   utm_source   = [reddit | instagram | tiktok | twitter | google | meta | direct | email]
//   utm_medium   = [organic | paid | social | email | referral]
//   utm_campaign = [seo-race-<slug> | content-<hook> | retargeting-v1 | onboarding-d0 | ...]

// Nombre de la key en localStorage donde persistimos los UTMs del primer touch
const UTM_STORAGE_KEY = 'rc_first_touch_utms';

// Lista de parámetros UTM estándar + algunos extras útiles (ref, gclid, fbclid)
const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ref',
  'gclid',
  'fbclid',
] as const;

// Tipo del objeto de UTMs capturados
export type UTMData = Partial<Record<(typeof UTM_PARAMS)[number], string>> & {
  // Primer landing page (útil para atribuir a una landing SEO específica)
  first_landing_page?: string;
  // Timestamp del primer touch
  first_touch_at?: string;
};

/**
 * Captura UTMs de la URL actual y los persiste en localStorage.
 * Solo lo hace la PRIMERA vez — no sobrescribe si ya hay data.
 * Esto mantiene la atribución al first-touch, no al last-touch.
 */
export function captureUTMs(): UTMData | null {
  // Solo funciona client-side (acceso a window)
  if (typeof window === 'undefined') return null;

  // Si ya capturamos UTMs antes, no sobrescribir (first-touch attribution)
  const existing = localStorage.getItem(UTM_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as UTMData;
    } catch {
      // Si el JSON está corrupto, lo reemplazamos abajo
    }
  }

  // Parsear la URL actual para extraer UTMs
  const params = new URLSearchParams(window.location.search);
  const data: UTMData = {};

  // Recorrer los params UTM conocidos y guardar los presentes
  for (const key of UTM_PARAMS) {
    const value = params.get(key);
    if (value) data[key] = value;
  }

  // Si no hay ningún UTM y no es tráfico direct, capturamos igual la landing
  if (Object.keys(data).length === 0) {
    // No hay UTMs — marcamos como "direct" con la landing page
    data.utm_source = 'direct';
    data.utm_medium = 'none';
  }

  // Agregar contexto adicional del first-touch
  data.first_landing_page = window.location.pathname;
  data.first_touch_at = new Date().toISOString();

  // Persistir en localStorage
  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data));

  return data;
}

/**
 * Devuelve los UTMs guardados del first-touch, o null si no hay.
 * Uso típico: al momento de hacer signup, mandar estos UTMs a Supabase.
 */
export function getStoredUTMs(): UTMData | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(UTM_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UTMData;
  } catch {
    // Si se rompió, limpiamos para no mandar basura
    localStorage.removeItem(UTM_STORAGE_KEY);
    return null;
  }
}

/**
 * Limpia los UTMs guardados (útil después de atribuir la conversión).
 * En general NO llamar — dejamos la atribución persistente para análisis posterior.
 */
export function clearStoredUTMs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(UTM_STORAGE_KEY);
}

/**
 * Genera un objeto de UTMs estándar para agregar a un link interno.
 * Útil para links en emails o posts sociales propios.
 *
 * Ejemplo:
 *   buildUTMs({ source: 'email', medium: 'lifecycle', campaign: 'onboarding-d3' })
 *   // → "?utm_source=email&utm_medium=lifecycle&utm_campaign=onboarding-d3"
 */
export function buildUTMs(params: {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
}): string {
  const search = new URLSearchParams();
  search.set('utm_source', params.source);
  search.set('utm_medium', params.medium);
  search.set('utm_campaign', params.campaign);
  if (params.content) search.set('utm_content', params.content);
  if (params.term) search.set('utm_term', params.term);
  return `?${search.toString()}`;
}
