'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpDown, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCardHeader } from '../DashboardCardHeader';
import { TrendBadge } from '../kpi/TrendBadge';
import type { ProductTrend } from '../../types/dashboard.types';
import type { ProductCardProps } from './card-props';
import { productKey } from './product-key';

/** Productos que más subieron y más bajaron en unidades vs el período anterior. */
export function ProductTrendsCard({ data, isError }: ProductCardProps) {
  const t = useTranslations('dashboard.products.trends');
  const rising = data?.trends.rising ?? [];
  const falling = data?.trends.falling ?? [];

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <DashboardCardHeader icon={ArrowUpDown} title={t('title')} subtitle={t('subtitle')} />
      <CardContent className="flex flex-1 flex-col gap-4">
        {isError ? (
          <p className="text-sm text-slate-500">{t('error')}</p>
        ) : rising.length === 0 && falling.length === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <>
            <TrendList
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              title={t('rising')}
              rows={rising}
            />
            <TrendList
              icon={<TrendingDown className="h-4 w-4 text-red-600" />}
              title={t('falling')}
              rows={falling}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TrendList({
  icon,
  title,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  rows: ProductTrend[];
}) {
  const t = useTranslations('dashboard.products.trends');

  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        {icon}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t('none')}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={productKey(row)}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{row.name}</p>
                <p className="text-xs tabular-nums text-slate-500">
                  {t('units', { previous: row.previousQuantity, current: row.quantity })}
                </p>
              </div>
              {row.changePct === null ? (
                <span className="inline-flex shrink-0 items-center rounded-badge bg-indigo-100/80 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {t('new')}
                </span>
              ) : (
                <span className="shrink-0">
                  <TrendBadge value={row.changePct} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
