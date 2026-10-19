/**
 * Servicio de posibles clientes del modo demo (solo SUPER_ADMIN).
 */

import apiClient from "@/services/api.service";
import type { DemoLead } from "@/types/auth.types";

/**
 * Obtiene la lista de posibles clientes capturados en la demo (solo SUPER_ADMIN).
 */
export async function getDemoLeads(): Promise<DemoLead[]> {
  const response = await apiClient.get<DemoLead[]>("/admin/demo-leads");
  return response.data;
}

/**
 * Elimina un posible cliente de la demo (solo SUPER_ADMIN).
 */
export async function deleteDemoLead(id: string): Promise<void> {
  await apiClient.delete(`/admin/demo-leads/${id}`);
}
