'use client';

import { useTranslations } from 'next-intl';
import { Search, SearchX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCardHeader } from '../DashboardCardHeader';
import type { CatalogMetrics, CatalogSearchMetric } from '../../types/dashboard.types';

/** Lo que buscan los clientes, empezando por lo que no encuentran. */
export function CatalogSearchesCard({ data }: { data: CatalogMetrics }) {
  const t = useTranslations('dashboard.catalog.searches');

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <DashboardCardHeader icon={Search} title={t('title')} subtitle={t('subtitle')} />
      <CardContent className="flex flex-1 flex-col gap-5">
        {data.searches.top.length === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <>
            <SearchList
              icon={<SearchX className="h-4 w-4 text-amber-600" />}
              title={t('noResults')}
              hint={t('noResultsHint')}
              rows={data.searches.noResults}
              emptyText={t('allFound')}
            />
            <SearchList
              icon={<Search className="h-4 w-4 text-indigo-600" />}
              title={t('top')}
              rows={data.searches.top}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SearchList({
  icon,
  title,
  hint,
  rows,
  emptyText,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  rows: CatalogSearchMetric[];
  emptyText?: string;
}) {
  const t = useTranslations('dashboard.catalog.searches');

  return (
    <section>
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        {icon}
        {title}
      </h3>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {rows.map((row) => (
            <li
              key={row.query}
              className="inline-flex items-center gap-1.5 rounded-badge bg-white/70 px-2.5 py-1 text-sm text-slate-800 ring-1 ring-slate-200"
            >
              {row.query}
              <span className="text-xs tabular-nums text-slate-500">
                {t('people', { count: row.sessions })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
