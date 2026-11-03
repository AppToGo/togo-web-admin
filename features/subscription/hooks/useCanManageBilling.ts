"use client";

import { useHasRole } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";

/**
 * Quién puede ver el modal de plan y las opciones de "actualizar plan".
 *
 * Hoy solo el dueño del negocio (OWNER) o quien tenga permiso de
 * facturación (`billing.manage`, el mismo que gestiona la suscripción).
 * Centraliza el criterio para no repetirlo en cada CTA.
 *
 * `isLoading` es true mientras llegan `/auth/me/permissions`: hasta
 * entonces `hasPermission` responde false y no se puede decidir para un
 * no-OWNER. Quien decida algo visible (modal, toast) debe esperar a que
 * termine; para render condicional basta `canManage`.
 */
export function useCanManageBilling(): { canManage: boolean; isLoading: boolean } {
  const isOwner = useHasRole("OWNER");
  const { hasPermission, isLoading } = useMyPermissions();
  return { canManage: isOwner || hasPermission("billing.manage"), isLoading };
}
