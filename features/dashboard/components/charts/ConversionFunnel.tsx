'use client';

import { useDetailedMetrics } from '../../hooks/useDetailedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ConversionFunnel() {
  const { data } = useDetailedMetrics();

  if (!data) return null;

  const { conversionFunnel } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo de Conversión</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 text-sm">Confirmadas</div>
            <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="w-12 text-right text-sm">{conversionFunnel.confirmed}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 text-sm">Pagadas</div>
            <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full" 
                style={{ width: `${(conversionFunnel.paid / conversionFunnel.confirmed) * 100}%` }}
              />
            </div>
            <div className="w-12 text-right text-sm">{conversionFunnel.paid}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 text-sm">Completadas</div>
            <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full" 
                style={{ width: `${(conversionFunnel.completed / conversionFunnel.confirmed) * 100}%` }}
              />
            </div>
            <div className="w-12 text-right text-sm">{conversionFunnel.completed}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
