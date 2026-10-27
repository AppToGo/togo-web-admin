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
  CreateDemoLeadRequest,
  DemoLeadAction,
  GenerateWhatsAppDraftsRequest,
  WhatsAppDraftsResponse,
  LogWhatsAppOutreachRequest,
  LogWhatsAppOutreachResponse,
  ScoutSearchRequest,
  ScoutSearchResponse,
  ScoutImportRequest,
  ScoutImportResponse,
} from "@/types/auth.types";
import type { DemoLeadOwnerOption } from "@/types/auth.types";

/**
 * Posibles clientes de la demo (solo SUPER_ADMIN).
 */
export async function getDemoLeads(
  filters: DemoLeadFilters = {}
): Promise<DemoLead[]> {
  const params = new URLSearchParams();
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.q) params.set("q", filters.q);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.overdueOnly) params.set("overdueOnly", "true");
  if (filters.includeRevoked) params.set("includeRevoked", "true");
  const query = params.toString();
  const response = await apiClient.get<DemoLead[]>(
    query ? `/admin/demo-leads?${query}` : "/admin/demo-leads"
  );
  return response.data;
}

/**
 * Conteo de leads por etapa del pipeline (solo SUPER_ADMIN).
 */
export async function getDemoLeadsPipeline(): Promise<DemoLeadPipelineEntry[]> {
  const response = await apiClient.get<DemoLeadPipelineEntry[]>(
    "/admin/demo-leads/pipeline"
  );
  return response.data;
}

/**
 * Detalle comercial del lead con ficha, resumen, sugerencia,
 * línea de tiempo y notas (solo SUPER_ADMIN).
 */
export async function getDemoLeadDetail(id: string): Promise<DemoLeadDetail> {
  const response = await apiClient.get<DemoLeadDetail>(
    `/admin/demo-leads/${id}`
  );
  return response.data;
}

/** Agregar una acción de seguimiento al lead. */
export async function addDemoLeadAction(
  id: string,
  data: { title: string; dueAt?: string }
): Promise<DemoLeadAction> {
  const response = await apiClient.post<DemoLeadAction>(
    `/admin/demo-leads/${id}/actions`,
    data
  );
  return response.data;
}

/** Marcar una acción como resuelta (o pendiente otra vez). */
export async function setDemoLeadActionDone(
  id: string,
  actionId: string,
  done: boolean
): Promise<DemoLeadAction> {
  const response = await apiClient.patch<DemoLeadAction>(
    `/admin/demo-leads/${id}/actions/${actionId}`,
    { done }
  );
  return response.data;
}

export async function deleteDemoLeadAction(
  id: string,
  actionId: string
): Promise<void> {
  await apiClient.delete(`/admin/demo-leads/${id}/actions/${actionId}`);
}

/**
 * Crear un posible cliente a mano (solo SUPER_ADMIN). 409 con `leadId` si
 * ya existe uno con ese número.
 */
export async function createDemoLead(
  data: CreateDemoLeadRequest
): Promise<DemoLead> {
  const response = await apiClient.post<DemoLead>("/admin/demo-leads", data);
  return response.data;
}

/**
 * Actualizar ficha comercial del lead (solo SUPER_ADMIN).
 */
export async function updateDemoLead(
  id: string,
  data: UpdateDemoLeadRequest
): Promise<DemoLead> {
  const response = await apiClient.patch<DemoLead>(
    `/admin/demo-leads/${id}`,
    data
  );
  return response.data;
}

/**
 * Agregar nota al lead (solo SUPER_ADMIN).
 */
export async function addDemoLeadNote(
  id: string,
  body: string
): Promise<DemoLeadNote> {
  const response = await apiClient.post<DemoLeadNote>(
    `/admin/demo-leads/${id}/notes`,
    { body }
  );
  return response.data;
}

/**
 * Eliminar un lead de la demo (solo SUPER_ADMIN).
 */
export async function deleteDemoLead(id: string): Promise<void> {
  await apiClient.delete(`/admin/demo-leads/${id}`);
}

/**
 * Harvey Writer/Handler: genera 3 borradores de WhatsApp según la etapa y el contexto del lead.
 */
export async function generateDemoLeadWhatsAppDrafts(
  id: string,
  data: GenerateWhatsAppDraftsRequest = {}
): Promise<WhatsAppDraftsResponse> {
  const response = await apiClient.post<WhatsAppDraftsResponse>(
    `/admin/demo-leads/${id}/whatsapp-drafts`,
    data
  );
  return response.data;
}

/**
 * Registra automáticamente el envío del mensaje por wa.me y actualiza la etapa del lead.
 */
export async function logDemoLeadWhatsAppOutreach(
  id: string,
  data: LogWhatsAppOutreachRequest
): Promise<LogWhatsAppOutreachResponse> {
  const response = await apiClient.post<LogWhatsAppOutreachResponse>(
    `/admin/demo-leads/${id}/whatsapp-outreach`,
    data
  );
  return response.data;
}

/**
 * Harvey Scout: busca prospectos en Google Places o extrae de texto con IA.
 */
export async function searchScoutProspects(
  data: ScoutSearchRequest
): Promise<ScoutSearchResponse> {
  const response = await apiClient.post<ScoutSearchResponse>(
    "/admin/demo-leads/scout/search",
    data
  );
  return response.data;
}

/**
 * Harvey Scout: importa en lote los prospectos seleccionados al Mini CRM.
 */
export async function importScoutProspects(
  data: ScoutImportRequest
): Promise<ScoutImportResponse> {
  const response = await apiClient.post<ScoutImportResponse>(
    "/admin/demo-leads/scout/import",
    data
  );
  return response.data;
}

/**
 * Responsables posibles de un lead: solo personal de ToGo (super admin y
 * usuarios internos con acceso a posibles clientes).
 */
export async function getDemoLeadOwners(): Promise<DemoLeadOwnerOption[]> {
  const response = await apiClient.get<DemoLeadOwnerOption[]>("/admin/demo-leads/owners");
  return response.data;
}
