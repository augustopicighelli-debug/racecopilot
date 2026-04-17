/**
 * Integración con Open-Meteo (API gratuita, sin API key).
 * Dos endpoints:
 *   - Geocoding: convierte ciudad → lat/lon
 *   - Forecast: devuelve datos horarios para una fecha específica
 *   - Archive: datos históricos para fechas fuera del forecast (>16 días)
 */

import type { AggregatedWeather } from '@/lib/engine/types';

const MAX_FORECAST_DAYS = 16;
const HISTORICAL_YEARS  = 5;

const NEUTRAL_WEATHER: AggregatedWeather = {
  temperature:      12,
  humidity:         50,
  windSpeedKmh:     0,
  windDirectionDeg: 0,
  sourcesCount:     0,
  sourceAgreement:  'low',
  daysUntilRace:    0,
};

interface GeocodingResult {
  results?: Array<{ latitude: number; longitude: number; name: string; country: string }>;
}

interface ForecastResponse {
  hourly?: {
    time:                  string[];
    temperature_2m:        number[];
    relative_humidity_2m:  number[];
    wind_speed_10m:        number[];
    wind_direction_10m:    number[];
  };
}

/**
 * Geocodifica una ciudad. Nunca cachea (errores de red no deben persistir).
 * Si falla con el nombre completo, reintenta con solo la primera parte (antes de la coma).
 */
async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  const tryGeocode = async (name: string) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=es`;
    try {
      const res = await fetch(url, { cache: 'no-store' }); // nunca cachear — un error no debe persistir 24h
      if (!res.ok) return null;
      const data: GeocodingResult = await res.json();
      if (!data.results?.length) return null;
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    } catch {
      return null;
    }
  };

  // Intento 1: ciudad tal como está ("Mendoza, AR", "Boston, MA", etc.)
  const result = await tryGeocode(city);
  if (result) return result;

  // Intento 2: solo la primera parte antes de la coma ("Mendoza", "Boston")
  const baseName = city.split(',')[0].trim();
  if (baseName !== city) return tryGeocode(baseName);

  return null;
}

/**
 * Forecast horario para una fecha (solo funciona dentro de 16 días).
 */
async function fetchForecastData(
  lat: number,
  lon: number,
  date: string
): Promise<ForecastResponse | null> {
  const params = new URLSearchParams({
    latitude:   String(lat),
    longitude:  String(lon),
    hourly:     'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
    timezone:   'auto',
    start_date: date,
    end_date:   date,
  });
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Datos históricos (archive) para el mismo día en años pasados.
 * Devuelve promedio de temp_min, temp_max y humedad del día.
 */
async function fetchHistoricalClimate(
  lat: number,
  lon: number,
  raceDate: string
): Promise<{ tempMin: number; tempMax: number; humidity: number } | null> {
  const [, month, day] = raceDate.split('-');
  const currentYear    = new Date().getFullYear();

  const allMin: number[] = [];
  const allMax: number[] = [];
  const allHum: number[] = [];

  await Promise.all(
    Array.from({ length: HISTORICAL_YEARS }, (_, i) => {
      const year    = currentYear - 1 - i;
      const date    = `${year}-${month}-${day}`;
      const params  = new URLSearchParams({
        latitude:   String(lat),
        longitude:  String(lon),
        daily:      'temperature_2m_min,temperature_2m_max,relative_humidity_2m_mean',
        timezone:   'auto',
        start_date: date,
        end_date:   date,
      });
      return fetch(
        `https://archive-api.open-meteo.com/v1/archive?${params}`,
        { next: { revalidate: 86400 } }  // histórico: cachear 24h (no cambia)
      )
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const min = data?.daily?.temperature_2m_min?.[0];
          const max = data?.daily?.temperature_2m_max?.[0];
          const hum = data?.daily?.relative_humidity_2m_mean?.[0];
          if (min != null && !isNaN(min)) allMin.push(min);
          if (max != null && !isNaN(max)) allMax.push(max);
          if (hum != null && !isNaN(hum)) allHum.push(hum);
        })
        .catch(() => {});
    })
  );

  if (allMin.length === 0) {
    console.warn(`[weather] histórico sin datos para ${raceDate} en ${lat},${lon}`);
    return null;
  }
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  return {
    tempMin:  Math.round(avg(allMin) * 10) / 10,
    tempMax:  Math.round(avg(allMax) * 10) / 10,
    humidity: Math.round(avg(allHum)),
  };
}

