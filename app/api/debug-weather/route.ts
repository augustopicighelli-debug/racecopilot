import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.VISUAL_CROSSING_API_KEY;
  const city = 'Mendoza';
  const date = '2026-05-03';

  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}/${date}?key=${apiKey}&include=hours&unitGroup=metric&elements=temp,humidity,windspeed,winddir`;

  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  const hours = data.days?.[0]?.hours;

  // Simular exactamente lo que hace fetchDayData
  const processed = hours?.map((h: any, idx: number) => ({ ...h, hour: idx }));

  // Simular avgAtHours para horas 7-10
  const START_HOURS = [7, 8, 9, 10];
  const filtered = processed?.filter((h: any) => {
    const hourNum = h.hour !== undefined ? h.hour : parseInt(h.datetime);
    return START_HOURS.includes(hourNum);
  });

  const temps = filtered?.map((h: any) => h.temp);
  const avgTemp = temps?.length ? temps.reduce((s: number, v: number) => s + v, 0) / temps.length : 0;

  return NextResponse.json({
    httpStatus: res.status,
    hoursCount: hours?.length ?? 'NO HOURS',
    processedSample: processed?.slice(7, 11),
    filteredForStartHours: filtered,
    avgTemp,
    error: data.error,
  });
}
