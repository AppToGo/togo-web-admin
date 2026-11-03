"use client";

import { useHasRole } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";

/**
 * Quién puede ver el modal de plan y las opciones de "actualizar plan".
 *
 * Hoy solo el dueño del negocio (OWNER) o quien tenga permiso de
 * facturación (`billing.manage`, el mismo que gestiona la suscripción).
 * Centraliza el criterio para no repetirlo en cada CTA.
 */
export function useCanManageBilling(): boolean {
  const isOwner = useHasRole("OWNER");
  const { hasPermission } = useMyPermissions();
  return isOwner || hasPermission("billing.manage");
}
