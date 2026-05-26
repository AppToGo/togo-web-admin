// TODO: support multi-currency when platform expands beyond Colombia
export function formatSuggestedPrice(price: number | undefined | null): string {
  if (price == null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);
}
