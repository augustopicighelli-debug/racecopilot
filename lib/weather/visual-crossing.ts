/**
 * Integración con Visual Crossing Weather API.
 * Licencia free: 1000 records/día con uso comercial permitido.
 * Documentación: https://www.visualcrossing.com/resources/documentation/weather-api/timeline-weather-api/
 *
 * Un "record" = 1 día de datos para 1 ubicación.
 * El mismo endpoint maneja forecast (hasta 15 días) e histórico.
 * La ciudad se resuelve directamente — no hace falta geocoding separado.
 *
 * Requiere env var: VISUAL_CROSSING_API_KEY
 */

import type { AggregatedWeather } from '@/lib/engine/types';

const BASE_URL      = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';
const MAX_FORECAST_DAYS = 14; // VC no devuelve datos horarios para el día 15 exacto
const HISTORICAL_YEARS  = 5;
const START_HOURS       = [7, 8, 9, 10]; // ventana de largada típica
const START_HOUR        = 8;             // hora de largada para calcular temperatureEnd

const NEUTRAL_WEATHER: AggregatedWeather = {
  temperature:      12,
  humidity:         50,
  windSpeedKmh:     0,
  windDirectionDeg: 0,
  sourcesCount:     0,
  sourceAgreement:  'low',
  daysUntilRace:    0,
};

interface VCHour {
  datetime?:  string; // "HH:MM:SS" — opcional, puede no venir en histórico
  hour?:      number; // índice 0-23 — agregado por fetchDayData
  temp:       number;
  humidity:   number;
  windspeed:  number;
  winddir:    number;
}

interface VCResponse {
  days?: Array<{ hours?: VCHour[] }>;
}

/**
 * Llama a la Timeline API para una ciudad y una fecha (pasada o futura).
 * revalidate: segundos de caché de Next.js (histórico se cachea más que forecast).
 */
async function fetchDayData(city: string, date: string, revalidate: number): Promise<VCHour[] | null> {
  const apiKey = process.env.VISUAL_CROSSING_API_KEY;
  if (!apiKey) {
    console.error('[weather] VISUAL_CROSSING_API_KEY no configurada');
    return null;
  }

  const params = new URLSearchParams({
    key:       apiKey,
    include:   'hours',
    unitGroup: 'metric', // temperatura en °C, viento en km/h
    elements:  'temp,humidity,windspeed,winddir',
  });

  const url = `${BASE_URL}/${encodeURIComponent(city)}/${date}?${params}`;

  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) {
      console.warn(`[weather] Visual Crossing HTTP ${res.status} para ${city} ${date}`);
      return null;
    }
    const data: VCResponse = await res.json();
    const hours = data.days?.[0]?.hours;
    if (!hours) return null;
    // Agregar índice de hora (0-23) ya que VC no lo incluye en horas
    return hours.map((h, idx) => ({ ...h, hour: idx }));
  } catch (err) {
    console.warn(`[weather] fetchDayData error ${city} ${date}:`, err);
    return null;
  }
}

/**
 * Promedia un campo numérico de las horas que estén en targetHours.
 * Nota: VCHour puede tener 'hour' (índice) o 'datetime' (timestamp).
 */
function avgAtHours(
  hours: (VCHour & { hour?: number })[],
  targetHours: number[],
  key: 'temp' | 'humidity' | 'windspeed' | 'winddir'
): number {
  const vals = hours
    .filter(h => {
      const hourNum = h.hour !== undefined ? h.hour : parseInt(h.datetime);
      return targetHours.includes(hourNum);
    })
    .map(h => h[key])
    .filter((v): v is number => !isNaN(v));
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
}

/**
 * Devuelve el número de hora de un string "HH:MM:SS".
 */
function hourOf(datetime: string): number {
  return parseInt(datetime.split(':')[0]);
}

/**
 * Cuando el forecast falla o la carrera supera MAX_FORECAST_DAYS,
 * promedia los datos del mismo día en HISTORICAL_YEARS años anteriores.
 */
