'use client';

import { lazy, Suspense } from 'react';
import { ProductsSectionSkeleton } from '../loading/ProductsSectionSkeleton';
import { useLazyLoad } from '../../hooks/useLazyLoad';

const ProductsSection = lazy(() => import('../products').then(m => ({ default: m.ProductsSection })));

export function LazyProductsSection() {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>({ rootMargin: '200px' });

  return (
    <div ref={ref}>
      {isVisible && (
        <Suspense fallback={<ProductsSectionSkeleton />}>
          <ProductsSection />
        </Suspense>
      )}
    </div>
  );
}
