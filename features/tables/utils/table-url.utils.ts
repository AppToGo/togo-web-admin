/**
 * URL del QR imprimible de una mesa (Fase 2, docs/architecture/pedidos-en-mesa.md).
 *
 * Espeja la lógica de `CatalogLinkService.buildTableQrUrl()` en api-togo
 * (src/web-catalog/services/catalog-link.service.ts): omite el segmento de
 * sede cuando el negocio tiene una sola sede activa — mismo criterio que ya
 * usa el catálogo web para auto-resolverse sin segmento. No hace falta
 * pegarle al backend para armar esta URL: es determinística a partir de
 * slugs + código de mesa, que el admin ya tiene en memoria.
 */
export function buildTableQrUrl(params: {
  baseUrl: string;
  businessSlug: string;
  branchSlug: string;
  tableCode: string;
  /** true si el negocio tiene más de una sede activa (incluye el segmento de sede) */
  isMultiBranch: boolean;
}): string {
  const { baseUrl, businessSlug, branchSlug, tableCode, isMultiBranch } = params;
  const path = isMultiBranch ? `${businessSlug}/${branchSlug}` : businessSlug;
  const trimmedBase = baseUrl.replace(/\/$/, "");
  return `${trimmedBase}/${path}?table=${encodeURIComponent(tableCode)}&source=qr`;
}