async function fetchHistoricalAvg(
  city: string,
  raceDate: string,
  daysUntilRace: number,
  raceDurationSeconds?: number
): Promise<AggregatedWeather | null> {
  const [, month, day] = raceDate.split('-');
  const currentYear    = new Date().getFullYear();

  const results = await Promise.all(
    Array.from({ length: HISTORICAL_YEARS }, (_, i) => {
      const year = currentYear - 1 - i;
      return fetchDayData(city, `${year}-${month}-${day}`, 86400); // histórico: cachear 24h
    })
  );

  const validResults = results.filter(Boolean) as VCHour[][];
  if (validResults.length === 0) return null;

  // Combinar horas de todos los años y promediar por franja de largada.
  // VC no devuelve datetime en hours[], solo temperatura/humedad por índice (0-23).
  const allHours = validResults.flatMap((hrs, yearIdx) =>
    hrs.map((h, idx) => ({ ...h, hour: idx })) // índice 0-23 = horas del día
  );
  const tempStart  = avgAtHours(allHours, START_HOURS, 'temp');
  const humidity   = avgAtHours(allHours, START_HOURS, 'humidity');

  // temperatureEnd: hora de llegada estimada
  const durationHours = raceDurationSeconds ? raceDurationSeconds / 3600 : 2;
  const endHour       = Math.min(Math.round(START_HOUR + durationHours), 16);
  const endTemps      = validResults
    .map(hrs => hrs[endHour]?.temp) // índice directo del array
    .filter((v): v is number => v !== undefined);
  const tempEnd = endTemps.length
    ? endTemps.reduce((s, v) => s + v, 0) / endTemps.length
    : undefined;

  return {
    temperature:      Math.round(tempStart * 10) / 10,
    temperatureEnd:   tempEnd !== undefined ? Math.round(tempEnd * 10) / 10 : undefined,
    humidity:         Math.round(humidity),
    windSpeedKmh:     0, // histórico no tiene viento fiable
    windDirectionDeg: 0,
    sourcesCount:     validResults.length,
    sourceAgreement:  'low',
    daysUntilRace,
  };
}

/**
 * Punto de entrada principal — misma firma que open-meteo.ts.
 * Mantiene la interfaz AggregatedWeather sin cambios para el engine.
 */
export async function fetchWeather(
  city: string,
  raceDate: string,
  daysUntilRace: number,
  raceDurationSeconds?: number
): Promise<AggregatedWeather> {
  const neutral: AggregatedWeather = { ...NEUTRAL_WEATHER, daysUntilRace };

  try {
    // ── Carrera lejana: usar promedio histórico del mismo día en años pasados ──
    if (daysUntilRace > MAX_FORECAST_DAYS) {
      const hist = await fetchHistoricalAvg(city, raceDate, daysUntilRace, raceDurationSeconds);
      return hist ?? neutral;
    }

    // ── Carrera dentro del forecast (≤ 15 días) ──
    const hours = await fetchDayData(city, raceDate, 3600); // cachear 1h: forecast cambia

    // Si el forecast falla (edge case: fecha fuera de rango, ciudad no encontrada), usar histórico
    if (!hours || hours.length === 0) {
      console.warn(`[weather] forecast falló para ${city} ${raceDate}, intentando histórico`);
      const hist = await fetchHistoricalAvg(city, raceDate, daysUntilRace, raceDurationSeconds);
      return hist ?? neutral;
    }

    const tempStart = avgAtHours(hours, START_HOURS, 'temp');
    const humidity  = avgAtHours(hours, START_HOURS, 'humidity');
    const windSpeed = avgAtHours(hours, START_HOURS, 'windspeed');
    const windDir   = avgAtHours(hours, START_HOURS, 'winddir');

    // Temps horarios horas 5-23 para que el engine calcule temperatureEnd
    // según la duración real de cada plan (largada fija a las 8h).
    const hourlyTemps = hours
      .filter(h => {
        const hr = h.hour !== undefined ? h.hour : hourOf(h.datetime!);
        return hr >= 5 && hr <= 23;
      })
      .map(h => ({
        hour: h.hour !== undefined ? h.hour : hourOf(h.datetime!),
        tempC: Math.round(h.temp * 10) / 10
      }));

    // temperatureEnd estimado con la duración de la carrera
    const durationHours = raceDurationSeconds ? raceDurationSeconds / 3600 : 2;
    const endHour       = Math.min(Math.round(START_HOUR + durationHours), 23); // 0-23, no limitar a 16
    const endEntry      = hourlyTemps.find(e => e.hour === endHour);
    if (!endEntry) {
      console.warn(`[weather] endHour ${endHour} not in hourlyTemps:`, hourlyTemps.map(h => h.hour));
    }

    return {
      temperature:      Math.round(tempStart * 10) / 10,
      temperatureEnd:   endEntry?.tempC,
      humidity:         Math.round(humidity),
      windSpeedKmh:     Math.round(windSpeed * 10) / 10,
      windDirectionDeg: Math.round(windDir),
      sourcesCount:     1,
      sourceAgreement:  daysUntilRace <= 7 ? 'high' : 'medium',
      daysUntilRace,
      hourlyTemps,
    };
  } catch (err) {
    console.error('[weather] error inesperado:', err);
    return neutral;
  }
}
