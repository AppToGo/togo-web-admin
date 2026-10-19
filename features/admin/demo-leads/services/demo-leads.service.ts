/**
 * Servicio de posibles clientes del modo demo (solo SUPER_ADMIN).
 */

import apiClient from "@/services/api.service";
import type {
  DemoLead,
  DemoLeadDetail,
  DemoLeadFilters,
  DemoLeadNote,
  DemoLeadPipelineEntry,
  UpdateDemoLeadRequest,
} from "@/types/auth.types";

/**
 * Posibles clientes de la demo (solo SUPER_ADMIN).
 */
export async function getDemoLeads(
  filters: DemoLeadFilters = {},
): Promise<DemoLead[]> {
  const params = new URLSearchParams();
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.q) params.set("q", filters.q);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.overdueOnly) params.set("overdueOnly", "true");
  if (filters.includeRevoked) params.set("includeRevoked", "true");
  const query = params.toString();
  const response = await apiClient.get<DemoLead[]>(
    query ? `/admin/demo-leads?${query}` : "/admin/demo-leads",
  );
  return response.data;
}

/**
 * Conteo de leads por etapa del pipeline (solo SUPER_ADMIN).
 */
export async function getDemoLeadsPipeline(): Promise<DemoLeadPipelineEntry[]> {
  const response = await apiClient.get<DemoLeadPipelineEntry[]>(
    "/admin/demo-leads/pipeline",
  );
  return response.data;
}

/**
 * Detalle comercial del lead con ficha, resumen, sugerencia,
 * línea de tiempo y notas (solo SUPER_ADMIN).
 */
export async function getDemoLeadDetail(id: string): Promise<DemoLeadDetail> {
  const response = await apiClient.get<DemoLeadDetail>(
    `/admin/demo-leads/${id}`,
  );
  return response.data;
}

/**
 * Actualizar ficha comercial del lead (solo SUPER_ADMIN).
 */
export async function updateDemoLead(
  id: string,
  data: UpdateDemoLeadRequest,
): Promise<DemoLead> {
  const response = await apiClient.patch<DemoLead>(
    `/admin/demo-leads/${id}`,
    data,
  );
  return response.data;
}

/**
 * Agregar nota al lead (solo SUPER_ADMIN).
 */
export async function addDemoLeadNote(
  id: string,
  body: string,
): Promise<DemoLeadNote> {
  const response = await apiClient.post<DemoLeadNote>(
    `/admin/demo-leads/${id}/notes`,
    { body },
  );
  return response.data;
}

/**
 * Eliminar un lead de la demo (solo SUPER_ADMIN).
 */
export async function deleteDemoLead(id: string): Promise<void> {
  await apiClient.delete(`/admin/demo-leads/${id}`);
}
