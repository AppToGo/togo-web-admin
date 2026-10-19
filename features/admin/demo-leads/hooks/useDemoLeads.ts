/**
 * Hooks de TanStack Query para la gestión de posibles clientes de la demo (Super Admin).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getDemoLeads,
  deleteDemoLead,
} from "../services/demo-leads.service";
import { extractErrorMessage } from "@/lib/error.utils";

export const DEMO_LEADS_KEYS = {
  all: ["admin", "demo-leads"] as const,
  list: () => [...DEMO_LEADS_KEYS.all, "list"] as const,
};

/**
 * Hook para obtener posibles clientes de la demo (solo SUPER_ADMIN, el backend lo exige).
 */
export function useDemoLeads(enabled: boolean = true) {
  return useQuery({
    queryKey: DEMO_LEADS_KEYS.list(),
    queryFn: () => getDemoLeads(),
    enabled,
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
      toast.success(t("deleteSuccess"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t("deleteError")));
    },
  });
}
