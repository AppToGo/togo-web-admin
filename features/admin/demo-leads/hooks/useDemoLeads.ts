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
  createDemoLead,
  updateDemoLead,
  addDemoLeadAction,
  setDemoLeadActionDone,
  deleteDemoLeadAction,
  addDemoLeadNote,
  deleteDemoLead,
  generateDemoLeadWhatsAppDrafts,
  logDemoLeadWhatsAppOutreach,
  searchScoutProspects,
  importScoutProspects,
} from "../services/demo-leads.service";
import type {
  CreateDemoLeadRequest,
  DemoLead,
  DemoLeadFilters,
  UpdateDemoLeadRequest,
  GenerateWhatsAppDraftsRequest,
  LogWhatsAppOutreachRequest,
  ScoutSearchRequest,
  ScoutImportRequest,
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
  enabled: boolean = true
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
 * Acciones de seguimiento de un lead: agregar, resolver y eliminar. Cada
 * cambio recalcula la próxima acción del lead, así que se invalida también
 * el listado (la tarjeta del tablero la muestra).
 */
export function useDemoLeadActions(leadId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-demo-leads");
  // Devuelve la promesa: la mutación sigue pendiente hasta tener los datos
  // nuevos, así la casilla no vuelve atrás un instante.
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.all });
  const onError = (error: unknown) =>
    toast.error(extractErrorMessage(error, t("toasts.actionError")));

  const add = useMutation({
    mutationFn: (data: { title: string; dueAt?: string }) =>
      addDemoLeadAction(leadId, data),
    onSuccess: refresh,
    onError,
  });
  const setDone = useMutation({
    mutationFn: ({ actionId, done }: { actionId: string; done: boolean }) =>
      setDemoLeadActionDone(leadId, actionId, done),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: (actionId: string) => deleteDemoLeadAction(leadId, actionId),
    onSuccess: refresh,
    onError,
  });
  return { add, setDone, remove };
}

/** `leadId` del lead que ya tiene ese número, si la creación dio 409. */
export function existingLeadIdOf(error: unknown): string | null {
  const response = (
    error as { response?: { status?: number; data?: { leadId?: unknown } } }
  )?.response;
  return response?.status === 409 && typeof response.data?.leadId === "string"
    ? response.data.leadId
    : null;
}

/**
 * Hook para crear un posible cliente a mano. Un 409 (número repetido) no
 * muestra toast: el formulario ofrece abrir la ficha existente.
 */
export function useCreateDemoLead() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-demo-leads");

  return useMutation<DemoLead, unknown, CreateDemoLeadRequest>({
    mutationFn: (data) => createDemoLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.all });
      toast.success(t("toasts.created"));
    },
    onError: (error) => {
      if (existingLeadIdOf(error)) return;
      toast.error(extractErrorMessage(error, t("toasts.createError")));
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

/**
 * Hook para generar borradores personalizados de WhatsApp con el agente ToGo.
 * Al completarse invalida el detalle del lead para reflejar los borradores persistidos.
 */
export function useGenerateWhatsAppDrafts(leadId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-demo-leads");

  return useMutation({
    mutationFn: (data: GenerateWhatsAppDraftsRequest = {}) =>
      generateDemoLeadWhatsAppDrafts(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DEMO_LEADS_KEYS.detail(leadId),
      });
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t("toasts.draftsError")));
    },
  });
}

/**
 * Hook para registrar automáticamente el envío por WhatsApp y actualizar el estado del lead.
 */
export function useLogWhatsAppOutreach() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-demo-leads");

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: LogWhatsAppOutreachRequest;
    }) => logDemoLeadWhatsAppOutreach(id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: DEMO_LEADS_KEYS.detail(variables.id),
      });
      toast.success(t("toasts.outreachLogged"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t("toasts.outreachError")));
    },
  });
}

/**
 * Hook para buscar o extraer prospectos con ToGo Scout.
 */
export function useScoutSearch() {
  const t = useTranslations("admin-demo-leads");

  return useMutation({
    mutationFn: (data: ScoutSearchRequest) => searchScoutProspects(data),
    onError: (error) => {
      toast.error(extractErrorMessage(error, t("toasts.scoutSearchError")));
    },
  });
}

/**
 * Hook para importar prospectos seleccionados desde ToGo Scout al Mini CRM.
 */
export function useScoutImport() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-demo-leads");

  return useMutation({
    mutationFn: (data: ScoutImportRequest) => importScoutProspects(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.all });
      toast.success(
        t("toasts.scoutImported", { count: res.createdCount })
      );
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t("toasts.scoutImportError")));
    },
  });
}
