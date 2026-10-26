'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, PackageX } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCardHeader } from '../DashboardCardHeader';
import type { ProductCardProps } from './card-props';

/**
 * Productos activos que no se vendieron en el período (los más antiguos
 * primero): candidatos a promocionar, revisar o retirar del catálogo.
 */
export function ProductsWithoutSalesCard({ data, isError }: ProductCardProps) {
  const t = useTranslations('dashboard.products.withoutSales');
  const total = data?.withoutSales.total ?? 0;
  const products = data?.withoutSales.products ?? [];
  const remaining = total - products.length;

  return (
    <Card variant="glass">
      <DashboardCardHeader
        icon={PackageX}
        title={t('title')}
        subtitle={isError ? undefined : t('subtitle', { total })}
      >
        {total > 0 && (
          <Link
            href="/dashboard/catalog/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t('goToCatalog')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </DashboardCardHeader>
      <CardContent>
        {isError ? (
          <p className="text-sm text-slate-500">{t('error')}</p>
        ) : total === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <li
                  key={product.productId}
                  className="flex items-center gap-3 rounded-card bg-white/60 p-2"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-icon bg-slate-100 text-sm font-semibold text-slate-400">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      product.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                    {product.category && (
                      <p className="truncate text-xs text-slate-500">{product.category}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {remaining > 0 && (
              <p className="mt-3 text-sm text-slate-500">{t('more', { count: remaining })}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
