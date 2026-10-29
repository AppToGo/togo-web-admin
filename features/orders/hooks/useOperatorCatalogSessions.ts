"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import {
  createOperatorCatalogSession,
  getMyOperatorCatalogSessions,
  getOperatorCatalogSessionAudit,
  getOperatorCatalogSessionOptions,
  revokeOperatorCatalogSession,
} from "../services/operator-catalog-session.service";
import type { CreateOperatorCatalogSessionInput } from "../types";

const SESSIONS_KEY = (businessId: string | null) =>
  ["operator-catalog-sessions", businessId] as const;

/**
 * Operadores y ventana de la sede. La ventana depende de la hora actual:
 * se pide de nuevo cada vez que se abre el diálogo.
 */
export function useOperatorCatalogSessionOptions(
  businessId: string | null,
  branchId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["operator-catalog-session-options", businessId, branchId],
    queryFn: () => getOperatorCatalogSessionOptions(businessId!, branchId!),
    enabled: enabled && !!businessId && !!branchId,
    staleTime: 0,
    gcTime: 0,
  });
}

/** Mis sesiones activas y las que abrí para otros (para cerrarlas). */
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
    mutationFn: (data: CreateOperatorCatalogSessionInput) =>
      createOperatorCatalogSession(businessId!, data),
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("createError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY(businessId) });
    },
  });
}

/**
 * Auditoría de habilitaciones. El servidor solo la entrega al dueño; el
 * `enabled` además la pide únicamente cuando corresponde mostrarla.
 */
export function useOperatorCatalogSessionAudit(
  businessId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["operator-catalog-session-audit", businessId],
    queryFn: () => getOperatorCatalogSessionAudit(businessId!),
    enabled: enabled && !!businessId,
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
