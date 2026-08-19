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

interface OperatorProfilesMessages {
  domains?: Record<string, string>;
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
    // `fallback` is used for BOTH label and description when the code has
    // no curated i18n entry yet (e.g. the API's permission catalog added a
    // code before permissionCatalog.json was updated) — without this, a
    // missing entry silently rendered an empty description paragraph
    // instead of degrading to whatever text the caller has on hand.
    (code: string, fallback?: string): PermissionMeta => {
      const entry = catalog[permissionI18nKey(code)];
      const nonOperational = isNonOperational(code);
      return {
        label: entry?.label ?? fallback ?? code,
        description: nonOperational
          ? nonOperationalDescription
          : (entry?.description ?? fallback ?? ""),
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

  // Raw lookup (not t()) for the same reason as `catalog` above: an
  // untranslated domain must fall back to its raw code instead of
  // throwing. Was duplicated verbatim in PermissionSelector and
  // UserPermissionView before being centralized here.
  const domainMessages = (
    messages?.operatorProfiles as OperatorProfilesMessages | undefined
  )?.domains;
  const getDomainLabel = useCallback(
    (domain: string) => domainMessages?.[domain] ?? domain,
    [domainMessages]
  );

  return useMemo(
    () => ({
      isSuperAdmin,
      getMeta,
      isVisible,
      nonOperationalBadge,
      getDomainLabel,
    }),
    [isSuperAdmin, getMeta, isVisible, nonOperationalBadge, getDomainLabel]
  );
}
