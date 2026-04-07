'use client';

import { OrdersTodayCard } from './OrdersTodayCard';
import { RevenueTodayCard } from './RevenueTodayCard';
import { TotalOrdersCard } from './TotalOrdersCard';
import { AverageTicketCard } from './AverageTicketCard';

export function KpiSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <OrdersTodayCard />
      <RevenueTodayCard />
      <TotalOrdersCard />
      <AverageTicketCard />
    </div>
  );
}
