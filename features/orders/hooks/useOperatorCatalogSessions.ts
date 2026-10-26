"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import {
  createOperatorCatalogSession,
  getMyOperatorCatalogSessions,
  revokeOperatorCatalogSession,
} from "../services/operator-catalog-session.service";

const SESSIONS_KEY = (businessId: string | null) =>
  ["operator-catalog-sessions", businessId] as const;

/** Mis sesiones activas del modo operador (para cerrarlas). */
export function useMyOperatorCatalogSessions(
  businessId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: SESSIONS_KEY(businessId),
    queryFn: () => getMyOperatorCatalogSessions(businessId!),
    enabled: enabled && !!businessId,
  });
}

export function useCreateOperatorCatalogSession(businessId: string | null) {
  const queryClient = useQueryClient();
  const t = useTranslations("orders.catalogSession");

  return useMutation({
    mutationFn: (data: { branchId: string; tableId?: string }) =>
      createOperatorCatalogSession(businessId!, data),
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("createError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY(businessId) });
    },
  });
}

export function useRevokeOperatorCatalogSession(businessId: string | null) {
  const queryClient = useQueryClient();
  const t = useTranslations("orders.catalogSession");

  return useMutation({
    mutationFn: (sessionId: string) =>
      revokeOperatorCatalogSession(businessId!, sessionId),
    onSuccess: () => toast.success(t("revoked")),
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("revokeError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY(businessId) });
    },
  });
}
