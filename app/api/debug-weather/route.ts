import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.VISUAL_CROSSING_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'NO API KEY' });

  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Mendoza/2026-05-03?key=${apiKey}&include=hours&unitGroup=metric&elements=temp,humidity,windspeed,winddir`;
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      hasHours: !!data.days?.[0]?.hours,
      hoursCount: data.days?.[0]?.hours?.length ?? 0,
      sample: data.days?.[0]?.hours?.slice(0,2),
      error: data.error,
    });
  } catch (err: any) {
    return NextResponse.json({ fetchError: err.message });
  }
}
