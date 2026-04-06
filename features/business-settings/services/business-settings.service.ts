/**
 * Business Settings Service
 *
 * Servicios para consumir los endpoints de configuración del negocio.
 */

import apiClient from '@/services/api.service';
import type { BusinessWithSettings, UpdateBusinessRequest } from '../types/business-settings.types';

/**
 * Obtener un negocio con su configuración completa
 */
export async function getBusiness(businessId: string): Promise<BusinessWithSettings> {
  const { data } = await apiClient.get<BusinessWithSettings>(`/businesses/${businessId}`);
  return data;
}

/**
 * Actualizar un negocio existente
 */
export async function updateBusiness(
  businessId: string,
  request: UpdateBusinessRequest
): Promise<BusinessWithSettings> {
  const { data } = await apiClient.patch<BusinessWithSettings>(`/businesses/${businessId}`, request);
  return data;
}
