'use client';

import { useTranslations } from 'next-intl';
import { CreditCard } from 'lucide-react';
import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { CardSkeleton } from '../loading/CardSkeleton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { DashboardCardHeader } from '../DashboardCardHeader';

// Escala índigo de oscuro a claro: los métodos se distinguen por luminosidad.
const COLORS = ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

export function PaymentMethodsChart() {
  const t = useTranslations('dashboard.charts.paymentMethods');
  const { data, isLoading } = useDetailedMetrics();

  if (isLoading) return <CardSkeleton className="h-96" />;
  if (!data) return null;

  // Verificar si hay métodos de pago
  if (!data.paymentMethods || data.paymentMethods.length === 0) {
    return (
      <Card variant="glass" className="h-full">
        <DashboardCardHeader
          icon={CreditCard}
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <CardContent>
          <div className="h-56 flex items-center justify-center text-center text-sm text-slate-500">
            {t('noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.paymentMethods.map((method) => ({
    name: method.method,
    value: method.count,
    amount: method.amount,
    percentage: method.percentage,
  }));
  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader
        icon={CreditCard}
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <CardContent>
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative h-44 w-44 shrink-0 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium text-slate-700">
                            {data.name}
                          </p>
                          <p className="text-lg font-semibold text-indigo-600">
                            {data.value} {t('orders')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatCurrency(data.amount)} ({data.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {totalOrders}
              </span>
              <span className="text-xs text-slate-500">{t('orders')}</span>
            </div>
          </div>

          <ul className="flex-1 min-w-40 space-y-3">
            {chartData.map((item, index) => (
              <li key={item.name} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2.5 h-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="flex-1 text-slate-700">{item.name}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {item.percentage}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
