'use client';

import { lazy, Suspense } from 'react';
import { ProductsSectionSkeleton } from '../loading/ProductsSectionSkeleton';
import { useLazyLoad } from '../../hooks/useLazyLoad';

const CatalogSection = lazy(() => import('../catalog').then(m => ({ default: m.CatalogSection })));

export function LazyCatalogSection() {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>({ rootMargin: '200px' });

  return (
    <div ref={ref}>
      {isVisible && (
        <Suspense fallback={<ProductsSectionSkeleton />}>
          <CatalogSection />
        </Suspense>
      )}
    </div>
  );
}
