'use client';

import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PeakHours() {
  const { data } = useDetailedMetrics();

  if (!data) return null;

  const maxCount = Math.max(...data.peakHours.map(h => h.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas Pico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-end gap-1">
          {data.peakHours.map((hour, i) => (
            <div
              key={i}
              className="flex-1 bg-indigo-500 rounded-t"
              style={{ height: `${(hour.count / maxCount) * 100}%` }}
              title={`${hour.hour}:00 - ${hour.count} órdenes`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
      </CardContent>
    </Card>
  );
}
