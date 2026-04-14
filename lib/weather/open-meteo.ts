/**
 * Integración con Open-Meteo (API gratuita, sin API key).
 * Dos endpoints:
 *   - Geocoding: convierte ciudad → lat/lon
 *   - Forecast: devuelve datos horarios para una fecha específica
 */

import type { AggregatedWeather } from '@/lib/engine/types';

// Límite máximo de días que soporta el plan gratuito de Open-Meteo
const MAX_FORECAST_DAYS = 16;

// Clima neutral de fallback: condiciones benignas para no distorsionar el plan
const NEUTRAL_WEATHER: AggregatedWeather = {
  temperature:      12,
  humidity:         50,
  windSpeedKmh:     0,
  windDirectionDeg: 0,
  sourcesCount:     0,
  sourceAgreement:  'low',
  daysUntilRace:    0, // se sobreescribe antes de devolver
};

// Respuesta del endpoint de geocoding
interface GeocodingResult {
  results?: Array<{
    latitude:  number;
    longitude: number;
    name:      string;
    country:   string;
  }>;
}

// Respuesta del endpoint de forecast (solo los campos que usamos)
interface ForecastResponse {
  hourly?: {
    time:                   string[];  // ISO datetime: "2025-06-15T07:00"
    temperature_2m:         number[];
    relative_humidity_2m:   number[];
    wind_speed_10m:         number[];
    wind_direction_10m:     number[];
  };
}

/**
 * Obtiene coordenadas (lat/lon) para una ciudad usando Open-Meteo Geocoding.
 * Devuelve null si no encuentra resultados.
 */
async function geocodeCity(
  city: string
): Promise<{ lat: number; lon: number } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es`;

  const res = await fetch(url, { next: { revalidate: 86400 } }); // cachear 24h
  if (!res.ok) return null;

  const data: GeocodingResult = await res.json();

  if (!data.results || data.results.length === 0) return null;

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
  };
}

/**
 * Obtiene el pronóstico horario para una fecha y coordenadas dadas.
 * Devuelve null si la petición falla.
 */
async function fetchForecastData(
  lat: number,
  lon: number,
  date: string  // formato YYYY-MM-DD
): Promise<ForecastResponse | null> {
  const params = new URLSearchParams({
    latitude:  String(lat),
    longitude: String(lon),
    hourly:    'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
    timezone:  'auto',
    start_date: date,
    end_date:   date,
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 3600 } }); // cachear 1h
  if (!res.ok) return null;

  const data: ForecastResponse = await res.json();
  return data;
}

/**
 * Calcula el promedio de un array numérico para los índices dados.
 * Filtra NaN para no contaminar el promedio.
 */
function avgAtIndices(values: number[], indices: number[]): number {
  const valid = indices
    .map(i => values[i])
    .filter(v => v !== undefined && !isNaN(v));

  if (valid.length === 0) return 0;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/**
 * Busca el índice en el array `times` que corresponde a una hora HH:00 dada.
 * Open-Meteo devuelve strings tipo "2025-06-15T07:00".
 */
function findHourIndex(times: string[], date: string, hour: number): number {
  const target = `${date}T${String(hour).padStart(2, '0')}:00`;
  return times.findIndex(t => t === target);
}

/**
 * Obtiene el clima real desde Open-Meteo para la ciudad y fecha de la carrera.
 *
 * @param city          - Nombre de la ciudad (campo `city` de la carrera)
 * @param raceDate      - Fecha de la carrera en formato YYYY-MM-DD
 * @param daysUntilRace - Días que faltan para la carrera (ya calculado en la ruta)
 * @returns AggregatedWeather completo, o clima neutral si algo falla
 */
export async function fetchWeather(
  city: string,
  raceDate: string,
  daysUntilRace: number
): Promise<AggregatedWeather> {
  // Base del objeto neutral con los días ya calculados
  const neutral: AggregatedWeather = { ...NEUTRAL_WEATHER, daysUntilRace };

  // Si la carrera supera el límite del plan gratuito, no hay datos disponibles
  if (daysUntilRace > MAX_FORECAST_DAYS) {
    return neutral;
  }

  try {
    // 1. Geocodificar la ciudad
    const coords = await geocodeCity(city);
    if (!coords) return neutral;

    // 2. Obtener el pronóstico horario para la fecha de la carrera
    const forecast = await fetchForecastData(coords.lat, coords.lon, raceDate);
    if (!forecast?.hourly) return neutral;

    const { time, temperature_2m, relative_humidity_2m, wind_speed_10m, wind_direction_10m } =
      forecast.hourly;

    // 3. Determinar índices de las horas 7-10 (ventana de largada típica mañana)
    const startHour = 7;
    const endHour   = 10; // inclusive
    const startIndices: number[] = [];

    for (let h = startHour; h <= endHour; h++) {
      const idx = findHourIndex(time, raceDate, h);
      if (idx !== -1) startIndices.push(idx);
    }

    if (startIndices.length === 0) return neutral;

    // 4. Temperatura al inicio: promedio de horas 7-10
    const tempStart = avgAtIndices(temperature_2m, startIndices);
    const humidity  = avgAtIndices(relative_humidity_2m, startIndices);
    const windSpeed = avgAtIndices(wind_speed_10m, startIndices);

    // 5. Dirección del viento: promedio simple (funciona para rangos sin cruce 0°/360°)
    const windDir = avgAtIndices(wind_direction_10m, startIndices);

    // 6. Temperatura al final: hora inicio + 2h como estimación (sin duración disponible)
    const endHourEst = startHour + 2; // 7h + 2 = 9h → razonable para carrera de mañana
    const endIdx     = findHourIndex(time, raceDate, endHourEst);
    const tempEnd    = endIdx !== -1 ? temperature_2m[endIdx] : undefined;

    return {
      temperature:      Math.round(tempStart * 10) / 10,
      temperatureEnd:   tempEnd !== undefined ? Math.round(tempEnd * 10) / 10 : undefined,
      humidity:         Math.round(humidity),
      windSpeedKmh:     Math.round(windSpeed * 10) / 10,
      windDirectionDeg: Math.round(windDir),
      sourcesCount:     1,
      // Alta confianza si la carrera es dentro del rango confiable (~7 días)
      sourceAgreement:  daysUntilRace <= 7 ? 'high' : 'medium',
      daysUntilRace,
    };
  } catch {
    // Cualquier error de red o parsing → clima neutral sin romper el plan
    return neutral;
  }
}
