"use client";

import { useCallback, useMemo } from "react";
import { useMessages } from "next-intl";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import {
  isNonOperational,
  permissionI18nKey,
} from "@/lib/permissions/permission-meta";

export interface PermissionMeta {
  label: string;
  description: string;
  isNonOperational: boolean;
}

interface PermissionCatalogMessages {
  [key: string]: { label?: string; description?: string } | undefined;
}

/**
 * Shared permission-catalog metadata for the operator-profile permission
 * selector and the read-only user permissions view.
 *
 * Uses `useMessages()` (a raw lookup) instead of `useTranslations()` +
 * `t()` because the API's permission catalog can contain codes that don't
 * have an i18n entry yet — `t()` throws on a missing message, while this
 * degrades to a fallback.
 */
export function usePermissionMeta() {
  const messages = useMessages();
  const isSuperAdmin = useIsSuperAdmin();

  const catalog = useMemo(
    () => (messages?.permissionCatalog ?? {}) as PermissionCatalogMessages,
    [messages]
  );
  const nonOperationalBadge =
    (catalog.nonOperational as { badge?: string; description?: string })
      ?.badge ?? "No operativo";
  const nonOperationalDescription =
    (catalog.nonOperational as { badge?: string; description?: string })
      ?.description ?? "";

  const getMeta = useCallback(
    (code: string, fallbackLabel?: string): PermissionMeta => {
      const entry = catalog[permissionI18nKey(code)];
      const nonOperational = isNonOperational(code);
      return {
        label: entry?.label ?? fallbackLabel ?? code,
        description: nonOperational
          ? nonOperationalDescription
          : (entry?.description ?? ""),
        isNonOperational: nonOperational,
      };
    },
    [catalog, nonOperationalDescription]
  );

  /** Non-operational permissions are hidden from anyone but SUPER_ADMIN. */
  const isVisible = useCallback(
    (code: string) => isSuperAdmin || !isNonOperational(code),
    [isSuperAdmin]
  );

  return useMemo(
    () => ({ isSuperAdmin, getMeta, isVisible, nonOperationalBadge }),
    [isSuperAdmin, getMeta, isVisible, nonOperationalBadge]
  );
}
