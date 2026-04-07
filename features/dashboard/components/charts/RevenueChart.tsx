'use client';

import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RevenueChart() {
  const { data } = useDetailedMetrics();

  if (!data) return null;

  const maxValue = Math.max(...data.revenueChart.map(d => d.amount));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos últimos 30 días</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end gap-1">
          {data.revenueChart.map((point, i) => (
            <div
              key={i}
              className="flex-1 bg-indigo-500 rounded-t"
              style={{ height: `${(point.amount / maxValue) * 100}%` }}
              title={`${point.date}: ${point.amount}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
