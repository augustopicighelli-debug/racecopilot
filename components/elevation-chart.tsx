'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CourseProfile } from '@/lib/engine/types';

interface ElevationChartProps {
  course: CourseProfile;
}

export function ElevationChart({ course }: ElevationChartProps) {
  let cumulativeElevation = 0;
  const data = course.segments.map(seg => {
    cumulativeElevation += seg.elevationGain - seg.elevationLoss;
    return {
      km: seg.kmIndex + 1,
      elevation: Math.round(cumulativeElevation),
      gradient: seg.avgGradientPercent,
    };
  });

  data.unshift({ km: 0, elevation: 0, gradient: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elevacion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <defs>
                <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.75 0.15 160)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.75 0.15 160)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="km"
                tick={{ fontSize: 11, fill: 'oklch(0.708 0 0)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'oklch(0.708 0 0)' }}
                axisLine={false}
                tickLine={false}
                unit="m"
              />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.178 0 0)',
                  border: '1px solid oklch(0.269 0 0)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'elevation') return [`${value}m`, 'Elevacion'];
                  return [value, name];
                }}
                labelFormatter={(km) => `Km ${km}`}
              />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke="oklch(0.75 0.15 160)"
                fill="url(#elevGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
