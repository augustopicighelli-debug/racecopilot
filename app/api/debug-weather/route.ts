import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Replicar exactamente el flujo de fetchWeather para atrapar el error real
  const apiKey = process.env.VISUAL_CROSSING_API_KEY;
  const city = 'Mendoza';
  const date = '2026-05-03';
  const daysUntilRace = 14;
  const MAX_FORECAST_DAYS = 14;
  const START_HOURS = [7, 8, 9, 10];
  const START_HOUR = 8;

  const steps: string[] = [];

  try {
    steps.push(`step1: daysUntilRace=${daysUntilRace} > MAX=${MAX_FORECAST_DAYS}: ${daysUntilRace > MAX_FORECAST_DAYS}`);

    if (daysUntilRace > MAX_FORECAST_DAYS) {
      steps.push('→ historical path');
    } else {
      steps.push('→ forecast path');

      const params = new URLSearchParams({
        key: apiKey!,
        include: 'hours',
        unitGroup: 'metric',
        elements: 'temp,humidity,windspeed,winddir',
      });
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}/${date}?${params}`;

      steps.push(`step2: fetching ${url.replace(apiKey!, 'REDACTED')}`);
      const res = await fetch(url, { cache: 'no-store' });
      steps.push(`step3: status=${res.status}`);

      const data = await res.json();
      const rawHours = data.days?.[0]?.hours;
      steps.push(`step4: rawHours=${rawHours?.length ?? 'null'}`);

      if (!rawHours) {
        steps.push('→ no hours, would fallback to historical');
        return NextResponse.json({ steps, result: 'fallback' });
      }

      const hours = rawHours.map((h: any, idx: number) => ({ ...h, hour: idx }));
      steps.push(`step5: hours with index ok, sample hour7=${JSON.stringify(hours[7])}`);

      const filtered = hours.filter((h: any) => START_HOURS.includes(h.hour));
      steps.push(`step6: filtered for 7-10: count=${filtered.length}`);

      const avgTemp = filtered.map((h: any) => h.temp).reduce((s: number, v: number) => s + v, 0) / filtered.length;
      steps.push(`step7: avgTemp=${avgTemp}`);

      return NextResponse.json({ steps, result: 'forecast ok', avgTemp });
    }
  } catch (err: any) {
    steps.push(`ERROR: ${err?.message} stack: ${err?.stack?.slice(0, 300)}`);
    return NextResponse.json({ steps, error: err?.message });
  }

  return NextResponse.json({ steps });
}
