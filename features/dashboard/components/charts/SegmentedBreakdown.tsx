'use client';

import { cn } from '@/lib/utils';

export interface BreakdownSegment {
  key: string;
  label: string;
  count: number;
  /** Clase de fondo de Tailwind (barra y punto de la leyenda). */
  colorClass: string;
}

interface SegmentedBreakdownProps {
  segments: BreakdownSegment[];
  total: number;
  /** Resumen accesible de la barra completa. */
  ariaLabel: string;
}

/**
 * Barra apilada + leyenda con cantidad y porcentaje de cada parte. La usan
 * "Estado de los pedidos" y "Conversaciones del bot".
 */
export function SegmentedBreakdown({
  segments,
  total,
  ariaLabel,
}: SegmentedBreakdownProps) {
  const share = (count: number) =>
    total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div
        role="img"
        aria-label={ariaLabel}
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/70"
      >
        {segments
          .filter((segment) => segment.count > 0)
          .map((segment) => (
            <div
              key={segment.key}
              className={segment.colorClass}
              style={{ width: `${(segment.count / total) * 100}%` }}
            />
          ))}
      </div>

      <ul className="space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-sm">
            <span
              className={cn('h-2.5 w-2.5 shrink-0 rounded-full', segment.colorClass)}
            />
            <span className="flex-1 text-slate-700">{segment.label}</span>
            <span className="text-slate-500 tabular-nums">
              <span className="font-semibold text-slate-900">
                {segment.count}
              </span>{' '}
              · {share(segment.count)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
