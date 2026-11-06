'use client';

import { useTranslations } from 'next-intl';
import { LayoutGrid, Sparkles, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCardHeader } from '../DashboardCardHeader';
import type { CatalogMetrics } from '../../types/dashboard.types';

/** Categorías que más se abren, y cuánto venden destacados y recomendados. */
export function CatalogCategoriesCard({ data }: { data: CatalogMetrics }) {
  const t = useTranslations('dashboard.catalog.categories');
  const max = Math.max(1, ...data.categories.map((c) => c.views));

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <DashboardCardHeader icon={LayoutGrid} title={t('title')} subtitle={t('subtitle')} />
      <CardContent className="flex flex-1 flex-col gap-5">
        {data.categories.length === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <ul className="space-y-2.5">
            {data.categories.map((category) => (
              <li key={category.categoryId}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-slate-700">{category.name}</span>
                  <span className="tabular-nums text-slate-900">{category.views}</span>
                </div>
                <div className="h-1.5 rounded-full bg-indigo-100/70">
                  <div
                    className="h-1.5 rounded-full bg-indigo-400"
                    style={{ width: `${(category.views / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-card bg-indigo-50/85 px-4 py-3 text-sm text-indigo-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <Star className="h-4 w-4" />
              {t('featuredTitle')}
            </p>
            <p className="mt-1">
              {t('featured', {
                clicks: data.featured.clicks,
                rate: data.featured.rate,
              })}
            </p>
          </div>
          <div className="rounded-card bg-emerald-50/85 px-4 py-3 text-sm text-emerald-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="h-4 w-4" />
              {t('recommendedTitle')}
            </p>
            <p className="mt-1">
              {t('recommended', {
                count: data.recommended.added,
                share: data.recommended.shareOfAdds,
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
