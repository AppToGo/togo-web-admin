"use client";

import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "../stores/auth.store";
import { getMyPermissions } from "../services/auth.service";

const STALE_TIME = 5 * 60 * 1000; // 5 min: los permisos de un usuario cambian con poca frecuencia

/**
 * Permisos efectivos del usuario autenticado (Fase C, Etapa 3) — infra
 * transversal, no específica del inbox. Reemplaza el patrón "comparar
 * user.role a mano" repetido en Sidebar/OrderDetailContent/conversations
 * page por gating basado en permisos reales del backend.
 */
export function useMyPermissions() {
  const isAuthenticated = useIsAuthenticated();

  const query = useQuery<string[], Error>({
    queryKey: ["auth", "me", "permissions"],
    queryFn: getMyPermissions,
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
  });

  return {
    ...query,
    permissions: query.data ?? [],
    hasPermission: (code: string) => (query.data ?? []).includes(code),
  };
}