function avgAtIndices(values: number[], indices: number[]): number {
  const valid = indices.map(i => values[i]).filter(v => v !== undefined && !isNaN(v));
  return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : 0;
}

function findHourIndex(times: string[], date: string, hour: number): number {
  const target = `${date}T${String(hour).padStart(2, '0')}:00`;
  return times.findIndex(t => t === target);
}

export async function fetchWeather(
  city: string,
  raceDate: string,
  daysUntilRace: number
): Promise<AggregatedWeather> {
  const neutral: AggregatedWeather = { ...NEUTRAL_WEATHER, daysUntilRace };

  try {
    // 1. Geocodificar
    const coords = await geocodeCity(city);
    if (!coords) {
      console.warn(`[weather] geocoding falló para ciudad: "${city}"`);
      return neutral;
    }

    // 2. Carrera fuera del forecast en tiempo real → usar datos históricos
    if (daysUntilRace > MAX_FORECAST_DAYS) {
      const hist = await fetchHistoricalClimate(coords.lat, coords.lon, raceDate);
      if (!hist) return neutral;
      return {
        temperature:      hist.tempMin,
        temperatureEnd:   hist.tempMax,
        humidity:         hist.humidity,
        windSpeedKmh:     0,
        windDirectionDeg: 0,
        sourcesCount:     HISTORICAL_YEARS,
        sourceAgreement:  'low',
        daysUntilRace,
      };
    }

    // 3. Forecast en tiempo real — si falla (fecha fuera de rango u otro error), usar histórico
    const forecast = await fetchForecastData(coords.lat, coords.lon, raceDate);
    if (!forecast?.hourly) {
      console.warn(`[weather] forecast falló para ${raceDate}, intentando histórico`);
      const hist = await fetchHistoricalClimate(coords.lat, coords.lon, raceDate);
      if (!hist) return neutral;
      return {
        temperature:      hist.tempMin,
        temperatureEnd:   hist.tempMax,
        humidity:         hist.humidity,
        windSpeedKmh:     0,
        windDirectionDeg: 0,
        sourcesCount:     HISTORICAL_YEARS,
        sourceAgreement:  'low',
        daysUntilRace,
      };
    }

    const { time, temperature_2m, relative_humidity_2m, wind_speed_10m, wind_direction_10m } =
      forecast.hourly;

    // Índices de horas 7-10 (ventana de largada típica)
    const startIndices: number[] = [];
    for (let h = 7; h <= 10; h++) {
      const idx = findHourIndex(time, raceDate, h);
      if (idx !== -1) startIndices.push(idx);
    }

    if (startIndices.length === 0) {
      console.warn(`[weather] no se encontraron horas 7-10 para ${raceDate} — times[0]: ${time[0]}`);
      return neutral;
    }

    const tempStart = avgAtIndices(temperature_2m,       startIndices);
    const humidity  = avgAtIndices(relative_humidity_2m, startIndices);
    const windSpeed = avgAtIndices(wind_speed_10m,       startIndices);
    const windDir   = avgAtIndices(wind_direction_10m,   startIndices);

    // Temperatura al final: hora inicio + duración estimada (2h para corredores promedio)
    const endHourEst = 7 + 2;
    const endIdx     = findHourIndex(time, raceDate, endHourEst);
    const tempEnd    = endIdx !== -1 ? temperature_2m[endIdx] : undefined;

    return {
      temperature:      Math.round(tempStart * 10) / 10,
      temperatureEnd:   tempEnd !== undefined ? Math.round(tempEnd * 10) / 10 : undefined,
      humidity:         Math.round(humidity),
      windSpeedKmh:     Math.round(windSpeed * 10) / 10,
      windDirectionDeg: Math.round(windDir),
      sourcesCount:     1,
      sourceAgreement:  daysUntilRace <= 7 ? 'high' : 'medium',
      daysUntilRace,
    };
  } catch (err) {
    console.error('[weather] error inesperado:', err);
    return neutral;
  }
}
