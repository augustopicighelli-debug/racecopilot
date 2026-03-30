'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatTime, formatDelta } from '@/lib/format';
import type { RaceWaterfall, AggregatedWeather, CourseProfile } from '@/lib/engine/types';

interface WaterfallChartProps {
  waterfall: RaceWaterfall;
  weather: AggregatedWeather;
  course: CourseProfile;
}

interface WaterfallItem {
  label: string;
  displayValue: string;
  invisible: number;
  visible: number;
  color: string;
}

export function WaterfallChart({ waterfall, weather, course }: WaterfallChartProps) {
  const baseTime = waterfall.baseTimeSeconds;
  const adjustments = [
    {
      label: `Clima (${weather.temperature}°→${weather.temperatureEnd ?? '?'}°C)`,
      seconds: waterfall.climateAdjustment,
    },
    {
      label: `Elevacion (${Math.round(course.totalElevationGain)}↑ ${Math.round(course.totalElevationLoss)}↓)`,
      seconds: waterfall.elevationAdjustment,
    },
    {
      label: `Viento (${weather.windSpeedKmh}km/h)`,
      seconds: waterfall.windAdjustment,
    },
  ];

  const items: WaterfallItem[] = [];

  // Base time
  items.push({
    label: 'Base',
    displayValue: formatTime(baseTime),
    invisible: 0,
    visible: baseTime,
    color: 'oklch(0.5 0 0 / 0.5)',
  });

  // Adjustments
  let running = baseTime;
  for (const adj of adjustments) {
    if (Math.abs(adj.seconds) < 1) {
      items.push({
        label: adj.label,
        displayValue: '±0',
        invisible: running,
        visible: 0.5, // tiny sliver so it renders
        color: 'oklch(0.4 0 0 / 0.3)',
      });
      continue;
    }

    if (adj.seconds > 0) {
      items.push({
        label: adj.label,
        displayValue: formatDelta(adj.seconds),
        invisible: running,
        visible: adj.seconds,
        color: 'oklch(0.65 0.2 27 / 0.7)',
      });
    } else {
      items.push({
        label: adj.label,
        displayValue: formatDelta(adj.seconds),
        invisible: running + adj.seconds,
        visible: Math.abs(adj.seconds),
        color: 'oklch(0.65 0.17 160 / 0.7)',
      });
    }
    running += adj.seconds;
  }

  // Final
  items.push({
    label: 'Pronostico',
    displayValue: formatTime(waterfall.finalTimeSeconds),
    invisible: 0,
    visible: waterfall.finalTimeSeconds,
    color: 'oklch(0.75 0.15 160 / 0.6)',
  });

  // Domain
  const maxVal = Math.max(...items.map(i => i.invisible + i.visible)) * 1.001;
  const minVal = Math.min(...items.map(i => i.invisible)) * 0.999;

  // Sources line
  const sources: string[] = [];
  if (waterfall.riegelTimeSeconds) sources.push(`Modelo: ${formatTime(waterfall.riegelTimeSeconds)}`);
  if (waterfall.intervalTimeSeconds) sources.push(`Intervalos: ${formatTime(waterfall.intervalTimeSeconds)}`);

  // Custom label renderer - show value to the right of each bar
  const renderLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    const item = items[index];
    if (!item) return null;
    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        fill={item.color === 'oklch(0.65 0.2 27 / 0.7)' ? 'oklch(0.75 0.2 27)' :
              item.color === 'oklch(0.65 0.17 160 / 0.7)' ? 'oklch(0.75 0.17 160)' :
              'oklch(0.85 0 0)'}
        fontSize={12}
        fontFamily="monospace"
        dominantBaseline="central"
      >
        {item.displayValue}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Como se construye tu pronostico</CardTitle>
        {sources.length > 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">
            {sources.join(' · ')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={items}
              layout="vertical"
              margin={{ top: 0, right: 80, bottom: 0, left: 10 }}
              barSize={18}
            >
              <XAxis type="number" domain={[minVal, maxVal]} hide />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: 'oklch(0.708 0 0)' }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Bar dataKey="invisible" stackId="stack" fill="transparent" />
              <Bar dataKey="visible" stackId="stack" radius={[3, 3, 3, 3]}>
                {items.map((item, i) => (
                  <Cell key={i} fill={item.color} />
                ))}
                <LabelList content={renderLabel} />
              </Bar>
              <ReferenceLine x={baseTime} stroke="oklch(0.708 0 0 / 0.2)" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
