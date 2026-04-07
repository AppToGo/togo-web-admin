'use client';

import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function PeakHours() {
  const { data } = useDetailedMetrics();

  if (!data) return null;

  const chartData = data.peakHours.map((hour) => ({
    hour: `${hour.hour.toString().padStart(2, '0')}:00`,
    orders: hour.count,
  }));

  // Encontrar el valor máximo para resaltar la hora pico
  const maxCount = Math.max(...data.peakHours.map((h) => h.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas Pico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                        <p className="text-sm text-slate-600 mb-1">{label}</p>
                        <p className="text-lg font-semibold text-indigo-600">
                          {payload[0].value} órdenes
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="orders"
                radius={[4, 4, 0, 0]}
                fill="#6366f1"
              >
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
        {maxCount > 0 && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-700">
              <span className="font-semibold">Hora pico:</span>{' '}
              {chartData.find((d) => d.orders === maxCount)?.hour} con {maxCount} órdenes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
