'use client';

import { useTranslations } from 'next-intl';
import { ClipboardList, Wallet } from 'lucide-react';
import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { formatCOP } from '@/features/cash/utils/cash.utils';
import { CardSkeleton } from '../loading/CardSkeleton';
import { DashboardCardHeader } from '../DashboardCardHeader';
import { SegmentedBreakdown } from './SegmentedBreakdown';

/**
 * Cómo están hoy los pedidos creados en el período: completados, en curso o
 * perdidos (cancelados / nunca confirmados), más lo que falta cobrar.
 */
export function OrderStatusCard() {
  const t = useTranslations('dashboard.charts.orderStatus');
  const { data, isLoading } = useDetailedMetrics();

  if (isLoading) return <CardSkeleton className="h-80" />;
  if (!data) return null;

  const { orderStatus } = data;
  const segments = [
    {
      key: 'completed',
      label: t('completed'),
      count: orderStatus.completed,
      colorClass: 'bg-emerald-500',
    },
    {
      key: 'inProgress',
      label: t('inProgress'),
      count: orderStatus.inProgress,
      colorClass: 'bg-indigo-400',
    },
    {
      key: 'cancelled',
      label: t('cancelled'),
      count: orderStatus.cancelled,
      colorClass: 'bg-red-500',
    },
    {
      key: 'unconfirmed',
      label: t('unconfirmed'),
      count: orderStatus.unconfirmed,
      colorClass: 'bg-slate-300',
    },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader
        icon={ClipboardList}
        title={t('title')}
        subtitle={t('subtitle', { total })}
      />
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <SegmentedBreakdown
            segments={segments}
            total={total}
            ariaLabel={segments
              .map((segment) => `${segment.label}: ${segment.count}`)
              .join(', ')}
          />
        )}

        {orderStatus.pendingPayment.count > 0 && (
          <div className="flex items-center gap-2 rounded-card bg-amber-50/85 px-4 py-3 text-sm text-amber-800">
            <Wallet className="h-4 w-4 shrink-0" />
            <p>
              {t('pendingPayment', {
                count: orderStatus.pendingPayment.count,
                amount: formatCOP(orderStatus.pendingPayment.amount),
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
