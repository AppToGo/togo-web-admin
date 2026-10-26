'use client';

import { ProductTrendsCard } from './ProductTrendsCard';
import { ProductsWithoutSalesCard } from './ProductsWithoutSalesCard';
import { TopProductsCard } from './TopProductsCard';

/**
 * Más vendidos a 2/3 y tendencias a 1/3; debajo, los productos sin ventas a
 * todo el ancho. Quien la monta ya validó el permiso `metrics.view`.
 */
export function ProductsSection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopProductsCard />
        </div>
        <ProductTrendsCard />
      </div>
      <ProductsWithoutSalesCard />
    </div>
  );
}
