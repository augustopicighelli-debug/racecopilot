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
import { useLang } from '@/lib/lang';
import { useUnits } from '@/lib/units';
import type { SplitKm } from '@/lib/engine/types';

interface PaceChartProps {
  splits: SplitKm[];
  avgPace: number;
}

const CustomTooltip = ({ active, payload, label, paceVsAvg, fmtPace }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const sign = d.delta >= 0 ? '+' : '';
  const color = d.delta > 3 ? '#f87171' : d.delta < -3 ? '#34d399' : '#a1a1aa';

  return (
    <div style={{
      background: 'oklch(0.178 0 0)',
      border: '1px solid oklch(0.269 0 0)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '13px',
    }}>
      <div style={{ color: '#e4e4e7', fontWeight: 600, marginBottom: '4px' }}>
        Km {d.km}
      </div>
      <div style={{ color, fontFamily: 'monospace', fontSize: '16px', fontWeight: 700 }}>
        {fmtPace(d.pace)}
      </div>
      <div style={{ color: '#a1a1aa', fontSize: '11px', marginTop: '2px' }}>
        {sign}{d.delta}s {paceVsAvg}
      </div>
    </div>
  );
};

export function PaceChart({ splits, avgPace }: PaceChartProps) {
  const { t } = useLang();
  const { fmtPace } = useUnits();
  const data = splits.map((s) => ({
    km: s.km,
    delta: +(s.paceSecondsPerKm - avgPace).toFixed(1),
    pace: s.paceSecondsPerKm,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t.plan.paceChartTitle(fmtPace(avgPace))}
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
                content={<CustomTooltip paceVsAvg={t.plan.paceVsAvg} fmtPace={fmtPace} />}
                cursor={{ fill: 'oklch(0.3 0 0 / 0.3)' }}
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
