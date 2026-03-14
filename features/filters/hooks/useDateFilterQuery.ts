/**
 * Date Filter Query Hooks
 *
 * Hooks que conectan el store de filtros de fecha con TanStack Query.
 * Permiten usar las fechas seleccionadas en queries y mutaciones.
 */

import { useDateFilterStore } from "../stores/date-filter.store";
import type { DateRange } from "../stores/date-filter.store";

/**
 * Hook que retorna el rango de fechas actual para usar en queryKeys
 *
 * @example
 * ```typescript
 * const range = useDateFilterQuery();
 * const { data } = useQuery({
 *   queryKey: ["metrics", range.from, range.to],
 *   queryFn: () => fetchMetrics(range),
 * });
 * ```
 */
export function useDateFilterQuery(): DateRange {
  const range = useDateFilterStore((state) => state.range);
  return range;
}

/**
 * Hook que retorna los parámetros de fecha formateados para API
 *
 * @example
 * ```typescript
 * const dateParams = useDateFilterParams();
 * const { data } = useQuery({
 *   queryKey: ["orders", dateParams.dateFrom, dateParams.dateTo],
 *   queryFn: () => getOrders(dateParams),
 * });
 * ```
 */
export function useDateFilterParams(): {
  dateFrom: string;
  dateTo: string;
} {
  const range = useDateFilterStore((state) => state.range);
  return {
    dateFrom: range.from,
    dateTo: range.to,
  };
}

/**
 * Hook que retorna el queryKey completo para filtros de fecha
 * Útil para invalidar queries relacionadas con el período actual
 *
 * @example
 * ```typescript
 * const dateFilterKey = useDateFilterKey();
 * queryClient.invalidateQueries({ queryKey: ["metrics", ...dateFilterKey] });
 * ```
 */
export function useDateFilterKey(): [string, string] {
  const range = useDateFilterStore((state) => state.range);
  return [range.from, range.to];
}

/**
 * Hook que retorna true si hay un rango de fechas válido seleccionado
 */
export function useHasDateFilter(): boolean {
  const range = useDateFilterStore((state) => state.range);
  return !!range.from && !!range.to;
}

/**
 * Hook que retorna la cantidad de días en el período seleccionado
 */
export function useDateFilterDays(): number {
  const range = useDateFilterStore((state) => state.range);

  if (!range.from || !range.to) return 0;

  const from = new Date(range.from);
  const to = new Date(range.to);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return diffDays;
}
