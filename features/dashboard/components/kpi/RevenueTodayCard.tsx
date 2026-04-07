'use client';

import { memo } from 'react';
import { DollarSign } from 'lucide-react';
import { useKpiMetrics } from '../../hooks/useKpiMetrics';
import { KpiCard } from './KpiCard';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export const RevenueTodayCard = memo(function RevenueTodayCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <div className="h-32 bg-slate-100 animate-pulse rounded-lg" />;
  }

  return (
    <KpiCard
      title="Ingresos Hoy"
      value={formatCurrency(data?.revenueToday || 0)}
      description="vs período anterior"
      icon={<DollarSign className="w-5 h-5" />}
      trend={data && data.revenueGrowth > 0 ? 'up' : data && data.revenueGrowth < 0 ? 'down' : 'neutral'}
      trendValue={data?.revenueGrowth}
    />
  );
});
