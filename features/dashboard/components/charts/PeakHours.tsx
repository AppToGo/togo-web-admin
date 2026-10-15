'use client';

import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardCardHeader } from '../DashboardCardHeader';

const PEAK_COLOR = '#4f46e5';
const BAR_COLOR = '#c7d2fe';

export function PeakHours() {
  const t = useTranslations('dashboard.charts.peakHours');
  const { data, isLoading } = useDetailedMetrics();

  if (isLoading) return <Skeleton className="h-80 rounded-card-xl" />;
  if (!data) return null;

  const chartData = data.peakHours.map((hour) => ({
    hour: `${hour.hour.toString().padStart(2, '0')}:00`,
    orders: hour.count,
  }));

  // Encontrar el valor máximo para resaltar la hora pico
  const maxCount = Math.max(...data.peakHours.map((h) => h.count));
  const peakHour = chartData.find((d) => d.orders === maxCount)?.hour;

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader
        icon={Clock}
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                        <p className="text-sm text-slate-600 mb-1">{label}</p>
                        <p className="text-lg font-semibold text-indigo-600">
                          {payload[0].value} {t('orders')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.hour}
                    fill={entry.orders === maxCount ? PEAK_COLOR : BAR_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {maxCount > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-card bg-indigo-50/85 px-4 py-3 text-sm text-indigo-700">
            <Clock className="h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">{t('peakLabel')}</span>{' '}
              {peakHour} · {maxCount} {t('orders')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
