/**
 * Demo Leads Hooks
 * TanStack Query hooks for Super Admin demo-leads management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDemoLeads,
  deleteDemoLead,
} from "@/features/auth/services/auth.service";
import { extractErrorMessage } from "@/lib/error.utils";

export const DEMO_LEADS_KEYS = {
  all: ["admin", "demo-leads"] as const,
  list: () => [...DEMO_LEADS_KEYS.all, "list"] as const,
};

/**
 * Hook to fetch demo leads (solo SUPER_ADMIN, el backend lo exige).
 */
export function useDemoLeads(enabled: boolean = true) {
  return useQuery({
    queryKey: DEMO_LEADS_KEYS.list(),
    queryFn: () => getDemoLeads(),
    enabled,
  });
}

/**
 * Hook to delete a demo lead.
 */
export function useDeleteDemoLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDemoLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.all });
      toast.success("Lead eliminado");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "No se pudo eliminar el lead"));
    },
  });
}
