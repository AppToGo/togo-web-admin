/**
 * Branch Feature Types
 *
 * Tipado estricto para toda la feature de sucursales.
 * Basado en los DTOs del backend.
 */

import type { DeliveryConfig, BusinessHours, TransferOptions } from './branch-config.types';

/**
 * Información de una sucursal
 */
export interface Branch {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  code: string;
  isMainBranch: boolean;
  isActive: boolean;
  address: string | null;
  /** Department (state/province) of the branch location */
  department?: string | null;
  /** City of the branch location */
  city?: string | null;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  /** Teléfono de contacto de la sede (diferente al WhatsApp) */
  contactPhone?: string | null;
  /** Coordenadas geográficas de la sede */
  latitude?: number | null;
  longitude?: number | null;
  /** Configuración de envío */
  deliveryConfig?: DeliveryConfig;
  /** Horarios de atención */
  businessHours?: BusinessHours;
  /** Opciones de pago por transferencia */
  transferOptions?: TransferOptions;
}

/**
 * Respuesta de verificación de capacidad para crear sucursales
 */
export interface CanCreateBranchResponse {
  allowed: boolean;
  current: number;
  max: number;
  remaining: number;
  upgradePlan?: string;
}

/**
 * DTO para crear una nueva sucursal
 */
export interface CreateBranchRequest {
  name: string;
  slug: string;
  code: string;
  address?: string;
  /** Department (state/province) of the branch location */
  department?: string;
  /** City of the branch location */
  city?: string;
  timezone?: string;
  currency?: string;
  /** Teléfono de contacto de la sede */
  contactPhone?: string;
  /** Coordenadas geográficas de la sede */
  latitude?: number;
  longitude?: number;
  /** Configuración de envío */
  deliveryConfig?: DeliveryConfig;
  /** Horarios de atención */
  businessHours?: BusinessHours;
  /** Opciones de pago por transferencia */
  transferOptions?: TransferOptions;
}

/**
 * DTO para actualizar una sucursal existente
 */
export interface UpdateBranchRequest {
  name?: string;
  slug?: string;
  code?: string;
  address?: string;
  /** Department (state/province) of the branch location */
  department?: string;
  /** City of the branch location */
  city?: string;
  timezone?: string;
  currency?: string;
  isActive?: boolean;
  /** Teléfono de contacto de la sede */
  contactPhone?: string;
  /** Coordenadas geográficas de la sede */
  latitude?: number;
  longitude?: number;
  /** Configuración de envío */
  deliveryConfig?: DeliveryConfig;
  /** Horarios de atención */
  businessHours?: BusinessHours;
  /** Opciones de pago por transferencia */
  transferOptions?: TransferOptions;
}
