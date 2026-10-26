'use client';

import { useProductMetrics } from '../../hooks/useProductMetrics';
import { ProductsSectionSkeleton } from '../loading/ProductsSectionSkeleton';
import { ProductTrendsCard } from './ProductTrendsCard';
import { ProductsWithoutSalesCard } from './ProductsWithoutSalesCard';
import { TopProductsCard } from './TopProductsCard';

/**
 * Más vendidos a 2/3 y tendencias a 1/3; debajo, los productos sin ventas a
 * todo el ancho. Las tres tarjetas salen de una sola respuesta, así que la
 * consulta se hace aquí una vez: cargan, fallan o muestran datos juntas.
 * Quien la monta ya validó el permiso `metrics.view`.
 */
export function ProductsSection() {
  const { data, isLoading, isError } = useProductMetrics();

  if (isLoading) return <ProductsSectionSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopProductsCard data={data} isError={isError} />
        </div>
        <ProductTrendsCard data={data} isError={isError} />
      </div>
      <ProductsWithoutSalesCard data={data} isError={isError} />
    </div>
  );
}
