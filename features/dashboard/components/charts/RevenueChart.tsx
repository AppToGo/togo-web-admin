'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { CardSkeleton } from '../loading/CardSkeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { DashboardCardHeader } from '../DashboardCardHeader';
import { TrendBadge } from '../kpi/TrendBadge';

export function RevenueChart() {
  const t = useTranslations('dashboard.charts.revenue');
  const { data, isLoading } = useDetailedMetrics();

  if (isLoading) return <CardSkeleton className="h-96" />;
  if (!data) return null;

  const { trendComparison } = data;

  const chartData = data.revenueChart.map((point) => ({
    date: new Date(point.date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    }),
    amount: point.amount,
  }));

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader icon={TrendingUp} title={t('title')}>
        {/* Comparativa del período filtrado contra el anterior */}
        <div className="flex flex-wrap items-end gap-6 sm:text-right">
          <div>
            <p className="text-xs text-slate-500">{t('current')}</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(trendComparison.current)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('previous')}</p>
            <p className="text-xl font-semibold text-slate-500 tabular-nums">
              {formatCurrency(trendComparison.previous)}
            </p>
          </div>
          <TrendBadge value={trendComparison.growth} />
        </div>
      </DashboardCardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                        <p className="text-sm text-slate-600 mb-1">{label}</p>
                        <p className="text-lg font-semibold text-indigo-600">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAmount)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
