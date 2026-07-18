'use client';

import { useTranslations } from 'next-intl';
import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa'];

export function ConversionFunnel() {
  const t = useTranslations('dashboard.charts.conversionFunnel');
  const { data } = useDetailedMetrics();

  if (!data) return null;

  const { conversionFunnel } = data;

  const chartData = [
    {
      name: t('confirmed'),
      value: conversionFunnel.confirmed,
      percentage: 100,
    },
    {
      name: t('paid'),
      value: conversionFunnel.paid,
      percentage:
        conversionFunnel.confirmed > 0
          ? Math.round((conversionFunnel.paid / conversionFunnel.confirmed) * 100)
          : 0,
    },
    {
      name: t('completed'),
      value: conversionFunnel.completed,
      percentage:
        conversionFunnel.confirmed > 0
          ? Math.round((conversionFunnel.completed / conversionFunnel.confirmed) * 100)
          : 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 13, fill: '#475569' }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-slate-700">{item.name}</p>
                        <p className="text-lg font-semibold text-indigo-600">{item.value}</p>
                        <p className="text-xs text-slate-500">{item.percentage}{t('ofTotal')}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-slate-600">{item.name}</span>
              </div>
              <span className="font-medium text-slate-700">
                {item.value} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
