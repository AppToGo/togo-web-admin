'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { useCatalogMetrics } from '../../hooks/useCatalogMetrics';
import { ProductsSectionSkeleton } from '../loading/ProductsSectionSkeleton';
import { CatalogCategoriesCard } from './CatalogCategoriesCard';
import { CatalogFunnelCard } from './CatalogFunnelCard';
import { CatalogHoursCard } from './CatalogHoursCard';
import { CatalogSearchesCard } from './CatalogSearchesCard';
import { CatalogTopViewedCard } from './CatalogTopViewedCard';

/**
 * Analítica del catálogo web (flag CATALOG_ANALYTICS): una sola consulta
 * para todas las tarjetas. Quien la monta ya validó `metrics.view` y el flag.
 */
export function CatalogSection() {
  const t = useTranslations('dashboard.catalog');
  const { data, isLoading, isError } = useCatalogMetrics();

  if (isLoading) return <ProductsSectionSkeleton />;
  if (isError || !data) {
    return (
      <Card variant="glass">
        <CardContent className="py-6">
          <p className="text-sm text-slate-500">{t('error')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CatalogFunnelCard data={data} />
        <div className="lg:col-span-2">
          <CatalogTopViewedCard data={data} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CatalogSearchesCard data={data} />
        <CatalogHoursCard data={data} />
        <CatalogCategoriesCard data={data} />
      </div>
    </div>
  );
}
