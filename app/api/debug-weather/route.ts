import { NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/weather/visual-crossing';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date();
  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);
  const raceDate = in14Days.toISOString().split('T')[0];
  const daysUntilRace = 14;

  const weather = await fetchWeather('Mendoza', raceDate, daysUntilRace, 12900);

  return NextResponse.json({
    raceDate,
    daysUntilRace,
    weather,
    isNeutral: weather.sourcesCount === 0,
  });
}
