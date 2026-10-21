/**
 * Montos de IA en USD: una llamada cuesta fracciones de centavo, así que
 * debajo de un dólar se muestran hasta 4 decimales.
 */
export function formatUsd(
  value: number | null | undefined,
  locale = "es",
  /** "$" en vez de "US$", para ejes de gráficos. */
  compact = false
): string {
  if (value === null || value === undefined) return "–";
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-CO", {
    style: "currency",
    currency: "USD",
    currencyDisplay: compact ? "narrowSymbol" : "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.abs(value) < 1 && value !== 0 ? 4 : 2,
  }).format(value);
}

export function formatCount(
  value: number,
  locale = "es",
  maximumFractionDigits = 0
): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-CO", {
    maximumFractionDigits,
  }).format(value);
}
