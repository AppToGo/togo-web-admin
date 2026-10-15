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
 * Porcentajes enteros que suman 100 (método del mayor residuo): redondear
 * cada parte por separado puede dar 99 o 101.
 */
function sharesOf(counts: number[], total: number): number[] {
  if (total <= 0) return counts.map(() => 0);
  const exact = counts.map((count) => (count / total) * 100);
  const shares = exact.map(Math.floor);
  const missing = 100 - shares.reduce((sum, share) => sum + share, 0);
  exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, Math.max(missing, 0))
    .forEach(({ index }) => (shares[index] += 1));
  return shares;
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
  const shares = sharesOf(
    segments.map((segment) => segment.count),
    total
  );

  return (
    <div className="space-y-4">
      {/* Separador con borde y no con `gap`: el borde va dentro del ancho de
          cada parte, así la suma no pasa del 100% ni se recorta la última. */}
      <div
        role="img"
        aria-label={ariaLabel}
        className="flex h-3 w-full overflow-hidden rounded-full bg-white/70"
      >
        {segments
          .filter((segment) => segment.count > 0)
          .map((segment) => (
            <div
              key={segment.key}
              className={cn(
                'min-w-1 border-r-2 border-white/70 last:border-r-0',
                segment.colorClass
              )}
              style={{ width: `${(segment.count / total) * 100}%` }}
            />
          ))}
      </div>

      <ul className="space-y-2.5">
        {segments.map((segment, index) => (
          <li key={segment.key} className="flex items-center gap-2 text-sm">
            <span
              className={cn('h-2.5 w-2.5 shrink-0 rounded-full', segment.colorClass)}
            />
            <span className="flex-1 text-slate-700">{segment.label}</span>
            <span className="text-slate-500 tabular-nums">
              <span className="font-semibold text-slate-900">
                {segment.count}
              </span>{' '}
              · {shares[index]}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
