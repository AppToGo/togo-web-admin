'use client';

import { lazy, Suspense } from 'react';
import { ChartsSectionSkeleton } from '../loading/ChartsSectionSkeleton';
import { useLazyLoad } from '../../hooks/useLazyLoad';

const ChartsSection = lazy(() => import('../charts').then(m => ({ default: m.ChartsSection })));

export function LazyChartsSection() {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>({ rootMargin: '200px' });

  return (
    <div ref={ref}>
      {isVisible && (
        <Suspense fallback={<ChartsSectionSkeleton />}>
          <ChartsSection />
        </Suspense>
      )}
    </div>
  );
}
