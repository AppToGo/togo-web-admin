import { useMemo } from "react";
import { 
  formatDate as formatDateUtil, 
  type DateFormatPreset,
  type DateFormatOptions 
} from "@/lib/utils";

export type { DateFormatPreset, DateFormatOptions } from "@/lib/utils";

interface UseFormatDateOptions {
  preset?: DateFormatPreset;
  customOptions?: Partial<DateFormatOptions>;
}

/**
 * Hook to format a date with memoization
 * Returns "-" for null/undefined values
 * 
 * @example
 * // Default full format
 * const formattedDate = useFormatDate(customer?.createdAt);
 * // "24 de marzo de 2026"
 * 
 * // Short format
 * const shortDate = useFormatDate(order?.date, { preset: "short" });
 * // "24 mar 2026"
 * 
 * // Month and year only
 * const monthYear = useFormatDate(invoice?.date, { preset: "monthYear" });
 * // "mar 2026"
 */
export function useFormatDate(
  date: Date | string | null | undefined,
  options: UseFormatDateOptions = {}
): string {
  const { preset = "full", customOptions } = options;
  
  return useMemo(() => formatDateUtil(date, preset, customOptions), [date, preset, customOptions]);
}

interface UseFormatDatesOptions {
  preset?: DateFormatPreset;
  customOptions?: Partial<DateFormatOptions>;
}

/**
 * Hook to format multiple dates at once
 * Useful when you need to format several dates in the same component
 * 
 * @example
 * const formattedDates = useFormatDates({
 *   createdAt: customer?.createdAt,
 *   updatedAt: customer?.updatedAt,
 * }, { preset: "short" });
 * // formattedDates.createdAt -> "24 mar 2026"
 */
export function useFormatDates<T extends Record<string, Date | string | null | undefined>>(
  dates: T,
  options: UseFormatDatesOptions = {}
): { [K in keyof T]: string } {
  const { preset = "full", customOptions } = options;
  
  return useMemo(() => {
    const result = {} as { [K in keyof T]: string };
    for (const key in dates) {
      result[key] = formatDateUtil(dates[key], preset, customOptions);
    }
    return result;
  }, [Object.values(dates), preset, customOptions]);
}
