/**
 * Hooks de TanStack Query para la gestión de posibles clientes de la demo (Mini CRM Super Admin).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getDemoLeads,
  getDemoLeadsPipeline,
  getDemoLeadDetail,
  updateDemoLead,
  addDemoLeadNote,
  deleteDemoLead,
} from "../services/demo-leads.service";
import type {
  DemoLeadFilters,
  UpdateDemoLeadRequest,
} from "@/types/auth.types";
import { extractErrorMessage } from "@/lib/error.utils";

export const DEMO_LEADS_KEYS = {
  all: ["admin", "demo-leads"] as const,
  list: (filters: DemoLeadFilters) =>
    [...DEMO_LEADS_KEYS.all, "list", filters] as const,
  pipeline: () => [...DEMO_LEADS_KEYS.all, "pipeline"] as const,
  detail: (id: string) => [...DEMO_LEADS_KEYS.all, "detail", id] as const,
};

function stableFilters(filters: DemoLeadFilters): DemoLeadFilters {
  return {
    stage: filters.stage,
    q: filters.q?.trim() || undefined,
    priority: filters.priority,
    overdueOnly: filters.overdueOnly || undefined,
    includeRevoked: filters.includeRevoked || undefined,
  };
}

/**
 * Hook para obtener posibles clientes de la demo con filtros comerciales
 * (solo SUPER_ADMIN, el backend lo exige).
 */
export function useDemoLeads(
  filters: DemoLeadFilters = {},
  enabled: boolean = true,
) {
  const stable = stableFilters(filters);
  return useQuery({
    queryKey: DEMO_LEADS_KEYS.list(stable),
    queryFn: () => getDemoLeads(stable),
    enabled,
  });
}

/**
 * Hook para obtener conteo del pipeline por etapa.
 */
export function useDemoLeadsPipeline(enabled: boolean = true) {
  return useQuery({
    queryKey: DEMO_LEADS_KEYS.pipeline(),
    queryFn: () => getDemoLeadsPipeline(),
    enabled,
  });
}

/**
 * Hook para obtener el detalle comercial de un lead.
 */
export function useDemoLeadDetail(id: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: DEMO_LEADS_KEYS.detail(id ?? ""),
    queryFn: () => getDemoLeadDetail(id as string),
    enabled: enabled && !!id,
  });
}

/**
 * Hook para actualizar la ficha comercial de un lead.
 */
export function useUpdateDemoLead() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-demo-leads");

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDemoLeadRequest }) =>
      updateDemoLead(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: DEMO_LEADS_KEYS.detail(variables.id),
      });
      toast.success(t("toasts.updated"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t("toasts.updateError")));
    },
  });
}

/**
 * Hook para agregar una nota a un lead.
 */
export function useAddDemoLeadNote() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-demo-leads");

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      addDemoLeadNote(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: DEMO_LEADS_KEYS.detail(variables.id),
      });
      toast.success(t("toasts.noteAdded"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t("toasts.noteError")));
    },
  });
}

/**
 * Hook para eliminar un posible cliente de la demo.
 */
export function useDeleteDemoLead() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-demo-leads");

  return useMutation({
    mutationFn: (id: string) => deleteDemoLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.all });
      toast.success(t("toasts.deleted"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t("toasts.deleteError")));
    },
  });
}
