'use client';

import { PaymentMethodsChart } from '../charts/PaymentMethodsChart';
import { RevenueChart } from '../charts/RevenueChart';

/** Ingresos (con la comparativa del período) a 2/3 y métodos de pago a 1/3. */
export function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <RevenueChart />
      </div>
      <PaymentMethodsChart />
    </div>
  );
}
