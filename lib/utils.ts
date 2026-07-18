import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DateFormatPreset = "full" | "short" | "monthYear" | "numeric";

export interface DateFormatOptions {
  year?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  day?: "numeric" | "2-digit";
}

const DATE_FORMAT_PRESETS: Record<DateFormatPreset, DateFormatOptions> = {
  full: { year: "numeric", month: "long", day: "numeric" },      // 24 de marzo de 2026
  short: { year: "numeric", month: "short", day: "numeric" },    // 24 mar 2026
  monthYear: { year: "numeric", month: "short" },                  // mar 2026
  numeric: { year: "numeric", month: "2-digit", day: "2-digit" }, // 24/03/2026
};

/**
 * Format date to locale string
 * Returns "-" for null/undefined values
 * 
 * @param date - Date to format
 * @param preset - Predefined format preset
 * @param customOptions - Custom format options (overrides preset)
 */
export function formatDate(
  date: Date | string | null | undefined,
  preset: DateFormatPreset = "full",
  customOptions?: Partial<DateFormatOptions>
): string {
  if (!date) return "-";
  
  const options = { ...DATE_FORMAT_PRESETS[preset], ...customOptions };
  return new Date(date).toLocaleDateString("es-ES", options);
}

/**
 * Format currency to COP
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}
