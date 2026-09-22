/**
 * `windowExpiresAt` viene del backend (`ServiceWindowService`): fin de la
 * ventana de servicio de 24 h de Meta, con la que se puede escribir texto libre
 * al cliente. `null` = el cliente nunca escribió o no hay dato.
 */
export function isWindowOpen(windowExpiresAt: string | null | undefined): boolean {
  if (!windowExpiresAt) return false;
  return new Date(windowExpiresAt).getTime() > Date.now();
}
