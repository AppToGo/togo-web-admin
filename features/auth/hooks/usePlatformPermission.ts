import { useCallback } from "react";
import { useIsRootSuperAdmin } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "./useMyPermissions";

/**
 * Permisos de plataforma (`platform.*`) del personal de ToGo. El SUPER_ADMIN
 * los tiene todos; un usuario interno, los de su perfil (vienen en
 * /auth/me/permissions). El backend aplica la regla real; esto es la UX.
 */
export function usePlatformPermissions() {
  const isRoot = useIsRootSuperAdmin();
  const { hasPermission, isLoading } = useMyPermissions();

  const can = useCallback(
    (...codes: string[]) => isRoot || codes.some((code) => hasPermission(code)),
    [isRoot, hasPermission]
  );

  return { can, isLoading: !isRoot && isLoading };
}

export function usePlatformPermission(...codes: string[]) {
  const { can, isLoading } = usePlatformPermissions();
  return { allowed: can(...codes), isLoading };
}
