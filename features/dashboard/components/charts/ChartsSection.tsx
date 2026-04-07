'use client';

import { RevenueChart } from './RevenueChart';
import { ConversionFunnel } from './ConversionFunnel';
import { PeakHours } from './PeakHours';

export function ChartsSection() {
  return (
    <div className="space-y-4">
      <RevenueChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConversionFunnel />
        <PeakHours />
      </div>
    </div>
  );
}
