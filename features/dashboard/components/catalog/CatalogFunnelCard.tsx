'use client';

import { useTranslations } from 'next-intl';
import { Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCardHeader } from '../DashboardCardHeader';
import type { CatalogMetrics } from '../../types/dashboard.types';

const percent = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 0;

/** Visitas → producto visto → carrito → pedido, con abandono y por origen. */
export function CatalogFunnelCard({ data }: { data: CatalogMetrics }) {
  const t = useTranslations('dashboard.catalog.funnel');
  const total = data.funnel.total;
  const stages = [
    { key: 'sessions', value: total.sessions },
    { key: 'viewedProduct', value: total.viewedProduct },
    { key: 'addedToCart', value: total.addedToCart },
    { key: 'placedOrder', value: total.placedOrder },
  ] as const;

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <DashboardCardHeader icon={Filter} title={t('title')} subtitle={t('subtitle')} />
      <CardContent className="flex flex-1 flex-col gap-5">
        <ul className="space-y-3">
          {stages.map(({ key, value }) => {
            const share = percent(value, total.sessions);
            return (
              <li key={key}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-700">{t(`stages.${key}`)}</span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {value}
                    {key !== 'sessions' && (
                      <span className="ml-1.5 text-xs font-normal text-slate-500">
                        {share}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-indigo-100/70">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${key === 'sessions' ? 100 : share}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="rounded-card bg-amber-50/85 px-4 py-3 text-sm text-amber-800">
          {t('abandoned', {
            count: total.abandonedCarts,
            percent: percent(total.abandonedCarts, total.addedToCart),
          })}
        </p>

        {data.funnel.byOrigin.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">{t('origin')}</th>
                <th className="pb-2 text-right font-medium">{t('visitorsShort')}</th>
                <th className="pb-2 text-right font-medium">{t('ordersShort')}</th>
                <th className="pb-2 text-right font-medium">{t('conversion')}</th>
              </tr>
            </thead>
            <tbody>
              {data.funnel.byOrigin.map((row) => (
                <tr key={row.origin} className="border-t border-slate-100">
                  <td className="py-1.5 text-slate-700">
                    {t.has(`origins.${row.origin}`) ? t(`origins.${row.origin}`) : row.origin}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{row.sessions}</td>
                  <td className="py-1.5 text-right tabular-nums">{row.placedOrder}</td>
                  <td className="py-1.5 text-right tabular-nums">{row.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
