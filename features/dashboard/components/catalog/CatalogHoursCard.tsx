'use client';

import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCardHeader } from '../DashboardCardHeader';
import type { CatalogMetrics } from '../../types/dashboard.types';

const BAR_COLOR = '#a5b4fc';
const PEAK_COLOR = '#4f46e5';

/** Visitantes del catálogo por hora del día (zona horaria del negocio). */
export function CatalogHoursCard({ data }: { data: CatalogMetrics }) {
  const t = useTranslations('dashboard.catalog.hours');
  const peak = data.byHour.reduce(
    (best, row) => (row.sessions > best.sessions ? row : best),
    data.byHour[0] ?? { hour: 0, sessions: 0, orders: 0 }
  );
  const chartData = data.byHour.map((row) => ({
    ...row,
    label: `${row.hour}h`,
  }));

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <DashboardCardHeader icon={Clock} title={t('title')} subtitle={t('subtitle')} />
      <CardContent className="flex flex-1 flex-col">
        {peak.sessions === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    interval={2}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as (typeof chartData)[number];
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
                          <p className="text-slate-600 mb-1">{t('hourLabel', { hour: row.hour })}</p>
                          <p className="font-semibold text-indigo-600">
                            {t('visitors', { count: row.sessions })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t('orders', { count: row.orders })}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                    {chartData.map((row) => (
                      <Cell
                        key={row.hour}
                        fill={row.hour === peak.hour ? PEAK_COLOR : BAR_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {t('peak', { hour: peak.hour, count: peak.sessions })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

