'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { PillGroup } from '@/components/ui/pill-group';
import { formatCOP } from '@/features/cash/utils/cash.utils';
import { DashboardCardHeader } from '../DashboardCardHeader';
import type { ProductSales } from '../../types/dashboard.types';
import type { ProductCardProps } from './card-props';
import { productKey } from './product-key';

type RankBy = 'quantity' | 'revenue';

const TOP_COLOR = '#4f46e5';
const BAR_COLOR = '#c7d2fe';
/** Nombres largos se cortan en el eje para no comerse la gráfica. */
const MAX_LABEL_LENGTH = 18;

const shortName = (name: string) =>
  name.length > MAX_LABEL_LENGTH ? `${name.slice(0, MAX_LABEL_LENGTH - 1)}…` : name;

/** Gráfica de los más vendidos del período, por unidades o por ingresos. */
export function TopProductsCard({ data, isError }: ProductCardProps) {
  const t = useTranslations('dashboard.products.top');
  const [rankBy, setRankBy] = useState<RankBy>('quantity');
  const rows: ProductSales[] =
    (rankBy === 'quantity' ? data?.topByQuantity : data?.topByRevenue) ?? [];
  const formatValue = (value: number) =>
    rankBy === 'quantity' ? t('units', { count: value }) : formatCOP(value);
  const chartData = rows.map((row) => ({
    ...row,
    label: shortName(row.name),
    value: rankBy === 'quantity' ? row.quantity : row.revenue,
  }));
  const leader = rows[0];

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <DashboardCardHeader icon={Trophy} title={t('title')} subtitle={t('subtitle')}>
        <PillGroup<RankBy>
          label={t('rankBy')}
          appearance="glass"
          value={rankBy}
          onChange={setRankBy}
          options={[
            { id: 'quantity', label: t('byQuantity') },
            { id: 'revenue', label: t('byRevenue') },
          ]}
        />
      </DashboardCardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isError ? (
          <p className="text-sm text-slate-500">{t('error')}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={130}
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as (typeof chartData)[number];
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                          <p className="text-sm text-slate-600 mb-1">{row.name}</p>
                          <p className="text-lg font-semibold text-indigo-600">
                            {formatValue(row.value)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t('share', { value: row.share })} ·{' '}
                            {t('orders', { count: row.orderCount })}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={productKey(entry)}
                        fill={index === 0 ? TOP_COLOR : BAR_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {leader && (
              <div className="mt-4 flex items-center gap-2 rounded-card bg-indigo-50/85 px-4 py-3 text-sm text-indigo-700">
                <Trophy className="h-4 w-4 shrink-0" />
                <p className="min-w-0 break-words">
                  <span className="font-semibold">{t('leaderLabel')}</span>{' '}
                  {leader.name} · {formatValue(rankBy === 'quantity' ? leader.quantity : leader.revenue)}{' '}
                  ({t('share', { value: leader.share })})
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
