'use client';

import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export function PaymentMethodsChart() {
  const { data } = useDetailedMetrics();

  if (!data) return null;
  
  // Verificar si hay métodos de pago
  if (!data.paymentMethods || data.paymentMethods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 flex items-center justify-center text-slate-400">
            No hay datos de métodos de pago disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.paymentMethods.map((method) => ({
    name: method.method,
    value: method.count,
    amount: method.amount,
    percentage: method.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-slate-700">
                          {data.name}
                        </p>
                        <p className="text-lg font-semibold text-indigo-600">
                          {data.value} órdenes
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(data.amount)} ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
                <span className="text-slate-600">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-500">{item.percentage}%</span>
                <span className="font-medium text-slate-700 w-20 text-right">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
