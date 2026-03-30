'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPaceShort } from '@/lib/format';
import type { SplitKm } from '@/lib/engine/types';

interface PaceChartProps {
  splits: SplitKm[];
  avgPace: number;
}

export function PaceChart({ splits, avgPace }: PaceChartProps) {
  const data = splits.map((s) => ({
    km: s.km,
    delta: +(s.paceSecondsPerKm - avgPace).toFixed(1),
    pace: s.paceSecondsPerKm,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Ritmo vs promedio ({formatPaceShort(avgPace)}/km)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis
                dataKey="km"
                tick={{ fontSize: 10, fill: 'oklch(0.708 0 0)' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'oklch(0.708 0 0)' }}
                axisLine={false}
                tickLine={false}
                unit="s"
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.178 0 0)',
                  border: '1px solid oklch(0.269 0 0)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: string, props: any) => {
                  const d = props.payload;
                  const sign = d.delta >= 0 ? '+' : '';
                  return [`${formatPaceShort(d.pace)}/km (${sign}${d.delta}s)`, 'Ritmo'];
                }}
                labelFormatter={(km) => `Km ${km}`}
              />
              <ReferenceLine y={0} stroke="oklch(0.708 0 0)" strokeDasharray="3 3" />
              <Bar dataKey="delta" radius={[2, 2, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.delta > 3 ? 'oklch(0.65 0.2 27 / 0.7)' : entry.delta < -3 ? 'oklch(0.65 0.17 160 / 0.7)' : 'oklch(0.708 0 0 / 0.4)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
