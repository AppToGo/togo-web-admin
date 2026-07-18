'use client';

import { lazy, Suspense } from 'react';
import { MetricsGridSkeleton } from '../loading/MetricsGridSkeleton';
import { useLazyLoad } from '../../hooks/useLazyLoad';

const MetricsGrid = lazy(() => import('../metrics-grid').then(m => ({ default: m.MetricsGrid })));

export function LazyMetricsGrid() {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>({ rootMargin: '200px' });

  return (
    <div ref={ref}>
      {isVisible && (
        <Suspense fallback={<MetricsGridSkeleton />}>
          <MetricsGrid />
        </Suspense>
      )}
    </div>
  );
}
