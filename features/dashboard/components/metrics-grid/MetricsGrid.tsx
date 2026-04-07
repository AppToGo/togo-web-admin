'use client';

import { PaymentMethodsCard } from './PaymentMethodsCard';
import { TrendComparisonCard } from './TrendComparisonCard';

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <PaymentMethodsCard />
      <TrendComparisonCard />
    </div>
  );
}
