'use client';

import { ConversionFunnel } from './ConversionFunnel';
import { PeakHours } from './PeakHours';

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ConversionFunnel />
      <PeakHours />
    </div>
  );
}
