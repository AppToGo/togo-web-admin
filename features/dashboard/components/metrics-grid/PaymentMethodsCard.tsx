'use client';

import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PaymentMethodsCard() {
  const { data } = useDetailedMetrics();

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.paymentMethods.map((method) => (
            <div key={method.method} className="flex items-center justify-between">
              <span className="text-sm">{method.method}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">{method.percentage}%</span>
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
