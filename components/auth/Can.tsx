"use client";

import type { ReactNode } from "react";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";

interface CanProps {
  permission: string;
  children: ReactNode;
  /** Se muestra en vez de `children` cuando falta el permiso (default: nada). */
  fallback?: ReactNode;
}

/**
 * Gating de UI por permiso real (Fase C, Etapa 3), no por rol inferido a
 * mano — reemplaza el patrón `role === 'OWNER' || role === 'ADMIN' || ...`
 * repetido en el resto del admin. Mientras `useMyPermissions` está
 * cargando, no renderiza nada (evita el parpadeo de mostrar y ocultar un
 * botón de acción sensible).
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { hasPermission, isLoading } = useMyPermissions();

  if (isLoading) return null;
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
