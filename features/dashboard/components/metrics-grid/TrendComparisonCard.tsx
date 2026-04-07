'use client';

import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function TrendComparisonCard() {
  const { data } = useDetailedMetrics();

  if (!data) return null;

  const { trendComparison } = data;
  const isPositive = trendComparison.growth > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
            {isPositive ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(trendComparison.current)}</p>
            <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{trendComparison.growth.toFixed(1)}% vs período anterior
            </p>
            <p className="text-xs text-slate-400">
              Anterior: {formatCurrency(trendComparison.previous)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
