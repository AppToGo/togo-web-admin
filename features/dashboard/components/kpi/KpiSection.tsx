"use client";

import { OrdersTodayCard } from "./OrdersTodayCard";
import { PeriodRevenueCard } from "./PeriodRevenueCard";
import { PeriodOrdersCard } from "./PeriodOrdersCard";
import { AverageTicketCard } from "./AverageTicketCard";

export function KpiSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <OrdersTodayCard />
      <PeriodRevenueCard />
      <PeriodOrdersCard />
      <AverageTicketCard />
    </div>
  );
}
