import { useCallback } from "react";
import { useTranslations } from "next-intl";

/**
 * Textos de los permisos de plataforma. Si un permiso nuevo aún no tiene
 * traducción se usa la descripción que envía el backend.
 */
export function usePlatformPermissionLabels() {
  const t = useTranslations("admin-internal-users");

  /** `platform.business.view` → `business` */
  const groupOf = useCallback((code: string) => code.split(".")[1] ?? "other", []);

  const labelOf = useCallback(
    (code: string, fallback: string) => {
      const key = `permissions.${code.replace(/\./g, "_")}`;
      return t.has(key) ? t(key) : fallback;
    },
    [t]
  );

  const groupLabel = useCallback(
    (group: string) => {
      const key = `permissionGroups.${group}`;
      return t.has(key) ? t(key) : group;
    },
    [t]
  );

  return { groupOf, labelOf, groupLabel };
}
