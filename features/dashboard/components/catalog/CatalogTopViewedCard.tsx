'use client';

import { useTranslations } from 'next-intl';
import { Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCardHeader } from '../DashboardCardHeader';
import type { CatalogMetrics } from '../../types/dashboard.types';

/**
 * Productos más abiertos en el catálogo y cuántos de esos visitantes los
 * agregaron o pidieron. Marca los muy vistos que casi nadie pide.
 */
export function CatalogTopViewedCard({ data }: { data: CatalogMetrics }) {
  const t = useTranslations('dashboard.catalog.topViewed');
  const rows = data.products.mostViewed;
  const lowConversion = new Set(
    data.products.viewedRarelyOrdered.map((p) => p.productId)
  );

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <DashboardCardHeader icon={Eye} title={t('title')} subtitle={t('subtitle')} />
      <CardContent className="flex flex-1 flex-col">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2 font-medium">{t('product')}</th>
                  <th className="pb-2 text-right font-medium">{t('views')}</th>
                  <th className="pb-2 text-right font-medium">{t('viewers')}</th>
                  <th className="pb-2 text-right font-medium">{t('addedToCart')}</th>
                  <th className="pb-2 text-right font-medium">{t('orders')}</th>
                  <th className="pb-2 text-right font-medium">{t('conversion')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.productId} className="border-t border-slate-100">
                    <td className="py-2 pr-3">
                      <p className="truncate font-medium text-slate-800">{row.name}</p>
                      {lowConversion.has(row.productId) && (
                        <span className="mt-0.5 inline-flex rounded-badge bg-amber-100/80 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          {t('lowConversion')}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{row.views}</td>
                    <td className="py-2 text-right tabular-nums">{row.viewers}</td>
                    <td className="py-2 text-right tabular-nums">{row.addedToCart}</td>
                    <td className="py-2 text-right tabular-nums">{row.orders}</td>
                    <td className="py-2 text-right tabular-nums font-semibold text-indigo-700">
                      {row.viewToOrderRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">{t('conversionHint')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
