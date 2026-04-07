'use client';

import { Suspense } from 'react';
import { OrdersTodayCard } from './OrdersTodayCard';
import { RevenueTodayCard } from './RevenueTodayCard';
import { TotalOrdersCard } from './TotalOrdersCard';
import { AverageTicketCard } from './AverageTicketCard';

export function KpiSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Suspense fallback={<div className="h-32 bg-slate-100 animate-pulse rounded-lg" />}>
        <OrdersTodayCard />
      </Suspense>
      <Suspense fallback={<div className="h-32 bg-slate-100 animate-pulse rounded-lg" />}>
        <RevenueTodayCard />
      </Suspense>
      <Suspense fallback={<div className="h-32 bg-slate-100 animate-pulse rounded-lg" />}>
        <TotalOrdersCard />
      </Suspense>
      <Suspense fallback={<div className="h-32 bg-slate-100 animate-pulse rounded-lg" />}>
        <AverageTicketCard />
      </Suspense>
    </div>
  );
}
