// Funciones puras de formateo para carreras — sin dependencias de servidor.
// Importable desde client components sin romper el bundle del browser.

export function cleanSlug(slug: string): string {
  return slug.replace(/-20\d\d/g, '');
}

export function cleanName(name: string): string {
  return name.replace(/\s+20\d\d\b/g, '').trim();
}

export function distanceLabel(km: number, locale: 'es' | 'en'): string {
  if (Math.abs(km - 42.195) < 0.5) return locale === 'es' ? 'Maratón' : 'Marathon';
  if (Math.abs(km - 21.1)   < 0.3) return locale === 'es' ? 'Media Maratón' : 'Half Marathon';
  if (Math.abs(km - 10)     < 0.3) return '10K';
  if (Math.abs(km - 5)      < 0.3) return '5K';
  return `${km} km`;
}
