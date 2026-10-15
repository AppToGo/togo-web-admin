'use client';

import { useTranslations } from 'next-intl';
import { Filter } from 'lucide-react';
import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardCardHeader } from '../DashboardCardHeader';

// Cada etapa un tono más claro, igual que la leyenda de métodos de pago.
const BAR_CLASSES = [
  '[&>div]:bg-indigo-600',
  '[&>div]:bg-indigo-500',
  '[&>div]:bg-indigo-400',
];

export function ConversionFunnel() {
  const t = useTranslations('dashboard.charts.conversionFunnel');
  const { data, isLoading } = useDetailedMetrics();

  if (isLoading) return <Skeleton className="h-80 rounded-card-xl" />;
  if (!data) return null;

  const { conversionFunnel } = data;
  const share = (value: number) =>
    conversionFunnel.confirmed > 0
      ? Math.round((value / conversionFunnel.confirmed) * 100)
      : 0;

  const stages = [
    { name: t('confirmed'), value: conversionFunnel.confirmed },
    { name: t('paid'), value: conversionFunnel.paid },
    { name: t('completed'), value: conversionFunnel.completed },
  ].map((stage) => ({ ...stage, percentage: share(stage.value) }));

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader
        icon={Filter}
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <CardContent>
        <ul className="space-y-4">
          {stages.map((stage, index) => (
            <li key={stage.name}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700">{stage.name}</span>
                <span className="text-slate-500 tabular-nums">
                  <span className="font-semibold text-slate-900">
                    {stage.value}
                  </span>{' '}
                  · {stage.percentage}%
                </span>
              </div>
              <Progress
                value={stage.percentage}
                className={`h-3 bg-white/70 ${BAR_CLASSES[index]}`}
                aria-label={stage.name}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
