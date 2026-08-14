/**
 * Table Mutations Hooks
 *
 * Pedidos en mesa (docs/architecture/pedidos-en-mesa.md, Fase 1).
 * Mismo patrón que branch-inventory: invalidate-on-success (sin optimistic
 * UI) — el volumen esperado de mesas por sede es bajo, no justifica la
 * complejidad de rollback optimista.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createTable, updateTable, removeTable } from "../services/table.service";
import { TABLES_KEYS } from "./query-keys";
import type { CreateTableRequest, UpdateTableRequest } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

export function useCreateTable(businessId: string, branchId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("tables");

  return useMutation({
    mutationFn: (data: CreateTableRequest) => createTable(businessId, branchId, data),
    onSuccess: (table) => {
      queryClient.invalidateQueries({
        queryKey: TABLES_KEYS.byBranch(businessId, branchId),
      });
      toast.success(t("createSuccess", { name: table.name }));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.createFailed"));
    },
  });
}

export function useUpdateTable(businessId: string, branchId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("tables");

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTableRequest }) =>
      updateTable(businessId, branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TABLES_KEYS.byBranch(businessId, branchId),
      });
      toast.success(t("updateSuccess"));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.updateFailed"));
    },
  });
}

export function useRemoveTable(businessId: string, branchId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("tables");

  return useMutation({
    mutationFn: (id: string) => removeTable(businessId, branchId, id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: TABLES_KEYS.byBranch(businessId, branchId),
      });
      // Regla 7: una mesa con pedidos históricos se desactiva en vez de
      // borrarse — el toast debe reflejar cuál de los dos pasó.
      toast.success(result.deactivated ? t("deactivateSuccess") : t("deleteSuccess"));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.deleteFailed"));
    },
  });
}
